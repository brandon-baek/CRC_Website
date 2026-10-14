# Daily bulletin

`refresh-daily.yml` starts every day at 06:00 America/Los_Angeles (PST in winter,
PDT in summer). GitHub schedules are best effort; the source capture and Cloudflare
build take additional time. 06:20 and 07:20 runs retry a missing edition or fortune.
Manual runs and changes to the collector also refresh the package.

The collector renders four days of official NWS Los Angeles forecast data in °F.
Bing does not reliably return its weather box to unattended servers. It captures
USD/KRW from the Wise widget used by Korea Times, and the three official California
Lottery cards. The rate is a reference conversion rate, not a bank cash rate.
Original source URLs, observed values, and capture timestamps are recorded in the
edition for diagnosis. No screenshot is generated from invented numbers.

News uses the existing local-topic, editorial, language and duplicate filters.
Today's fortune must match the Los Angeles calendar date. Radio Korea stocks use
the newest published report available by capture time, including Friday on weekends
and the preceding trading day before a new report is released. The original date
remains visible. Missing fortune links are omitted, never replaced with yesterday's.

The generated `src/data/dailyEdition.json` contains the complete package. It is
written only after all three captures validate, and committed only after the site
build succeeds. A source/capture failure leaves the previous edition and its date
intact. Capture requests retry up to three times. Workflow failures appear in
GitHub Actions and use the repository's existing notification settings.

The six-hour fraud-news workflow is unchanged. Other site builds read the saved
daily edition, so images and headlines stay together. To refresh manually, run
**Daily bulletin at 6am Pacific** in GitHub Actions. No developer computer or paid
API credentials are required. The preview branch `codex/daily-refresh` runs the
same capture and publishes only to that branch.
