import { Actor, log, RequestQueue } from 'apify';
import { CheerioCrawler, PuppeteerCrawler } from 'crawlee';
import type { Input, Job } from './types.js';
import { defaultInput, REQUEST_LABELS, REQUEST_QUEUE_KEYS } from './constants.js';
import { formatDescription, formSearchUrl } from './utils.js';
import { router } from './routes.js';
import { myRq } from './storages.js';

const input = (await Actor.getInput<Input>()) ?? defaultInput;

const entryPageUrl = formSearchUrl(input);

const proxyConfiguration = await Actor.createProxyConfiguration({
    groups: ['RESIDENTIAL'],
    countryCode: 'CZ',
});

// const cheerioRequestQueue = await RequestQueue.open(REQUEST_QUEUE_KEYS.cheerio);
// await cheerioRequestQueue.addRequests([{
//     url: entryPageUrl,
//     label: REQUEST_LABELS.entry,
//     userData: {
//         input,
//     },
// }]);

const cheerioCrawler = new CheerioCrawler({
    // requestQueue: cheerioRequestQueue,
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

const puppeteerRequestQueue = await RequestQueue.open(REQUEST_QUEUE_KEYS.puppeteer);

const puppeteerCrawler = new PuppeteerCrawler({
    requestQueue: myRq,
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
        await page.waitForNetworkIdle();

        const rawDescription = await page.evaluate(() => {
            return document.querySelector('#vacancy-detail')?.textContent;
        });

        const job: Job = {
            ...request.userData.jobData,
            description: rawDescription ? formatDescription(rawDescription) : '',
        };

        await Actor.pushData(job);
    },
});

log.info(`Proceeding with the puppeteerCrawler handling ${myRq.getTotalCount()} request(s).`);
await puppeteerCrawler.run();

await puppeteerRequestQueue.drop();
