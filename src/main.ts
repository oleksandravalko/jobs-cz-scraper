import { Actor, log } from 'apify';
import { CheerioCrawler, PuppeteerCrawler } from 'crawlee';
import type { Input, Job } from './types.js';
import { BASE_URL, DEFAULT_INPUT, REQUEST_LABELS } from './constants.js';
import { formatDescription, formEntryRequests, formSearchUrl } from './utils.js';
import { router } from './routes.js';
import { puppeteerRequestQueue } from './storages.js';

const { searchUrls, ...jobSearchParams } = await Actor.getInput<Input>() ?? DEFAULT_INPUT;

const entryRequests = [];

const parametersBasedEntryUrl = formSearchUrl(jobSearchParams);
const parametersBasedEntryRequest = {
    url: parametersBasedEntryUrl,
    label: REQUEST_LABELS.entry,
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

const proxyConfiguration = await Actor.createProxyConfiguration({
    countryCode: 'CZ',
});

const cheerioCrawler = new CheerioCrawler({
    proxyConfiguration,
    maxRequestRetries: 3,
    maxConcurrency: 50,
    requestHandler: router,
});

await cheerioCrawler.addRequests(entryRequests);

log.info(`Starting the cheerioCrawler with ${entryRequests.length} search page(s).`);
await cheerioCrawler.run();

// start crawler only if it has requests to handle
if (puppeteerRequestQueue.getTotalCount()) {
    const puppeteerCrawler = new PuppeteerCrawler({
        requestQueue: puppeteerRequestQueue,
        proxyConfiguration,
        maxRequestRetries: 3,
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

    log.info(`Proceeding with the puppeteerCrawler handling ${puppeteerRequestQueue.getTotalCount()} request(s).`);
    await puppeteerCrawler.run();
}
