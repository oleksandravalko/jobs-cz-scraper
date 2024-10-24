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

export const LABELS = {
    entry: 'ENTRY',
    list: 'LIST',
    detail: 'DETAIL',
};

export const defaultWageRange: WageRange = {
    minWage: 'N/a',
    maxWage: 'N/a',
};
