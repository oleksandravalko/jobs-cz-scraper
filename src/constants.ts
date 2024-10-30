import { WageRange } from './types.js';

export const JOBS_PER_PAGE = 30;

export const defaultInput = {
    locality: '',
    radius: '',
    keyword: '',
    date: '',
    salary: '',
    employment: [],
    contract: [],
    education: '',
    languageSkill: [],
    arrangement: '',
};

export const REQUEST_LABELS = {
    entry: 'ENTRY',
    list: 'LIST',
    detail: 'DETAIL',
};

export const defaultWageRange: WageRange = {
    minWage: 'N/a',
    maxWage: 'N/a',
};

export const possibleSelectors = ['#vacancy-detail', '#widget_container', 'body']; // pool is based on observation, backed up by <body>
