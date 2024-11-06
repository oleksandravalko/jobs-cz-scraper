import { WageRange } from './types.js';

export const BASE_URL = 'https://www.jobs.cz/prace/';

export const JOBS_PER_PAGE = 30;

export const MAX_PAGES_AMOUNT = 45;

export const REQUEST_LABELS = {
    entry: 'ENTRY',
    list: 'LIST',
    detail: 'DETAIL',
};

export const defaultWageRange: WageRange = {
    minWage: 'N/a',
    maxWage: 'N/a',
};
