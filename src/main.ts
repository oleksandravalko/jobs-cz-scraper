import { Actor, log } from 'apify';
import { CheerioCrawler, PuppeteerCrawler } from 'crawlee';
import { Page } from 'puppeteer';
import type { Input, Job } from './types.js';
import { defaultInput, REQUEST_LABELS } from './constants.js';
import { formatDescription, formSearchUrl } from './utils.js';
import { router } from './routes.js';
import { puppeteerRequestQueue } from './storages.js';

const input = (await Actor.getInput<Input>()) ?? defaultInput;

const entryPageUrl = formSearchUrl(input);

const proxyConfiguration = await Actor.createProxyConfiguration({
    groups: ['RESIDENTIAL'],
    countryCode: 'CZ',
});

const cheerioCrawler = new CheerioCrawler({
    proxyConfiguration,
    sessionPoolOptions: {
        persistStateKey: 'JOBS-SESSIONS-CHEERIO',
        sessionOptions: {
            maxUsageCount: 5,
            maxErrorScore: 1,
        },
    },
    maxConcurrency: 50,
    requestHandler: router,
});

await cheerioCrawler.addRequests([{
    url: entryPageUrl,
    label: REQUEST_LABELS.entry,
    userData: {
        input,
    },
}]);

log.info(`Starting the cheerioCrawler from the search page: ${entryPageUrl}`);
await cheerioCrawler.run();

const puppeteerCrawler = new PuppeteerCrawler({
    requestQueue: puppeteerRequestQueue,
    proxyConfiguration,
    maxRequestRetries: 0,
    sessionPoolOptions: {
        persistStateKey: 'JOBS-SESSIONS-PUPPETEER',
        sessionOptions: {
            maxUsageCount: 3,
            maxErrorScore: 1,
        },
    },
    headless: false,
    requestHandler: async (context) => {
        const { page, request } = context;

        await page.waitForNetworkIdle({ idleTime: 1000 });

        const rawDescription = await page.evaluate(() => {
            const possibleSelectors = ['#vacancy-detail', 'main', '.main', 'body']; // pool is based on observation, backed up by <body>
            let currDescription = '';
            for (const selector of possibleSelectors) {
                if (!currDescription) {
                    currDescription = document.querySelector(selector)?.textContent || '';
                }
            }
            return currDescription;
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

await puppeteerRequestQueue.drop();
