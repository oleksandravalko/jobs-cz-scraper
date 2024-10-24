import { createCheerioRouter } from 'crawlee';
import { Actor, log } from 'apify';
import { defaultWageRange, LABELS } from './constants.js';
import { formWageRange, formSearchUrl, pagesAmount } from './utils.js';
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

        log.info(`Page link(s) added to requestQueue: ${pageLinks.length}.`);

        await crawler.addRequests(pageLinks);
    } else {
        // URL is valid, but no relevant jobs were found
        log.warning('No matching jobs found. Please modify your search parameters and try again.');
    }
});

router.addHandler(LABELS.list, async ({ $, request }) => {
    const jobsElements = $('article.SearchResultCard');

    log.info(`Visiting page #${request.userData.pageNumber} by link ${request.url}.`);
    log.info(`Page #${request.userData.pageNumber}: ${jobsElements.length} job(s) in total.`);

    const jobs: Job[] = [];

    for (const item of jobsElements) {
        const jobElement = $(item);
        const titleElement = jobElement.find('h2[data-test-ad-title] a');
        const id = Number(titleElement.attr('data-jobad-id'));
        log.info(`Id: ${id}`);
        const link = titleElement.attr('href') || `jobs.cz/prace/rpd/${id}`;
        log.info(`Link: ${link}`);
        const title = titleElement.text().replace(/\s+/g, ' ').trim();
        log.info(`Title: ${title}`);
        const employerElement = jobElement.find('.SearchResultCard__footerItem>span');
        const employer = employerElement.text().trim();
        log.info(`Employer: ${employer}`);
        const localityElement = jobElement.find('li[data-test="serp-locality"]');
        const locality = localityElement.text().trim();
        log.info(`Locality: ${locality}`);
        const wageElement = jobElement.find('.SearchResultCard__body span.Tag--success');
        const isWage = !!wageElement.length;

        const wageRange: WageRange = isWage ? formWageRange(wageElement.text()) : defaultWageRange;

        log.info(`Wage: ${wageRange.minWage} - ${wageRange.maxWage}`);

        jobs.push({
            id,
            link,
            employer,
            title,
            locality,
            isWage,
            ...wageRange,
            detail: 'string',
        });
    }
    await Actor.pushData(jobs);
});
