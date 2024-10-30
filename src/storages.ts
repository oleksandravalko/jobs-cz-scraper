import { Actor } from 'apify';

export const puppeteerRequestQueue = await Actor.openRequestQueue(
    `jobs-cz-detail-${Actor.isAtHome() ? Actor.getEnv().actorRunId : Date.now()}`,
);
