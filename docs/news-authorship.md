# Korean-American news authorship

The four Korean-American news outlets exclude identified commercial contributors from Daily News, scam news, and sports/entertainment. Articles with unidentified authors are allowed, subject to the existing political and promotional exclusions. This applies to saved editions and new collections. The dedicated fortune and stock-report links are unchanged.

`newsAuthors.ts` checks the article's author metadata, byline fields, job titles, reporter profile links and explicit contributor credits. Business roles override reporter evidence, including mixed coauthors. Merely quoting a business owner in an otherwise reporter-written article does not disqualify it. Unavailable pages, failed Google redirects, missing bylines and ambiguous author names do not disqualify an article on authorship grounds. This does not verify that an unidentified author is a reporter.

The exact Medicare column reported by CRC is additionally blocked by normalized title and publisher URLs. Existing political and promotional exclusions still apply. English sources and official agency releases retain their separate existing eligibility rules.

Checks use ordinary publisher requests with four concurrent lookups and a per-build cache; no AI service is used. The parser relies on publisher metadata and markup, so fixtures should be updated if an outlet changes its byline layout. Run `scripts/test-news-authors.ts` and `scripts/test-news-editorial.ts`.
