/**
 * Cloudflare Pages Function — the intake form's Send button.
 *
 * The browser posts here; this forwards to a Google Apps Script web app, which
 * appends a row to the center's Sheet. See docs/intake-sheet-setup.md.
 *
 *   GET  /api/intake  ->  { enabled: boolean }
 *   POST /api/intake  ->  { ok: true }
 *
 * Why not post to Apps Script directly from the page? The script URL is the
 * only thing standing between the internet and the Sheet. Kept here it stays a
 * server-side secret, submissions can be validated and rate-limited before they
 * reach the Sheet, and staff never open a spreadsheet full of bot rows.
 *
 * Deployment is opt-in and non-breaking, the same pattern as the chat Function:
 * with no INTAKE_SHEET_URL configured, GET returns `{enabled:false}` and the
 * form stays in its "coming soon" state.
 *
 * Bindings:
 *   INTAKE_SHEET_URL   (secret)  Apps Script web-app URL; enables the form
 *   INTAKE_SHARED_KEY  (secret)  optional; echoed to the script so a leaked
 *                                URL alone cannot write to the Sheet
 *   INTAKE_RATE_LIMIT  (KV)      durable per-IP limiting; without it the
 *                                limiter is per-isolate and best-effort only
 */

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

interface Env {
  INTAKE_SHEET_URL?: string;
  INTAKE_SHARED_KEY?: string;
  INTAKE_RATE_LIMIT?: KVNamespace;
}

interface EventContext {
  request: Request;
  env: Env;
}

/**
 * Submissions per IP per window. Enough to stop a script, loose enough for a
 * real burst: several people filling this in from one library, church, or
 * community-center network all share a single address as far as we can see.
 */
const RATE_LIMIT = 10;
const RATE_WINDOW = 600; // seconds

/** Generous caps that still stop someone pasting a novel into the Sheet. */
const MAX_SHORT = 120;
const MAX_STORY = 4000;

const FIELDS = [
  'firstName',
  'lastName',
  'phone',
  'email',
  'city',
  'zip',
  'concern',
  'concernOther',
  'story',
  'page',
  'locale',
] as const;

/** Per-isolate fallback limiter, used only when no KV namespace is bound. */
const memoryHits = new Map<string, number[]>();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export const onRequestGet = ({ env }: EventContext): Response =>
  json({ enabled: Boolean(env.INTAKE_SHEET_URL) });

async function rateLimited(env: Env, ip: string): Promise<boolean> {
  const key = `intake:${ip}`;
  const now = Math.floor(Date.now() / 1000);

  if (env.INTAKE_RATE_LIMIT) {
    const raw = await env.INTAKE_RATE_LIMIT.get(key);
    const hits: number[] = (raw ? JSON.parse(raw) : []).filter((t: number) => now - t < RATE_WINDOW);
    if (hits.length >= RATE_LIMIT) return true;
    hits.push(now);
    await env.INTAKE_RATE_LIMIT.put(key, JSON.stringify(hits), { expirationTtl: RATE_WINDOW });
    return false;
  }

  const hits = (memoryHits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW);
  if (hits.length >= RATE_LIMIT) return true;
  hits.push(now);
  memoryHits.set(key, hits);
  return false;
}

export const onRequestPost = async ({ request, env }: EventContext): Promise<Response> => {
  const endpoint = env.INTAKE_SHEET_URL;
  if (!endpoint) return json({ error: 'not_configured' }, 501);

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (await rateLimited(env, ip)) return json({ error: 'rate_limited' }, 429);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  // Honeypot: a human never sees this field, so anything in it is a bot.
  // Answer 200 so the bot has nothing to learn from the response.
  if (String(form.get('website') ?? '').trim()) return json({ ok: true });

  const values: Record<string, string> = {};
  for (const field of FIELDS) {
    const max = field === 'story' ? MAX_STORY : MAX_SHORT;
    values[field] = String(form.get(field) ?? '').trim().slice(0, max);
  }

  // The same rules the browser enforces, applied again here — client-side
  // validation is a courtesy to the visitor, not a guarantee to us.
  const hasName = Boolean(values.firstName && values.lastName);
  const hasContact = Boolean(values.phone || values.email);
  if (!hasName || !hasContact || !values.concern || !values.story) {
    return json({ error: 'incomplete' }, 400);
  }

  values.locale = values.locale === 'ko' ? 'ko' : 'en';
  values.page = values.page === 'get-help' ? 'get-help' : 'contact';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...values,
        key: env.INTAKE_SHARED_KEY ?? '',
        submittedAt: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.warn(`[intake] Apps Script returned HTTP ${response.status}.`);
      return json({ error: 'upstream_error' }, 502);
    }
  } catch (error) {
    console.warn('[intake] Could not reach the Apps Script endpoint.', error);
    return json({ error: 'upstream_error' }, 502);
  }

  return json({ ok: true });
};
