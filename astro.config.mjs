import { defineConfig } from 'astro/config';

/**
 * Public base URL, used for canonical and hreflang tags.
 *
 * Do NOT hardcode a guessed pages.dev hostname here — an earlier guess pointed at
 * a different organisation's live site, which would have handed them every
 * canonical link on this site.
 *
 * Resolution order:
 *  1. SITE_URL      — set this in the Cloudflare Pages project once the real
 *                     domain exists (Settings -> Environment variables).
 *  2. CF_PAGES_URL  — set automatically by Cloudflare Pages on every build, so
 *                     deployments are always self-consistent even before step 1.
 *  3. localhost     — local dev and local builds.
 */
const site = process.env.SITE_URL || process.env.CF_PAGES_URL || 'http://localhost:4321';

export default defineConfig({
  site,
  output: 'static',
});
