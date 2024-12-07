import { Actor, log } from 'apify';
import { CheerioCrawler, PuppeteerCrawler } from 'crawlee';
import type { Input, Job } from './types.js';
import { BASE_URL, REQUEST_LABELS } from './constants.js';
import { formatDescription, formEntryRequests, formSearchUrl } from './utils.js';
import { router } from './routes.js';
import { puppeteerRequestQueue } from './storages.js';

const { searchUrls, ...jobSearchParams } = (await Actor.getInput<Input>())!;

const entryRequests = [];

const parametersBasedEntryUrl = formSearchUrl(jobSearchParams);
const parametersBasedEntryRequest = {
    url: parametersBasedEntryUrl,
    label: REQUEST_LABELS.ENTRY,
    userData: {
        jobSearchParams,
    },
};

// include the broadest search link (base url) only if user provided urls are not present
if (parametersBasedEntryUrl !== BASE_URL || (parametersBasedEntryUrl === BASE_URL && !searchUrls.length)) {
    entryRequests.push(parametersBasedEntryRequest);
}

const userProvidedUrlsRequests = searchUrls ? formEntryRequests(searchUrls) : [];

if (searchUrls.length) {
    entryRequests.push(...userProvidedUrlsRequests);
}

const proxyConfiguration = await Actor.createProxyConfiguration();

const cheerioCrawler = new CheerioCrawler({
    proxyConfiguration,
    maxConcurrency: 50,
    requestHandler: router,
});

const startLog = `Starting with URLS: ${entryRequests.join(', ')}`;
log.info(startLog);

await cheerioCrawler.addRequests(entryRequests);

await cheerioCrawler.run();

// start crawler only if it has requests to handle
if (puppeteerRequestQueue.getTotalCount()) {
    log.info(`Entering puppeteerCrawler with requests queue ID: ${puppeteerRequestQueue?.id} containing ${puppeteerRequestQueue.getTotalCount()} requests.`);
    const puppeteerCrawler = new PuppeteerCrawler({
        requestQueue: puppeteerRequestQueue,
        proxyConfiguration,
        preNavigationHooks: [
            async ({ blockRequests }) => {
                await blockRequests();
            },
        ],
        requestHandler: async (context) => {
            const { page, request } = context;

            await page.waitForNetworkIdle({
                timeout: 60000,
                idleTime: 1000,
            });

            const rawDescription = await page.evaluate(() => {
                let description = '';
                const possibleSelectors = ['#vacancy-detail', '#widget_container', 'body']; // pool is based on observation, backed up by <body>
                for (const selector of possibleSelectors) {
                    if (!description) {
                        description = document.querySelector(selector)?.textContent || '';
                    }
                }
                return description;
            });

            const job: Job = {
                ...request.userData.jobData,
                description: formatDescription(rawDescription),
            };

            await Actor.pushData(job);
        },
    });

    await puppeteerCrawler.run();
}
