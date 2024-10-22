import { Actor, log } from 'apify';
import { Input } from './types.js';

await Actor.init();

const input = (await Actor.getInput<Input>())!;

log.info(input.keyword);
