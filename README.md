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
| All UI text, both languages | `src/i18n/index.ts` |
| Assistant answers, keywords, urgent triggers | `src/lib/chat-kb.ts` |
| Address, phone, email | `src/data/org.ts` — one place, used by every page |
| Office hours | `contact.hoursRows` / `contact.hoursClosed` in `src/i18n/index.ts` |
| Intake form fields and messages | `src/components/IntakeForm.astro`, `intake.*` in `src/i18n/index.ts` |
| **Placeholder still to replace** | the email address in `src/data/org.ts` — no real inbox exists yet |
| Colors, fonts, spacing | `src/styles/global.css` |
| Logo | `public/logo.svg`, `public/favicon.svg` |
| NGA partner logo | save as `public/nga-logo.svg`, then add the `<img>` in `src/views/AboutPage.astro` (marked with a comment) |

## Structure

- English pages live at `/` (e.g. `/directory`), Korean pages at `/ko/…`.
  Each page is a thin wrapper around a shared view component in `src/views/`,
  so content and layout are written once and rendered per language.
- The Get Help wizard is a decision tree defined as data in `src/data/wizard.ts`.
  Results reference agency ids from `src/data/agencies.ts`.
- The News page pulls several agency feeds (FTC consumer alerts, FTC press,
  CFPB, FBI IC3, FBI press) **at build time** and bakes the results into static
  HTML, so the page stays fast and has no runtime dependency on those agencies.
  It refreshes on every deploy. Readers filter by source with the chip row.
  Failures are contained per source: a feed that is unreachable, empty, or has
  no fraud stories right now simply loses its chip, and the page still renders.
  That is normal — the CFPB tab in particular comes and goes, since its newsroom
  is mostly rulemaking and only its fraud headlines are kept.
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

## Planned next steps (deliberately not built yet)

- **Online donations**: `/donate` explains how to give and links to the office.
  When a donation account exists (PayPal, Zeffy, Givebutter…), replace the
  notice in `src/views/DonatePage.astro` marked `DONATE PLACEHOLDER`.
- **A real email address**: `src/data/org.ts` still carries a placeholder, shown
  with placeholder styling wherever it appears. Replacing it also unlocks the
  per-submission email notification in `scripts/intake-appscript.js`.
