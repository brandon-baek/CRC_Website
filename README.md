# Consumer Resource Center · 한인 시민센터 — Website

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
| Scam education guides (incl. the FTC video on each guide) | `src/data/scams.ts` |
| CRC press releases / announcements on the News page | `src/data/press.ts` |
| FTC alert feed (source URL, parsing, how many show) | `src/data/ftcAlerts.ts` |
| All UI text, both languages | `src/i18n/index.ts` |
| **Placeholders to replace** (address, phone, email) | `src/components/Footer.astro`, `src/views/HomePage.astro`, `src/views/AboutPage.astro`, `src/views/ContactPage.astro` — search for `PLACEHOLDER` |
| Office hours | `contact.hoursValue` / `contact.hoursClosed` in `src/i18n/index.ts` |
| Colors, fonts, spacing | `src/styles/global.css` |
| Logo | `public/logo.svg`, `public/favicon.svg` |
| NGA partner logo | save as `public/nga-logo.svg`, then add the `<img>` in `src/views/AboutPage.astro` (marked with a comment) |

## Structure

- English pages live at `/` (e.g. `/directory`), Korean pages at `/ko/…`.
  Each page is a thin wrapper around a shared view component in `src/views/`,
  so content and layout are written once and rendered per language.
- The Get Help wizard is a decision tree defined as data in `src/data/wizard.ts`.
  Results reference agency ids from `src/data/agencies.ts`.
- The News page pulls the FTC consumer-alert feed **at build time** and bakes the
  results into static HTML, so the page stays fast and has no runtime dependency
  on the FTC. It refreshes on every deploy; if the feed is unreachable during a
  build, the page falls back to a link to consumer.ftc.gov instead of failing.
- Every scam guide has one video, defined in `src/data/scams.ts`. The rules for
  adding or swapping one (also written at the top of that file):
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

## Planned next steps (deliberately not built yet)

- **Online donations**: `/donate` explains how to give and links to the office.
  When a donation account exists (PayPal, Zeffy, Givebutter…), replace the
  notice in `src/views/DonatePage.astro` marked `DONATE PLACEHOLDER`.
- **Intake form**: the contact form is a disabled placeholder. To activate it,
  remove the `disabled` attributes in `src/views/ContactPage.astro` and point the
  form at a form service (e.g. Formspree) or a Cloudflare Pages Function.
- **AI assistant**: the wizard is designed so an AI chat (Cloudflare Pages
  Function calling the Claude API) can return the same result shape
  (`WizardResult` in `src/data/wizard.ts`) and reuse the results UI.
