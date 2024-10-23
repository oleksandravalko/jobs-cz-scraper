import { createCheerioRouter } from 'crawlee';
import { log } from 'apify';
import { LABELS } from './constants.js';
import { pagesAmount } from './utils.js';
import { Request } from './types.js';

export const router = createCheerioRouter();

router.addHandler(LABELS.entry, async ({ $, crawler, request }) => {
    const totalJobsAmount = Number($('.SearchHeader strong').text().trim());
    const totalPagesAmount = pagesAmount(totalJobsAmount);

    log.info('Total number of jobs found on page', { totalJobsAmount });

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
            });
        }
        await crawler.addRequests(pageLinks);
    }
});
