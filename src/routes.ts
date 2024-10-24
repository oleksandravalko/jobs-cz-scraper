import { createCheerioRouter } from 'crawlee';
import { Actor, log } from 'apify';
import { defaultWageRange, LABELS } from './constants.js';
import { formatDescription, formSearchUrl, formWageRange, pagesAmount } from './utils.js';
import { Job, Request, WageRange } from './types.js';

export const router = createCheerioRouter();

router.addHandler(LABELS.entry, async ({ $, crawler, request }) => {
    // provided locality produce invalid URL
    if ($('title').text().trim() === 'Stránka nenalezena') {
        log.error('Invalid job filtering link. Removing locality parameter and redirecting back to search results page with your other filters applied.');
        const inputWithoutLocation = { ...request.userData.input, locality: '', radius: '' };

        const newEntryUrl = formSearchUrl(inputWithoutLocation);
        log.info(`New entry link without location parameter: ${newEntryUrl}.`);

        await crawler.addRequests([
            {
                url: newEntryUrl,
                label: LABELS.entry,
                userData: {
                    inputWithoutLocation,
                },
            },
        ]);

        return;
    }

    const totalJobsAmountElement = $('.SearchHeader strong');

    if (totalJobsAmountElement.length) {
        // jobs were found
        const totalJobsAmount = Number(totalJobsAmountElement.text().trim()) || 1;
        const totalPagesAmount = pagesAmount(totalJobsAmount);
        log.info(`${totalJobsAmount} jobs found on ${totalPagesAmount} pages of search results.`);

        const entryPageUrl = request.url;
        const pageLinks: Request[] = [];

        for (let i = 1; i <= totalPagesAmount; i++) {
            pageLinks.push({
                url: `${entryPageUrl}&page=${i}`,
                label: LABELS.list,
                userData: {
                    pageNumber: i,
                },
            });
        }

        log.info(`Search results page link(s) added to requestQueue: ${pageLinks.length}.`);

        await crawler.addRequests(pageLinks);
    } else {
        // URL is valid, but no relevant jobs were found
        log.warning('No matching jobs found. Please provide with a link or modify your search parameters and try again.');
    }
});

router.addHandler(LABELS.list, async ({ $, crawler, request }) => {
    const jobsElements = $('article.SearchResultCard');

    log.info(`Page #${request.userData.pageNumber}: ${jobsElements.length} job(s) in total.`);

    const detailRequests: Request[] = [];

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
        const wageRange: WageRange = isWage ? formWageRange(wageElement.text()) : defaultWageRange;

        const detailPageRequest: Request = {
            url: link,
            label: LABELS.detail,
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

    await crawler.addRequests(detailRequests);
});

router.addHandler(LABELS.detail, async ({ $, request }) => {
    let rawDescription = '';

    if (request.url.startsWith('https://www.jobs.cz/')) {
        // more specific selection thanks to the standard jobs.cz template
        const descriptionPartElements = $('div[data-visited-position]>div');
        for (let i = 0; i < 4; i++) {
            rawDescription += $(descriptionPartElements[i]).text();
        }
    } else {
        // List of selectors is based on the observation. Assumptions:
        // 1. Every page has <body>, so 'body' is default selector;
        // 2. For other selectors, there is only one element returned, if any.
        const possibleDescriptionSelectors = ['body', '.main', '#main', 'main', '#vacancy-detail'];

        for (const selector of possibleDescriptionSelectors) {
            const altElement = $(selector);
            if (altElement.length) {
                rawDescription = altElement.text();
            }
        }
    }

    const description = formatDescription(rawDescription);

    const job: Job = {
        ...request.userData.jobData,
        description,
    };

    await Actor.pushData(job);
});
