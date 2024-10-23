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
