# Consumer Resource Center · 한인 시민센터

Bilingual (English/Korean) website for the Consumer Resource Center: scam education,
a guided "where do I report?" helper, and a plain-language directory of official
fraud reporting agencies.

Built with [Astro](https://astro.build) (fully static output). Designed for
[Cloudflare Pages](https://pages.cloudflare.com) hosting.

## Develop

```bash
npm install
npm run dev        # local dev server at http://localhost:4321
npm run build      # static build into dist/
npm run preview    # preview the production build
```

## Deploy to Cloudflare Pages

> **Status: not deployed yet.** No Cloudflare Pages project exists for this site.
> Note that `crc-website.pages.dev` is **already taken by an unrelated
> organisation** (Climate Resilient Communities), so pick a different project
> name — e.g. `crc-fraud-help` or `hanin-crc`.

**Option A — connect the Git repo (recommended):**
1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Select this repository, production branch `main`.
3. Build settings: framework preset **Astro**, build command `npm run build`,
   output directory `dist`. Node version comes from `.nvmrc` (22).
4. Deploy. Every push to `main` redeploys automatically.

**Option B — direct upload:**
```bash
npm run build
npx wrangler pages deploy dist
```

### The site URL

`site` in `astro.config.mjs` drives canonical and hreflang tags, and it is **not**
hardcoded — it reads `SITE_URL`, then `CF_PAGES_URL`, then falls back to
localhost. Cloudflare sets `CF_PAGES_URL` automatically, so the first deploy is
already self-consistent with no configuration.

When a custom domain is connected (Pages project → Custom domains), set
`SITE_URL` to it under Settings → Environment variables → Production, so
canonical tags point at the real domain instead of the pages.dev one.

### Verifying a build the way Cloudflare does

```bash
npm ci && npm run build
```
This is the exact path the Pages build runs; if it passes locally it will pass there.

## Where to edit things

| What | Where |
|---|---|
| Reporting agencies (directory + wizard results) | `src/data/agencies.ts` |
| Guided-helper questions & routing | `src/data/wizard.ts` |
| Scam education guides and localized video references | `src/data/scams.ts` |
| Original Korean video builder and validation | `scripts/video/` |
| CRC press releases / announcements on the News page | `src/data/press.ts` |
| News feeds (which sources, filtering, how many show) | `src/data/newsFeeds.ts` |
| Which news outlets may appear | `src/data/newsPublishers.ts` |
| All UI text, both languages | `src/i18n/index.ts` |
| Assistant answers, keywords, urgent triggers | `src/lib/chat-kb.ts` |
| Address and phone | `src/data/org.ts` — one place, used by every page |
| Office hours | `contact.hoursRows` / `contact.hoursClosed` in `src/i18n/index.ts` |
| Intake form fields and messages | `src/components/IntakeForm.astro`, `intake.*` in `src/i18n/index.ts` |
| Colors, fonts, spacing | `src/styles/global.css` |
| Logo | `public/logo.svg`, `public/favicon.svg` |
| Brand and interface standards | `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json` |

## Structure

- English pages live at `/` (e.g. `/directory`), Korean pages at `/ko/…`.
  Each page is a thin wrapper around a shared view component in `src/views/`,
  so content and layout are written once and rendered per language.
- The Get Help wizard is a decision tree defined as data in `src/data/wizard.ts`.
  Results reference agency ids from `src/data/agencies.ts`.
- The News page gathers everything **at build time** and bakes it into static
  HTML, so the page stays fast and has no runtime dependency on any source. It
  refreshes on every deploy, and readers filter by source with the chip row.
  Two kinds of source feed it:
  - **Agencies**, each its own feed: FTC consumer alerts, FTC press, CFPB,
    FBI IC3, FBI press.
  - **Press coverage**, via Google News search feeds — LA/California scam
    stories, national consumer warnings, the Korean-American papers, and Korean
    outlets. Outlets' own RSS is no use here: front-page feeds from KTLA, ABC7,
    NBC LA, FOX 11, NPR and others yielded zero scam stories across 152 items,
    and their topic-tag feeds return nothing. Google's search feeds carry the
    same outlets and name the publisher per item. This is also the only route
    that reaches 미주중앙일보 and 시애틀코리안데일리, which publish no feed at all.
    Each item shows the outlet's own name; **links pass through Google's
    redirector** before landing on the publisher's article.
  - Press items are filtered twice: the outlet must be listed in
    `src/data/newsPublishers.ts` (Google indexes corporate blogs and content
    farms next to newspapers), **and** the headline must be about fraud. Both
    are needed — an allowed outlet's healthcare-policy story still matches the
    word "fraud".
  - Failures are contained per source: a feed that is unreachable, empty, or has
    no fraud stories right now simply loses its chip, and the page still renders.
    That is normal — the CFPB tab in particular comes and goes, since its
    newsroom is mostly rulemaking and only its fraud headlines are kept.
- Every scam guide has localized video references in `src/data/scams.ts`. The
  English references remain official third-party public-service videos. Korean
  pages use original CRC productions generated from the Korean guide copy by
  `scripts/video/build-korean-videos.mjs`; each production includes Korean
  neural narration, localized graphics, a poster, and WebVTT captions.
- The rules for adding or swapping an external video (also written at the top
  of that file) are:
  - published by a government agency or a recognised consumer-protection body
    (FTC, USPIS, FBI, AARP) — never a re-upload of someone else's video;
  - at least 45 seconds, and actually explaining the scam;
  - embeddable off the publisher's own site. **Check this before adding**, or the
    guide will render a grey error box:
    - Vimeo — `https://player.vimeo.com/video/<id>` must return HTTP 200. Many
      FTC videos are privacy-locked to ftc.gov and return 401.
    - YouTube — the watch page must report `"playableInEmbed":true`.
  - Korean-language versions are used automatically when one exists (set `ko`);
    otherwise the English video plays with a note saying it is in English.

Rebuild and validate the original Korean video set with:

```bash
pipx install edge-tts  # one-time local narration dependency
npm run videos:ko
npm run videos:ko:validate
```

## The site assistant (bottom-right)

Every page carries an "Ask a question" launcher that answers scam questions and
helps people find their way around the site, in Korean or English. It has two
modes and picks one at runtime, so the same build works either way.

**Local mode (default, no setup).** Answers come from `/chat-kb-<locale>.json`, a
knowledge base generated at build time from `agencies.ts`, `scams.ts`,
`wizard.ts` and the i18n dictionaries — so the assistant can never contradict the
site. It is fetched lazily the first time someone opens the panel, costs nothing,
and nothing the visitor types leaves their browser. It matches questions to
existing pages, so it can only answer what the site already covers.

**AI mode (opt-in).** Add a provider API key in the Pages project
(Settings → Environment variables → **Encrypt**) and redeploy. `functions/api/chat.ts`
then answers with that provider and the widget switches over on its own. Now
visitors can ask *any* scam or fraud question in their own words — how a con
works, whether a message looks fake, what to do next — not just what the site has
a page for. The knowledge base is still sent as the authority on this
organization and on where to report, and the prompt forbids inventing agency
names, URLs, phone numbers, or statistics from memory: those may only come from
the site's own data, so a victim is never sent to a made-up reporting link.
Remove the key to go back to local mode.

To try AI mode locally, copy `.dev.vars.example` to `.dev.vars`, put your key in
it, then run the production build with the Function attached:

```bash
npm run build && npx wrangler pages dev dist
```

`.dev.vars` is gitignored — never commit a key, and never put a real one in
`.dev.vars.example`. Note `npm run dev` (Astro alone) does not run Functions, so
the widget always stays in local mode there.

Set **exactly one** provider key (Gemini wins if both are present):

| Binding | Type | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | secret | Use Google Gemini. **Has a free tier** — get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (starts with `AIza`). Free limits as of 2026: `gemini-2.5-flash` 250 requests/day, `gemini-2.5-flash-lite` 1,000/day. Google has changed these without notice, so treat them as a moving target. |
| `ANTHROPIC_API_KEY` | secret | Use Claude. No free tier; roughly 2.5¢ per cold message at the current prompt size. Stronger instruction-following, which is what the safety rules in the prompt rely on. |
| `CHAT_MODEL` | variable | Override the model id for whichever provider is active (defaults: `gemini-2.5-flash`, `claude-sonnet-5`). |
| `CHAT_RATE_LIMIT` | KV namespace | Durable per-IP rate limiting. Without it the limiter is per-isolate and best-effort — **bind a KV namespace before enabling AI mode in production.** |

If the API key is missing, rate-limited, or the API call fails, the widget falls
back to a local answer rather than showing an error, so visitors always get
usable links.

To change what it knows, edit `src/lib/chat-kb.ts` — entry summaries, the
cross-language `keywords` lists that drive matching, and `urgentTriggers`, the
phrases that pin the "you just lost money" first-steps card above an answer.
Ranking logic lives in `src/lib/chat-search.js`.

## The intake form

`/contact` and `/get-help` both carry a form that asks for a name, a way to
reach the person, city and ZIP, what their concern is, and what happened. It
posts to `functions/api/intake.ts`, which validates and rate-limits the
submission and forwards it to a Google Apps Script that appends a row to a
Google Sheet the staff can read.

**It is disabled until the Sheet is set up**, and says so on the page — so this
can ship before the Sheet exists without anything looking broken. To switch it
on, follow **[docs/intake-sheet-setup.md](docs/intake-sheet-setup.md)** (about
ten minutes: create a Sheet, paste in `scripts/intake-appscript.js`, deploy it,
and add two encrypted variables to the Pages project).

| Binding | Type | Purpose |
|---|---|---|
| `INTAKE_SHEET_URL` | secret | Apps Script web-app URL. Its presence is what enables the form. |
| `INTAKE_SHARED_KEY` | secret | Must match `SHARED_KEY` in the script, so a leaked URL alone cannot write to the Sheet. |
| `INTAKE_RATE_LIMIT` | KV namespace | Durable per-IP limiting. Without it the limiter is per-isolate and best-effort. |

The Apps Script URL stays server-side deliberately: it is the only thing between
the internet and the Sheet. The Sheet itself holds names, phone numbers, and
people's accounts of being defrauded — **keep it shared with named staff only,
never by link**.

## Footer visit counter

The footer displays a small bilingual aggregate visit count. The browser sends
at most one increment every 30 minutes and stores only the last-counted time on
that device. The server stores only the total, never IP addresses or visitor
identifiers.

Create a Cloudflare D1 database, apply `migrations/0001_visitor_counter.sql`, and
bind it to the Pages project as `VISITOR_DB` in both Production and Preview. The
counter remains hidden if the binding is missing or temporarily unavailable.

## Private traffic dashboard

`/traffic` is a leadership-only Cloudflare analytics dashboard. Cloudflare
Access must protect `crcnow.org/traffic*` and the Pages-domain equivalent, with
only the approved email addresses in its Allow policy. The Function at
`/traffic/data` also validates Cloudflare's signed Access token, production
hostname, application audience, and approved email before returning analytics.

| Binding | Type | Purpose |
|---|---|---|
| `CLOUDFLARE_ANALYTICS_TOKEN` | secret | Token scoped only to `crcnow.org` with `Zone → Analytics → Read`. |
| `CLOUDFLARE_ZONE_ID` | variable | Zone ID for `crcnow.org`. |

## Integrations that require organizational setup

- **Online donations**: `/donate` truthfully says that online giving is not
  available and directs supporters to the office. Add a payment link only after
  the organization has selected and verified its donation provider.
- **Online contact intake**: the public form stays disabled until the Sheet
  integration above is configured. Phone, office address, and office hours are
  shown first so the page still provides a complete contact path.
