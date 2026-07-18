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

**Option A — connect the Git repo (recommended):**
1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Select this repository.
3. Build settings: framework preset **Astro**, build command `npm run build`, output directory `dist`.
4. Deploy. Every push to `main` redeploys automatically.

**Option B — direct upload:**
```bash
npm run build
npx wrangler pages deploy dist
```

When you buy a domain, add it under the Pages project → Custom domains, then update
`site` in `astro.config.mjs` to the new URL (it is used for canonical/hreflang tags).

## Where to edit things

| What | Where |
|---|---|
| Reporting agencies (directory + wizard results) | `src/data/agencies.ts` |
| Guided-helper questions & routing | `src/data/wizard.ts` |
| Scam education guides | `src/data/scams.ts` |
| All UI text, both languages | `src/i18n/index.ts` |
| **Placeholders to replace** (address, phone, email, office names) | `src/components/Footer.astro`, `src/views/HomePage.astro`, `src/views/AboutPage.astro`, `src/views/ContactPage.astro` — search for `PLACEHOLDER` |
| Colors, fonts, spacing | `src/styles/global.css` |
| Logo | `public/logo.svg`, `public/favicon.svg` |

## Structure

- English pages live at `/` (e.g. `/directory`), Korean pages at `/ko/…`.
  Each page is a thin wrapper around a shared view component in `src/views/`,
  so content and layout are written once and rendered per language.
- The Get Help wizard is a decision tree defined as data in `src/data/wizard.ts`.
  Results reference agency ids from `src/data/agencies.ts`.

## Planned next steps (deliberately not built yet)

- **Intake form**: the contact form is a disabled placeholder. To activate it,
  remove the `disabled` attributes in `src/views/ContactPage.astro` and point the
  form at a form service (e.g. Formspree) or a Cloudflare Pages Function.
- **AI assistant**: the wizard is designed so an AI chat (Cloudflare Pages
  Function calling the Claude API) can return the same result shape
  (`WizardResult` in `src/data/wizard.ts`) and reuse the results UI.
