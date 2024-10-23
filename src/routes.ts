import { createCheerioRouter } from 'crawlee';
import { log } from 'apify';
import { LABELS } from './constants.js';
import { formSearchUrl, pagesAmount } from './utils.js';
import { Request } from './types.js';

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
        // jobs were found correctly
        const totalJobsAmount = Number(totalJobsAmountElement.text().trim());
        const totalPagesAmount = pagesAmount(totalJobsAmount);
        log.info(`Total number of jobs found ${totalJobsAmount}, ${totalPagesAmount} pages of search results.`);

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

    log.info(`Visiting page number ${request.userData.pageNumber} by link ${request.url}.`);
    log.info(`Total number of jobs found on page ${request.userData.pageNumber}: ${jobsElements.length}.`);
});
