# Jobs.cz Scraper
TypeScript Crawlee & CheerioCrawler

### Context
Jobs.cz is online job vacancies platform. Job opportunities from all across the Czech Republic and industries can be found there. It can be considered the biggest server of its kind in the country, as in general, there are about 17 000 openings listed at a given moment.

### Function
This scraper collects information about open positions. Filtering in search query is available, and it maps onto options provided by jobs.cz website.
### Mechanism
1. Actor forms url based on filtering parameters provided in input.
   * If jobs are found, actor calculates total number of pages and enqueues links to them;
   * If provided location parameter cannot be inserted in url effectively, actor with continues with search without it.
   * If parameters are valid, but there are no relevant jobs to be found, user will be informed about it and asked to change parameters.
2. Actor visits all search results pages, scraping core information.
3. Actor continues to the job detail pages, and if they are of standard type, more information about jobs is scraped. Otherwise, a part of job information remains blanc.
### Notes
* Maximum amount of found and, as the result, saved jobs is 1350, as website won't display more than 45 pages, 30 jobs each.
* Filtering by location functionality is limited, but it covers all major cities, towns and regions. Input of more than one location is not supported.
* Input of more than one keyword in job/employer field is not supported.

### Input example:

```json
{
    "locality": "Praha",
    "radius": "0",
    "keyword": "Skladnik",
    "date": "3d",
    "salary": "30000",
    "employment": ["full", "part"],
    "contract": ["employment_contract"],
    "education": "high",
    "languageSkill": ["en"],
    "arrangement": "mostly-from-home"
}
```

### Dataset item example:
```json
{
    "id": "2000386924",
    "link": "https://jobs.cz/prace/rpd/2000386924",
    "employer": "COLD GROUP s.r.o",
    "title": "Realitní Makléř specializující se na prodej Dubajských nemovitostí pro Českou klientelu",
    "location": "Praha – Stodůlky",
    "wage": "200 000 ‍–‍ 400 000 Kč",
    "employment": "Práce na plný úvazek",
    "contract": "Práce na živnostenský list (IČO)",
    "arrangement": "Možnost občasné práce z domova"
}
```
