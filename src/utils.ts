import { JobSearchParams, UserProvidedUrl, WageRange } from './types.js';
import { BASE_URL, JOBS_PER_PAGE, REQUEST_LABELS } from './constants.js';

export const formSearchUrl = (jobSearchParams: JobSearchParams) => {
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
    } = jobSearchParams;

    const baseUrl = locality ? `${BASE_URL}${locality.toLowerCase().replace(' ', '-')}/` : BASE_URL;

    const searchParams = new URLSearchParams();

    // adding individual items to searchParams
    if (keyword) searchParams.append('q[]', keyword.replace(' ', '-'));
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

export const formEntryRequestsUrls = (urlArray: UserProvidedUrl[]) => {
    const requests = [];

    for (const url of urlArray) {
        requests.push(
            {
                ...url,
                label: REQUEST_LABELS.entry,
            },
        );
    }

    return requests;
};

export const pagesAmount = (jobsAmount: number) => {
    return Math.ceil(jobsAmount / JOBS_PER_PAGE);
};

export const formWageRange = (wageString:string) => {
    const cleanString = wageString
        .trim()
        .replace(/&nbsp;/g, '')
        .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '')
        .replace(/\s+/g, '')
        .replace('Kč', '');

    let range: WageRange|undefined;

    if (cleanString.includes('–')) {
        const extremes = cleanString.split('–');
        range = {
            minWage: Number(extremes[0]),
            maxWage: Number(extremes[1]),
        };
    } else {
        range = {
            minWage: Number(cleanString),
            maxWage: Number(cleanString),
        };
    }
    return range;
};

export const formatDescription = (description: string) => {
    return description.trim()
        .replace(/&nbsp;/g, ' ')
        .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '')
        .replace(/\s+/g, ' ');
};
