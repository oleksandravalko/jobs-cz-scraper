import { Actor } from 'apify';
import { RequestQueueV1 } from 'crawlee';

export const puppeteerRequestQueue = await RequestQueueV1.open(
    `jobs-cz-detail-${Actor.isAtHome() ? Actor.getEnv().actorRunId : Date.now()}`,
);
