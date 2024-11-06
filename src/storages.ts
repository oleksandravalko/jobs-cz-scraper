import { Actor } from 'apify';

export const puppeteerRequestQueueId = (await Actor.apifyClient.requestQueues().getOrCreate()).id;
