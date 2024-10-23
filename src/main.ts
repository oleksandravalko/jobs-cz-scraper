import { Actor, log } from 'apify';
import { CheerioCrawler } from 'crawlee';
import { Input } from './types.js';
import { defaultInput, LABELS } from './constants.js';
import { formSearchUrl } from './utils.js';
import { router } from './routes.js';

await Actor.init();

const input = (await Actor.getInput<Input>()) ?? defaultInput;

const entryPageUrl = formSearchUrl(input);

const proxyConfiguration = await Actor.createProxyConfiguration({
    groups: ['RESIDENTIAL'],
    countryCode: 'CZ',
});

const crawler = new CheerioCrawler({
    proxyConfiguration,
    sessionPoolOptions: {
        persistStateKey: 'JOBS-SESSIONS',
        sessionOptions: {
            maxUsageCount: 5,
            maxErrorScore: 1,
        },
    },
    maxConcurrency: 50,
    requestHandler: router,
});

await crawler.addRequests([
    {
        url: entryPageUrl,
        label: LABELS.entry,
        userData: {
            input,
        },
    },
]);

log.info('Starting the crawl from the search page:', { url: entryPageUrl });

await crawler.run();

await Actor.exit();
