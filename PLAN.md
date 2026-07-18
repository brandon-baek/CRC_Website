# Consumer Resource Center (한인 시민센터) Website — Implementation Plan

## Context

The Consumer Resource Center is a Korean-American community organization that helps people deal with fraud: teaching how to recognize and avoid scams, and routing victims to the correct government reporting agency. The planning doc calls for a hero page (who we are / what we do / locations), a database of fraud reporting places with search, a guided help system that routes people to the right fraud center (real AI chat deferred to later), scam education content, and a placeholder for a future intake/reporting form. Decisions confirmed with the user:

- **Bilingual** Korean/English with a language toggle
- **Guided wizard** (decision tree) now; architecture ready for a real AI chat later
- **No intake form yet** — placeholder UI, clearly marked where to wire it up later
- **Hosting on Cloudflare Pages**, domain purchased later
- **Placeholder org content** (mission, addresses, phone) marked for easy replacement
- **Scam-type library** for education (guide page per scam type)
- **Design**: clean/trustworthy base, logo colors (lime / red / orange-yellow) as accents, large readable type for older readers

## Tech stack

**Astro** (static output) in `/Users/seonho_kim/CRC_WEBSITE`, deployed to Cloudflare Pages.

Why: ~12 pages × 2 languages share a header/footer/layout — Astro components keep that DRY with zero client-side framework weight; output is pure static HTML (fast, free on Cloudflare Pages); Cloudflare has first-class Astro support; and Pages Functions can later host the AI chat endpoint without changing the site. Interactive pieces (wizard, directory search, language-aware links) are small vanilla-JS islands.

**i18n approach**: route-based — English at `/`, Korean at `/ko/…`. All strings live in `src/i18n/en.ts` and `src/i18n/ko.ts` dictionaries; page templates are shared and rendered once per locale (Astro's `getStaticPaths`). Header toggle links to the same page in the other language. `<html lang>` set per locale.

## Site map

| Route (EN / KO) | Purpose |
|---|---|
| `/` , `/ko/` | Hero page: who we are, what we do, quick "Get Help" CTA, locations preview, stats |
| `/get-help` , `/ko/get-help` | **Guided wizard**: decision tree (what happened → category → details) that recommends the right reporting agencies with "what to expect" info |
| `/directory` , `/ko/directory` | **Searchable database** of fraud reporting places — filter by category, free-text search |
| `/learn` , `/ko/learn` | Scam library index |
| `/learn/<slug>` ×2 locales | Guide per scam type: phishing, government impersonation, romance, investment & crypto, tech support, identity theft, online shopping, mail & lottery (8 guides) — warning signs, what to do, where to report |
| `/about` , `/ko/about` | Mission, who we are, locations (placeholder), team (placeholder) |
| `/contact` , `/ko/contact` | Contact info (placeholder) + **disabled intake form** with a "coming soon" state and a code comment marking where to wire a form service or backend later |

## Key files

- `src/data/agencies.ts` — single source of truth for the 11 reporting places from the planning PDF (USA.gov router, FTC ReportFraud, IdentityTheft.gov, FBI IC3, CFPB, SEC TCR, IRS, SSA OIG, HHS OIG, USPIS, Oversight.gov, CA AG). Each entry: name (en/ko), categories, best-for, intake/follow-up description, URL. **Shared by both the directory page and the wizard** so routing logic and listings never diverge.
- `src/data/wizard.ts` — decision-tree definition (nodes → answers → next node or agency recommendations referencing `agencies.ts` ids). Keeping the tree as data makes the future AI swap-in clean: the AI endpoint can return the same recommendation shape.
- `src/data/scams.ts` — scam-type guide content (bilingual) driving `/learn` pages.
- `src/i18n/en.ts`, `src/i18n/ko.ts`, `src/i18n/index.ts` — UI string dictionaries + `t()` helper + locale-from-URL util.
- `src/layouts/Base.astro` — HTML shell, header w/ nav + KO/EN toggle, footer, skip-link.
- `src/components/` — Hero, AgencyCard, WizardIsland (vanilla JS), SearchFilter, ScamGuideCard, PlaceholderForm.
- `src/styles/global.css` — design tokens and base styles.
- `public/logo.svg`, `public/favicon.svg` — **recreate the logo as SVG** (it's four squares + text on lime — an SVG recreation is crisp at every size; the PDF's raster copy is low-res). Colors sampled from the provided logo (lime ≈ `#CDF07A`, red ≈ `#E8493A`, orange-yellow ≈ `#F4B942`).

## Design system

- Base: white/off-white pages, near-black text, **18px base font** and generous line-height (older readers are the primary scam-victim demographic).
- Logo lime/red/yellow as accents only: section highlights, buttons, card borders, the square motif as a decorative element. Dark text on lime/yellow (they fail contrast as text colors on white); red reserved for primary CTAs and alerts with white text (contrast-checked).
- Fonts: Noto Sans KR (supports both Korean and Latin) via Google Fonts, system fallback.
- Accessibility: semantic landmarks, visible focus states, wizard fully keyboard-operable, `lang` attributes correct per locale.

## Implementation order

1. Scaffold Astro project, global styles/tokens, Base layout with nav + language toggle, SVG logo.
2. Data files: `agencies.ts` (from the PDF table), `wizard.ts`, `scams.ts`, i18n dictionaries.
3. Pages: home/hero → directory (search/filter) → wizard → learn index + guides → about → contact (placeholder form).
4. Korean translations for all content (Korean copy written natively, not machine-transliterated structure).
5. Polish pass: responsive/mobile, favicon, meta/OG tags, 404 page (both locales).
6. Cloudflare Pages setup: `npm run build` → `dist/`; add a short `README.md` with deploy steps (connect repo or `wrangler pages deploy dist`) and where to edit placeholders.

## Verification

- `npm run build` passes with zero errors (also validates all static routes generate).
- Launch dev server via the browser preview; click through every page in both languages; confirm the toggle preserves the current page.
- Exercise the wizard end-to-end for at least 3 distinct paths (e.g. identity theft → IdentityTheft.gov; bank/card problem → CFPB; online crypto scam → IC3) and confirm recommendations match the PDF's "best used for" table.
- Test directory search + category filters return correct agencies in both languages.
- Mobile viewport check (375px) on home, wizard, and a guide page.
- Confirm the contact form placeholder is visibly disabled and its wiring point is commented.

## Explicitly deferred (per user)

- Real AI chat (later: Cloudflare Pages Function calling the Claude API, returning the same recommendation shape as the wizard).
- Intake form backend / data collection.
- Custom domain purchase; real org details to replace placeholders.
