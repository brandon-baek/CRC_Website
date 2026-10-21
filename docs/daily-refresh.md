# Daily bulletin schedule

All times use America/Los_Angeles, automatically following PST/PDT.

- 05:15: collect and publish the full morning package before the 06:00 deadline: news, today's fortune, latest Radio Korea
  stock report, four-day weather, USD/KRW, and three lottery jackpots.
- 06:07 through 16:37: check news every 30 minutes. Update headlines, fortune, and
  the stock report while keeping the morning's utility images. If the morning
  package failed, these runs retry the full package until it succeeds.
- 17:00 until 05:15: keep the displayed daily edition frozen. Hourly collections
  save discoveries to `src/data/dailyPending.json` for the next morning. The queue
  is merged with the next collection, re-filtered and deduplicated, and is never
  returned by the public daily-feed endpoint or displayed by ordinary site builds.

GitHub scheduling and Cloudflare deployment take time and can be delayed. The
publisher rechecks the local time after the build and immediately before updating
GitHub; jobs that overrun 17:00 save only their queue. A Cloudflare deployment already
started before 17:00 may finish shortly afterward. Manual/code-change runs obey the
same window, and obsolete previous-day jobs cannot replace a newer morning edition.

The morning weather display uses official NWS data. Rates are captured from the
Wise USD/KRW widget used by Korea Times (a reference conversion rate, not a bank
cash rate). The three lottery cards are captured from California Lottery. Captures
validate source dates/values and retry up to three times. Morning publication waits
for all three captures and a successful build; failures keep the previous dated
edition. The daytime news checks then retry a missing morning package.

Today's fortune must match the Los Angeles date. Stock reports keep their original
publication date: Friday remains over the weekend and into Monday morning until a
new report is available. New weekday reports can appear during daytime updates.
All existing source, locality, language, editorial, and duplicate filters apply.

`dailyEdition.json` is the displayed snapshot. `dailyPending.json` is the collected
news cache, including stories held overnight. Both are updated through the GitHub
API without overwriting concurrent site edits. Only the morning snapshot refreshes
weather/rate/lottery images. The existing six-hour fraud-news workflow is unchanged.

Run **Daily bulletin and daytime news** in GitHub Actions to collect manually.
No developer computer or paid API credentials are required. Workflow failures use
the repository's existing notifications. The preview branch `codex/daily-refresh`
runs the same workflow and writes only to that branch.

See daily-before-6am.md for the independent scheduler, verification, activation approval and deadline limitations.
