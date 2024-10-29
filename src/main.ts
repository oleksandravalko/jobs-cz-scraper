import { Actor, Dataset, log, RequestQueue } from 'apify';
import { CheerioCrawler, KeyValueStore, PuppeteerCrawler } from 'crawlee';
import type { Input } from './types.js';
import { defaultInput, REQUEST_LABELS, REQUEST_QUEUE_KEYS } from './constants.js';
import { formSearchUrl } from './utils.js';
import { router } from './routes.js';

await Actor.init();

const input = (await Actor.getInput<Input>()) ?? defaultInput;

const entryPageUrl = formSearchUrl(input);

const proxyConfiguration = await Actor.createProxyConfiguration({
    groups: ['RESIDENTIAL'],
    countryCode: 'CZ',
});

const cheerioRequestQueue = await RequestQueue.open(REQUEST_QUEUE_KEYS.cheerio);
if (!cheerioRequestQueue.isEmpty()) { await cheerioRequestQueue.drop(); }
await cheerioRequestQueue.addRequests([{
    url: entryPageUrl,
    label: REQUEST_LABELS.entry,
    userData: {
        input,
    },
}]);
const cheerioCrawler = new CheerioCrawler({
    requestQueue: cheerioRequestQueue,
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

const puppeteerRequestQueue = await RequestQueue.open(REQUEST_QUEUE_KEYS.puppeteer);
if (!puppeteerRequestQueue.isEmpty()) { await puppeteerRequestQueue.drop(); }
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
        const { page, request, response } = context;

        const html = await page.content();
        await KeyValueStore.setValue('html', html);
        const status = response?.status();
        setTimeout(() => { log.info(`Reached ${request.url} with puppeteer. Status: ${status}.`); }, 1000);
    },
});

log.info(`Starting the crawl from the search page: ${entryPageUrl}`);
await cheerioCrawler.run();

log.info(`Proceeding with puppeteerCrawler handling ${puppeteerRequestQueue.getTotalCount()} requests.`);
await puppeteerCrawler.run();

await Actor.exit();
