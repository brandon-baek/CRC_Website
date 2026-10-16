# Daily collection

The four Korean-American publishers are collected directly: Korea Daily's home/society/economy/life pages; Korea Times LA's home, society, economy, education, health and life pages; Radio Korea's all/recent/local lists; and Koreatown Press's town/local/USA/immigration/Korea sections. Google News remains supplemental. Direct newspaper article reads use four workers and at most 120 candidates per publisher; Radio Korea uses four workers and at most 100. This is a bounded collection, not a claim that every published article is captured.

Korean-American coverage has first priority, then U.S./local coverage, then useful Korea-related information such as health, travel, nationality and exchange rates. Within each priority group, newest publication dates come first. Up to 40 main stories are displayed; fewer are permitted when fewer qualify. Political, promotional, commercial-author and organization-announcement exclusions still apply. The dedicated sports/entertainment section retains its separate selection rules.

The current edition contains current-day and held overnight stories. At the first morning publication, a previously unseen article from the preceding 48 hours can also be included. `publishedHistory` records normalized headline and URL keys for 30 days; only a publishable edition updates this ledger. Collection into the overnight pending queue does not mark an article published. Previously displayed stories do not re-enter later editions. The 6am–5pm Los Angeles publishing window remains unchanged.

Korea Times' unlabelled clock is not treated as a verified timezone. Its displayed date is stored as `publicationDay` and an ISO date-only `date`; it must not be presented as a precise timestamp. Other sources with explicit timezones retain their original timestamps. Publication dates are never rewritten to make an article appear new.

Run `scripts/test-direct-daily.ts`, `scripts/test-daily-selection.ts`, `scripts/test-news-authors.ts` and `scripts/test-news-editorial.ts`. `collectionCounts` records pre-filter per-source candidate counts (including duplicates), not displayed-story counts. No AI API is used by the collection scripts.
