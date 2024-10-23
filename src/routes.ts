import { createCheerioRouter } from 'crawlee';
import { log } from 'apify';
import { LABELS } from './constants.js';
import { formSearchUrl, pagesAmount } from './utils.js';
import { Request } from './types.js';

export const router = createCheerioRouter();

router.addHandler(LABELS.entry, async ({ $, crawler, request }) => {
    log.debug('Reached ENTRY route.');
    // provided location produce invalid URL
    if ($('title').text().trim() === 'Stránka nenalezena') {
        log.error('Invalid job filtering link. Removing location parameter and redirecting back to search results page with your other filters applied.');
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

    if (totalJobsAmountElement) {
        // jobs were found correctly
        const totalJobsAmount = Number(totalJobsAmountElement.text().trim());
        const totalPagesAmount = pagesAmount(totalJobsAmount);
        log.info(`Total number of jobs found on page ${totalPagesAmount}: ${totalJobsAmount}`);

        const entryPageUrl = request.url;
        const pageLinks: Request[] = [
            {
                url: entryPageUrl,
                label: LABELS.consequent,
            },
        ];

        if (totalPagesAmount > 1) {
            for (let i = 2; i <= totalPagesAmount; i++) {
                pageLinks.push({
                    url: `${entryPageUrl}&page=${i}`,
                    label: LABELS.consequent,
                    userData: {
                        pageNumber: i,
                    },
                });
            }
        }

        log.info(`Page link(s) added to requestQueue: ${pageLinks.length}.`);

        await crawler.addRequests(pageLinks);
    } else {
        // URL is valid, but no relevant jobs were found
        log.warning('No matching jobs found. Please modify your search parameters and try again.');
    }
});

// router.addHandler(LABELS.consequent, async ({ $, crawler, request }) => {
//     const jobsElements = $('div#productDescription');
//     log.info(`Total number of jobs found on page ${request.userData.pageNumber} is ${jobsElements.length}`);
// });
