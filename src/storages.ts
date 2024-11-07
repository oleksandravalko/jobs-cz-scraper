import { Actor, log, RequestQueue } from 'apify';

const savedId = await Actor.getValue<string>('RQ_ID');
log.info(`ID pulled out of storage ${savedId}`);

const getNewId = async () => {
    const queueInfo = await Actor.apifyClient.requestQueues().getOrCreate();
    return queueInfo.id;
};

const currId = savedId || await getNewId();
log.info(`currId = savedId || newID ${currId}`);

if (currId !== savedId) {
    await Actor.setValue('RQ_ID', currId);
}

export const puppeteerRequestQueue = await RequestQueue.open(currId);
