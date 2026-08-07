/**
 * Cloudflare Pages Function for the public footer visit counter.
 *
 * GET  /api/visits -> read the current total
 * POST /api/visits -> atomically add one visit and return the new total
 *
 * The browser limits POSTs to once per 30-minute browser session. That is a
 * usability convention, not identity tracking: this database stores only the
 * aggregate count and never stores IP addresses or visitor identifiers.
 *
 * Binding:
 *   VISITOR_DB (D1)  durable aggregate visit count
 */

interface D1Result<T = unknown> {
  results?: T[];
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(column?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface Env {
  VISITOR_DB?: D1Database;
}

interface EventContext {
  request: Request;
  env: Env;
}

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS site_visits (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

async function ensureCounter(db: D1Database): Promise<void> {
  await db.prepare(CREATE_TABLE).run();
  await db.prepare('INSERT OR IGNORE INTO site_visits (id, count) VALUES (1, 0)').run();
}

function isSameOrigin(request: Request): boolean {
  const expected = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  if (origin) return origin === expected;

  const referer = request.headers.get('referer');
  if (!referer) return false;

  try {
    return new URL(referer).origin === expected;
  } catch {
    return false;
  }
}

export const onRequestGet = async ({ env }: EventContext): Promise<Response> => {
  if (!env.VISITOR_DB) return json({ enabled: false }, 503);

  try {
    await ensureCounter(env.VISITOR_DB);
    const count = await env.VISITOR_DB
      .prepare('SELECT count FROM site_visits WHERE id = 1')
      .first<number>('count');
    return json({ enabled: true, count: count ?? 0 });
  } catch (error) {
    console.warn('[visits] Could not read the counter.', error);
    return json({ enabled: false }, 503);
  }
};

export const onRequestPost = async ({ request, env }: EventContext): Promise<Response> => {
  if (!env.VISITOR_DB) return json({ enabled: false }, 503);
  if (!isSameOrigin(request)) return json({ error: 'forbidden' }, 403);

  try {
    await ensureCounter(env.VISITOR_DB);
    const count = await env.VISITOR_DB
      .prepare(`
        UPDATE site_visits
        SET count = count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
        RETURNING count
      `)
      .first<number>('count');
    return json({ enabled: true, count: count ?? 0 });
  } catch (error) {
    console.warn('[visits] Could not increment the counter.', error);
    return json({ enabled: false }, 503);
  }
};
