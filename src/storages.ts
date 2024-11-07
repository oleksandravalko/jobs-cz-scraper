import { Actor, RequestQueue } from 'apify';

const savedId = await Actor.getValue<string>('RQ_ID');

const getNewId = async () => {
    const queueInfo = await Actor.apifyClient.requestQueues().getOrCreate();
    return queueInfo.id;
};

const currId = savedId || await getNewId();

if (currId !== savedId) {
    await Actor.setValue('RQ_ID', currId);
}

export const puppeteerRequestQueue = await RequestQueue.open(currId);
