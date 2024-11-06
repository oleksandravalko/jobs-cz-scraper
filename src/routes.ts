import { createCheerioRouter } from 'crawlee';
import { Actor, log } from 'apify';
import { BASE_URL, defaultWageRange, MAX_PAGES_AMOUNT, REQUEST_LABELS } from './constants.js';
import { formatDescription, formSearchUrl, formWageRange, pagesAmount } from './utils.js';
import type { Job, WageRange } from './types.js';
import { puppeteerRequestQueue } from './storages.js';

export const router = createCheerioRouter();

router.addHandler(REQUEST_LABELS.ENTRY, async ({ $, crawler, request }) => {
    const entryPageUrl = request.url;

    // provided locality produce invalid URL
    if ($('title').text().trim() === 'Stránka nenalezena') {
        log.info(`Search page ${entryPageUrl} => Invalid job filtering link.`);
        log.info(`Removing locality parameter and redirecting back to search results page with your other filters applied.`);
        const inputWithoutLocality = { ...request.userData.input, locality: '', radius: '' };

        const newEntryUrl = formSearchUrl(inputWithoutLocality);
        log.info(`New entry link without locality parameter: ${newEntryUrl}.`);

        await crawler.addRequests([
            {
                url: newEntryUrl,
                label: REQUEST_LABELS.ENTRY,
                userData: {
                    inputWithoutLocation: inputWithoutLocality,
                },
            },
        ]);

        return;
    }

    // URL is valid, but no relevant jobs were found or other issue happened
    const alertContent = $('.Alert').text().trim();
    if (alertContent) {
        switch (alertContent) {
            case 'Nenašli jsme žádné nabídky práce odpovídající zadání': {
                log.info('No matching jobs found. Please provide with a link or modify your search parameters and try again.');
                return;
            }
            case 'Zadaná stránka už není dostupná.': {
                log.info('Page is not accessible. Continuing crawling without scraping jobs on that page.');
                return;
            }
            default: {
                log.info(`Issue on the page ${entryPageUrl}: '${alertContent}'`);
                return;
            }
        }
    }

    // no parameters or user urls provided
    if (entryPageUrl === BASE_URL) {
        const pageLinks = [];
        for (let i = 1; i <= MAX_PAGES_AMOUNT; i++) {
            pageLinks.push({
                url: `${BASE_URL}?page=${i}`,
                label: REQUEST_LABELS.LIST,
            });
        }
        log.info(`Search Page has no filtering parameters => ${MAX_PAGES_AMOUNT} list pages enqueued.`);
        await crawler.addRequests(pageLinks);
        return;
    }

    // relevant jobs are found
    const totalJobsAmountElement = $('.SearchHeader strong');
    if (totalJobsAmountElement.length) {
        const totalJobsAmount = Number(totalJobsAmountElement.text().trim().replace(/&nbsp;/g, '')) || 1;
        const totalPagesAmount = pagesAmount(totalJobsAmount);
        const pageLinks = [];
        if (totalPagesAmount) {
            for (let i = 1; i <= totalPagesAmount; i++) {
                pageLinks.push({
                    url: `${entryPageUrl}&page=${i}`,
                    label: REQUEST_LABELS.LIST,
                });
            }
        }

        log.info(`Search Page ${entryPageUrl} => ${totalPagesAmount} list pages enqueued.`);

        await crawler.addRequests(pageLinks);
    }
});

router.addHandler(REQUEST_LABELS.LIST, async ({ $, crawler, request }) => {
    const jobsElements = $('article.SearchResultCard');

    const detailRequests = [];

    for (const item of jobsElements) {
        const jobElement = $(item);

        const titleElement = jobElement.find('h2[data-test-ad-title] a');
        const id = Number(titleElement.attr('data-jobad-id'));
        const link = titleElement.attr('href') || `jobs.cz/prace/rpd/${id}`;
        const title = titleElement.text().replace(/\s+/g, ' ').trim();

        const employerElement = jobElement.find('.SearchResultCard__footerItem>span');
        const employer = employerElement.text().trim();

        const localityElement = jobElement.find('li[data-test="serp-locality"]');
        const locality = localityElement.text().trim();

        const wageElement = jobElement.find('.SearchResultCard__body span.Tag--success');
        const isWage = !!wageElement.length;
        const wageRange: WageRange = isWage ? formWageRange(wageElement.text()) : { ...defaultWageRange };

        const detailPageRequest = {
            url: link,
            label: REQUEST_LABELS.DETAIL,
            userData: {
                jobData: {
                    id,
                    link,
                    employer,
                    title,
                    locality,
                    isWage,
                    ...wageRange,
                },
            },
        };
        detailRequests.push(detailPageRequest);
    }

    log.info(`List Page ${request.url} => ${jobsElements.length} job(s) in total.`);

    await crawler.addRequests(detailRequests);
});

router.addHandler(REQUEST_LABELS.DETAIL, async ({ $, request }) => {
    const isJobsCz = $('meta[content="Jobs.cz"]').length; // determine if it's standard or customized template

    if (!isJobsCz) {
        // Cheerio crawler cannot reach dynamic content of pages with custom templates, so those request are handed to Puppeteer.
        log.info(`Custom template page => added to Puppeteer RQ: ${request.url}.`);
        await puppeteerRequestQueue.addRequests([{
            url: request.url,
            userData: request.userData,
        }]);

        return;
    }

    let rawDescription = '';

    const descriptionPartElements = $('div[data-visited-position]>div');
    for (let i = 0; i < 4; i++) {
        rawDescription += $(descriptionPartElements[i]).text(); // only the first 4 elements have needed content
    }

    const description = formatDescription(rawDescription);

    const job: Job = {
        ...request.userData.jobData,
        description,
    };

    await Actor.pushData(job);
});
