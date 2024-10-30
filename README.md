Here is the text rewritten with better English, preserving the original markup:

# Jobs.cz Scraper
TypeScript Crawlee & CheerioCrawler & PuppeteerCrawler

### Context
Jobs.cz is an online job vacancies platform. It hosts job opportunities from across the Czech Republic and various industries. It can be considered the largest platform of its kind in the country, with typically around 17,000 openings listed at a given time.

### Function
This scraper collects information about open positions. It supports filtering based on search parameters provided as input, which map to the options available on the Jobs.cz website.

### Mechanism
1. The actor forms the search URL based on the filtering parameters provided as input.
    * If jobs are found, the actor calculates the total number of pages and enqueues links to them.
    * If the provided location parameter cannot be effectively inserted into the URL, the actor continues the search without it.
    * If the parameters are valid but no relevant jobs are found, the user is informed and asked to change the parameters.
2. The actor visits all the search results pages, including those provided directly by the user, and scrapes the core information.
3. The actor proceeds to the job detail pages.
    * Job detail pages come in two types: standard and customized.
    - The Cheerio crawler is used for standard pages, and Puppeteer for customized ones.

### Notes
* The maximum number of found and saved jobs is 1,350, as Jobs.cz won't display more than 45 pages with 30 jobs each.
* The location filtering functionality is limited but covers all major cities, towns, and regions. Input of more than one location is not supported.
* Input of more than one keyword in the job/employer field is not supported.
* The location and keyword restrictions of the Actor can be overcome by providing search URLs directly in the input.

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
    "arrangement": "mostly-from-home",
    "searchUrls": [
        {
            "url": "https://www.jobs.cz/prace/?locality%5Bcode%5D=M220896&locality%5Blabel%5D=Statenice%2C%20okres%20Praha-z%C3%A1pad&locality%5Bcoords%5D=50.14257%2C14.31853&locality%5Bradius%5D=0"
        },
        {
            "url": "https://www.jobs.cz/prace/?locality%5Bcode%5D=M220896&locality%5Blabel%5D=Statenice%2C%20okres%20Praha-z%C3%A1pad&locality%5Bcoords%5D=50.14257%2C14.31853&locality%5Bradius%5D=0"
        }
    ]
}
```

### Dataset item example:
```json
{
    "id": 1347196974,
    "link": "https://www.jobs.cz/rpd/1347196974/?searchId=913cccc0-2416-4c69-bc8f-f02c31ada060&rps=233",
    "employer": "D.A.S. právní ochrana, pobočka ERGO Versicherung Aktiengesellschaft pro ČR",
    "title": "VEDOUCÍ OBCHODNÍ SKUPINY / OBCHODNÍ ZÁSTUPCE – Liberecký kraj",
    "locality": "Liberec – Liberec IV-Perštýn",
    "isWage": true,
    "minWage": 40000,
    "maxWage": 80000,
    "description": "D.A.S. právní ochrana, pobočka ERGO Versicherung Aktiengesellschaft pro ČR, největší evropský specialista na právní ochranu.VEDOUCÍ OBCHODNÍ SKUPINY / OBCHODNÍ ZÁSTUPCE – Liberecký krajMáte rád/a výzvy? Jste zaměřen/a na výsledky? Přes 29 let zajišťuje společnost D.A.S. našim klientům jediné pojištění právní ochrany. Bráníme slušné lidi před nespravedlivostí, nesmysly, byrokracií a neférovým přístupem. Chcete pomáhat lidem a organizacím? Je obchod součástí Vašeho životního stylu? Máte rád/a vliv na výši svého příjmu? Pokud ano, vypadá to, že hledáme právě Vás. Vaším denním chlebem bude: Hledání nových klientůZjištění potřeb klienta pro volbu té nejvhodnější službyPéče o stávající klienty🎯 Vaším výsledkem práce bude uzavřená smlouva a posilování dobrého jména značky D.A.S. Za svojí prací uvidíte klienty, kteří se díky Vám a službám D.A.S. cítí v bezpečí. Dostanete podporu od našich expertů, veškeré potřebné zaškolení a vedoucího, na kterého se budete moci obrátit. Dáváme prostor pro kariérní růst, čekají Vás odměny za dosažené výsledky a podporujeme Váš úspěch systematickým vzděláváním. Po úvodním zaškolení na pozici obchodního zástupce se můžete stát vedoucím obchodní skupiny, který do svého týmu nabírá nové kolegy a vede je k výsledkům. Tato pozice je významně podpořena speciálními školeními zaměřenými na leadership. Zajímá Vás víc o D.A.S.? Tak pokračujte sem 👉 www.das.cz/o-nas/ Dejte vědět, že máte o pozici zájem a dozvíte se více. Klikněte na tlačítko „Odpovědět“ a my se Vám ozveme.Informace o poziciTyp úvazkuPráce na plný úvazek, Práce na zkrácený úvazekTyp smluvního vztahupráce na živnostenský list (IČO)Délka pracovního poměruNa dobu neurčitouMzda40000 - 80000 Kč / měsícBenefityProvize z prodeje, Vzdělávací kurzy, školeníPožadované vzděláníStředoškolské nebo odborné vyučení s maturitouZadavatelD.A.S. právní ochrana, pobočka ERGO Versicherung Aktiengesellschaft pro ČRMísto pracovištěRumunská 655/9, 46001, Liberec - Liberec IV-Perštýn, okres Liberec, Česká republika© Seznam.cz, a.s., 2024, © OpenStreetMap contributorsKontaktD.A.S. právní ochrana, pobočka ERGO Versicherung Aktiengesellschaft pro ČRJan NechanskýOdpovědětZpět na výpis pozic"
}
```
