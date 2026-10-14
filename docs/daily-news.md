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
