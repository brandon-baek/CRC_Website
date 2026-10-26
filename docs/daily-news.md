# CRC news and daily living

The existing six-hour Cloudflare rebuild refreshes both `/ko/news` and `/ko/daily` once these changes reach main. Korean pages use Korea Times US, Korea Daily, Radio Korea and Koreatown Press. `/daily` uses English-language sources only.

Koreatown Press is collected from its public home, local, USA and town listings. `datePublished` (including its timezone) is used; updated dates are not substituted. Korea/world/opinion/press-release article paths are rejected. Other sources retain their published RSS/direct dates. Missing or tied publication dates cannot establish a definitive first publisher; a stable URL tie-breaker prevents the result changing with network timing.

`newsDuplicates.ts` selects the earliest known publication across each duplicate group. It normalizes punctuation and spacing, matches highly similar headlines, and has narrowly scoped event rules for recurring stories with substantially different titles. It does not use image presence or outlet preference. Completely rewritten headlines can still require an additional editorial rule. Do not broaden a rule to a whole topic: distinct incidents and later material developments must remain visible.

Daily filters in `dailyNews.ts` favor local economy, public benefits, health, safety and useful community information. Organization announcements, campaign promotion and explicitly labeled opinion are excluded. Filters are heuristics, not a guarantee of political neutrality. Useful public-policy reporting remains eligible.

The bulletin retains a validated seven-day snapshot if sources fail, with original dates. Forty recent Korean links are displayed. The fraud page retains its existing history behavior and source/category filters.

## Image preview status

`dailyImages.ts` contains the dated October 14 preview snippets approved during layout work: Bing weather, the user's USD/KRW crop, and the user's combined California Lottery crop. These are **not automatically refreshed**. Their capture date is shown next to the image group. Do not label these values live or publish this as a fully automated utility panel until source capture has been implemented and verified. News links refresh independently.

## Checks

Run the existing `scripts/test-news-*.ts`, `scripts/test-radio-korea.ts` and new `scripts/test-daily-news.ts` with tsx, then `npm run build`. Review `/ko/daily`, `/daily`, `/ko/news` at desktop and mobile widths. The optional local `probe-daily.ts` is diagnostic only and is not needed for deployment.

## Daily news headline location rule

The main lists on /daily and /ko/daily exclude headlines explicitly naming an out-of-state location (for example New Jersey, New York, Chicago or Texas). They do not require a California mention. General informative stories remain eligible under the original editorial rules; an out-of-state location in the summary alone does not remove a story. A headline naming both California and another state is excluded conservatively. This is a headline-based heuristic: a story outside California can remain if its headline omits its location.

The same predicate applies to fresh, saved, held, fallback and live-feed candidates and ordinary builds of the published snapshot. The separate sports/entertainment block, fortune, stock report, utility images, fraud-news page, and update schedule retain their existing rules. Validate with scripts/test-daily-locality.ts and the existing regression suite.

## Rental content

Rental and lease listings and rental-housing news (including rent, tenancy and eviction articles) are withheld from regular daily editions. Only on Sunday in America/Los_Angeles may rental items fill an otherwise empty eligible main news list; any eligible non-rental story in either language suppresses that fallback. Ordinary builds re-filter saved editions, and publication applies the same rule, so saved items and late-discovery backfill cannot bypass it. Existing date, locality and editorial exclusions still apply. The decision uses the displayed edition's timestamp to preserve the overnight freeze. No other schedules or page layouts change.

The rental review preview is regenerated from the retained candidate pool using prepareDailyPublication, preserving timestamps and publication history; do not pad the list with previously published stories or classifieds. Society/economy discovery was audited against the two publishers' section pages. Standard collection already visits those pages. Rental removal is applied before the 40-story language limit on future publication, so eligible non-rental stories fill available slots.

Direct recruiting ads (including employee募集/직원 모집, job-opening solicitations, and recruiter consultation ads) are excluded from daily news in both languages and retained snapshots. Employment, wage, and public job-support reporting retain their existing eligibility.
