import { Actor } from 'apify';

export const myRq = await Actor.openRequestQueue(
    `jobs-cz-detail-${Actor.isAtHome() ? Actor.getEnv().actorRunId : Date.now()}`,
);
