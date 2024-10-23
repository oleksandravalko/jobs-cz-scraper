import { Input } from './types.js';
import { JOBS_PER_PAGE } from './constants.js';

export const formSearchUrl = (inputObject: Input) => {
    const {
        locality,
        radius,
        keyword,
        date,
        salary,
        employment,
        contract,
        education,
        languageSkill,
        arrangement,
    } = inputObject;

    const baseUrl = locality ? `https://www.jobs.cz/prace/${locality.toLowerCase()}/` : 'https://www.jobs.cz/prace/';

    const searchParams = new URLSearchParams();

    // adding individual items to searchParams
    if (keyword) searchParams.append('q[]', keyword);
    if (date) searchParams.append('date', date.toString());
    if (salary) searchParams.append('salary', salary.toString());

    employment?.forEach((option) => {
        const key = employment.length === 1 ? 'employment' : 'employment[]';
        searchParams.append(key, option);
    });

    contract?.forEach((option) => {
        searchParams.append('contract', option);
    });

    if (education) searchParams.append('education', education);
    languageSkill?.forEach((lang) => {
        const key = languageSkill.length === 1 ? 'language-skill' : 'language-skill[]';
        searchParams.append(key, lang);
    });

    if (arrangement) searchParams.append('arrangement', arrangement);

    if (locality && radius) searchParams.append('locality[radius]', radius.toString());

    // returning combined baseUrls with searchParams
    const url = new URL(baseUrl);
    url.search = searchParams.toString();

    return url.toString();
};

export const pagesAmount = (jobsAmount: number) => {
    return Math.ceil(jobsAmount / JOBS_PER_PAGE);
};

export const formatPriceRange = (wageString:string) => {
    return wageString
        .trim()
        .replace(/&nbsp;/g, '')
        .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '')
        .replace(/\s+/g, '')
        .replace(/Kč/, ' Kč');
};
