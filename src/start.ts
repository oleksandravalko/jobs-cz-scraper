import { Actor } from 'apify';

await Actor.init();
await import('./main.js');
await Actor.exit();
