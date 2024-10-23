export type Input = {
    locality: string,
    radius: string,
    keyword: string,
    date: string,
    salary: string,
    employment: string[],
    contract: string[],
    education: string,
    languageSkill: string[],
    arrangement: string
}

export type Request = {
    url: string,
    label: string,
    userData?: Record<string, string|number>
}

export type Job = {
    id: number;
    link: string;
    employer: string;
    title: string;
    locality: string;
    wage: string;
    employment: string;
    contract: string;
    arrangement: string;
}
