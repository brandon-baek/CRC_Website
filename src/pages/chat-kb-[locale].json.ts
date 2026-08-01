import type { APIRoute } from 'astro';
import { buildKb } from '../lib/chat-kb';
import { locales, type Locale } from '../i18n';

/**
 * Emits /chat-kb-en.json and /chat-kb-ko.json as static files at build time.
 *
 * Two consumers, one source of truth:
 *   - the chat widget fetches it lazily on first open (keeps it off the
 *     critical path of every page), and
 *   - functions/api/chat.ts fetches it server-side as grounding context, so the
 *     AI answers from the site's own content rather than from client-supplied
 *     text.
 */
export function getStaticPaths() {
  return locales.map((locale) => ({ params: { locale } }));
}

export const GET: APIRoute = ({ params }) => {
  const kb = buildKb(params.locale as Locale);
  return new Response(JSON.stringify(kb), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
