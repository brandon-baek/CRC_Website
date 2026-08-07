/**
 * Private Cloudflare traffic analytics for the CRC leadership dashboard.
 *
 * Cloudflare Access protects /traffic* before requests reach this Function.
 * This handler also fails closed unless the request uses the production host
 * and a signed Access application token identifies an approved email address.
 *
 * Secrets / variables:
 *   CLOUDFLARE_ANALYTICS_TOKEN  Zone Analytics:Read for crcnow.org only
 *   CLOUDFLARE_ZONE_ID          crcnow.org zone ID
 */

interface Env {
  CLOUDFLARE_ANALYTICS_TOKEN?: string;
  CLOUDFLARE_ZONE_ID?: string;
}

interface EventContext {
  request: Request;
  env: Env;
}

interface GraphQLError {
  message?: string;
}

interface LegacyMapCountry {
  clientCountryName?: string;
  requests?: number;
}

interface LegacyMapBrowser {
  uaBrowserFamily?: string;
  pageViews?: number;
}

interface LegacyMapStatus {
  edgeResponseStatus?: number;
  requests?: number;
}

interface LegacyDay {
  dimensions?: { date?: string };
  sum?: {
    requests?: number;
    pageViews?: number;
    bytes?: number;
    cachedRequests?: number;
    cachedBytes?: number;
    countryMap?: LegacyMapCountry[];
    browserMap?: LegacyMapBrowser[];
    responseStatusMap?: LegacyMapStatus[];
  };
  uniq?: { uniques?: number };
}

interface AdaptiveGroup {
  count?: number;
  sum?: { visits?: number };
  dimensions?: {
    clientRequestPath?: string;
    clientDeviceType?: string;
    edgeResponseStatus?: number;
  };
}

interface ZoneAnalytics {
  days?: LegacyDay[];
  paths?: AdaptiveGroup[];
  devices?: AdaptiveGroup[];
  liveStatuses?: AdaptiveGroup[];
}

interface GraphQLPayload {
  data?: {
    viewer?: {
      zones?: ZoneAnalytics[];
    };
  };
  errors?: GraphQLError[];
}

interface AccessJwtHeader {
  alg?: string;
  kid?: string;
}

interface AccessJwtPayload {
  aud?: string | string[];
  email?: string;
  exp?: number;
  iss?: string;
  nbf?: number;
}

interface AccessJwk extends JsonWebKey {
  kid?: string;
}

interface AccessJwks {
  keys?: AccessJwk[];
}

const GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';
const ACCESS_ISSUER = 'https://falling-waterfall-002d.cloudflareaccess.com';
const ACCESS_AUDIENCE = '55e55d95025e048c886b491575bc321c6963e47864d4a66eac1030a3abffb496';
const ACCESS_CERTS_ENDPOINT = `${ACCESS_ISSUER}/cdn-cgi/access/certs`;
const ALLOWED_HOSTS = new Set(['crcnow.org']);
const ALLOWED_EMAILS = new Set([
  'documaninfo@gmail.com',
  'aboutnga@gmail.com',
  'brandonbaek2010@gmail.com',
]);
const PUBLIC_PAGE_PREFIXES = [
  '/',
  '/about',
  '/contact',
  '/get-help',
  '/directory',
  '/learn',
  '/news',
  '/donate',
  '/ko',
];

const ANALYTICS_START_DATE = '2026-07-01';
const MAX_CUSTOM_DAYS = 366;

const HISTORY_QUERY = `
  query TrafficHistory(
    $zoneTag: string,
    $startDate: Date,
    $endDate: Date
  ) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        days: httpRequests1dGroups(
          limit: 31,
          orderBy: [date_ASC],
          filter: { date_geq: $startDate, date_leq: $endDate }
        ) {
          dimensions { date }
          sum {
            requests
            pageViews
            bytes
            cachedRequests
            cachedBytes
            countryMap { clientCountryName requests }
            browserMap { uaBrowserFamily pageViews }
            responseStatusMap { edgeResponseStatus requests }
          }
          uniq { uniques }
        }
      }
    }
  }
`;

const LIVE_QUERY = `
  query TrafficLive(
    $zoneTag: string,
    $liveStart: Time,
    $liveEnd: Time
  ) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        paths: httpRequestsAdaptiveGroups(
          limit: 30,
          orderBy: [sum_visits_DESC],
          filter: {
            datetime_geq: $liveStart,
            datetime_lt: $liveEnd,
            requestSource: "eyeball",
            clientRequestPath_notlike: "/_astro/%"
          }
        ) {
          count
          sum { visits }
          dimensions { clientRequestPath }
        }
        devices: httpRequestsAdaptiveGroups(
          limit: 10,
          orderBy: [count_DESC],
          filter: {
            datetime_geq: $liveStart,
            datetime_lt: $liveEnd,
            requestSource: "eyeball"
          }
        ) {
          count
          dimensions { clientDeviceType }
        }
        liveStatuses: httpRequestsAdaptiveGroups(
          limit: 20,
          orderBy: [count_DESC],
          filter: {
            datetime_geq: $liveStart,
            datetime_lt: $liveEnd,
            requestSource: "eyeball"
          }
        ) {
          count
          dimensions { edgeResponseStatus }
        }
      }
    }
  }
`;

let accessKeys = new Map<string, CryptoKey>();
let accessKeysExpireAt = 0;

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function decodeJsonPart<T>(value: string): T | null {
  try {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;
  } catch {
    return null;
  }
}

async function getAccessKey(kid: string): Promise<CryptoKey | null> {
  if (Date.now() < accessKeysExpireAt && accessKeys.has(kid)) return accessKeys.get(kid) ?? null;

  const response = await fetch(ACCESS_CERTS_ENDPOINT, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) return null;

  const jwks = await response.json() as AccessJwks;
  const nextKeys = new Map<string, CryptoKey>();
  for (const jwk of jwks.keys ?? []) {
    if (!jwk.kid || jwk.kty !== 'RSA') continue;
    try {
      const key = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
      );
      nextKeys.set(jwk.kid, key);
    } catch {
      // Ignore malformed or unsupported keys and continue with valid keys.
    }
  }

  accessKeys = nextKeys;
  accessKeysExpireAt = Date.now() + 10 * 60 * 1000;
  return accessKeys.get(kid) ?? null;
}

async function verifiedAccessEmail(request: Request): Promise<string | null> {
  const assertion = request.headers.get('cf-access-jwt-assertion');
  if (!assertion) return null;

  const parts = assertion.split('.');
  if (parts.length !== 3) return null;
  const header = decodeJsonPart<AccessJwtHeader>(parts[0]);
  const payload = decodeJsonPart<AccessJwtPayload>(parts[1]);
  if (!header?.kid || header.alg !== 'RS256' || !payload?.email) return null;

  const key = await getAccessKey(header.kid);
  if (!key) return null;

  const validSignature = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!validSignature) return null;

  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (
    payload.iss !== ACCESS_ISSUER
    || !audiences.includes(ACCESS_AUDIENCE)
    || !payload.exp
    || payload.exp <= now
    || (payload.nbf !== undefined && payload.nbf > now)
  ) return null;

  return payload.email.trim().toLowerCase();
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer',
    },
  });
}

function addToMap(map: Map<string, number>, key: string | undefined, value: number | undefined): void {
  if (!key || !Number.isFinite(value)) return;
  map.set(key, (map.get(key) ?? 0) + (value ?? 0));
}

function sortedEntries(map: Map<string, number>, limit = 10) {
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function isPublicContentPath(path: string): boolean {
  if (path === '/') return true;
  return PUBLIC_PAGE_PREFIXES.slice(1).some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

const DAY_MS = 86_400_000;

interface DateRange {
  endDate: string;
  mode: '7' | '30' | '90' | 'all' | 'custom';
  periodDays: number;
  startDate: string;
}

function parseDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : parsed;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveDateRange(url: URL, now: Date): DateRange | null {
  const endOfToday = new Date(`${isoDate(now)}T00:00:00Z`);
  const requestedMode = url.searchParams.get('range') ?? url.searchParams.get('days') ?? '7';
  const mode = ['7', '30', '90', 'all', 'custom'].includes(requestedMode) ? requestedMode : '7';

  if (mode === 'custom') {
    const start = parseDate(url.searchParams.get('start'));
    const end = parseDate(url.searchParams.get('end'));
    if (!start || !end || start > end || end > endOfToday) return null;
    const periodDays = Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
    if (periodDays > MAX_CUSTOM_DAYS) return null;
    return { startDate: isoDate(start), endDate: isoDate(end), periodDays, mode };
  }

  if (mode === 'all') {
    const start = parseDate(ANALYTICS_START_DATE)!;
    return {
      startDate: ANALYTICS_START_DATE,
      endDate: isoDate(endOfToday),
      periodDays: Math.floor((endOfToday.getTime() - start.getTime()) / DAY_MS) + 1,
      mode,
    };
  }

  const periodDays = Number(mode);
  const start = new Date(endOfToday.getTime() - (periodDays - 1) * DAY_MS);
  return { startDate: isoDate(start), endDate: isoDate(endOfToday), periodDays, mode };
}

function chunkDateRange(startDate: string, endDate: string): Array<{ startDate: string; endDate: string }> {
  const chunks: Array<{ startDate: string; endDate: string }> = [];
  let cursor = parseDate(startDate)!;
  const end = parseDate(endDate)!;
  while (cursor <= end) {
    const chunkEnd = new Date(Math.min(cursor.getTime() + 29 * DAY_MS, end.getTime()));
    chunks.push({ startDate: isoDate(cursor), endDate: isoDate(chunkEnd) });
    cursor = new Date(chunkEnd.getTime() + DAY_MS);
  }
  return chunks;
}

async function queryCloudflare(
  token: string,
  zoneTag: string,
  query: string,
  variables: Record<string, string>,
): Promise<ZoneAnalytics> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query, variables: { zoneTag, ...variables } }),
  });
  const payload = await response.json() as GraphQLPayload;
  const zone = payload.data?.viewer?.zones?.[0];
  if (!response.ok || payload.errors?.length || !zone) {
    throw new Error(payload.errors?.map((error) => error.message).filter(Boolean).join('; ') || `HTTP ${response.status}`);
  }
  return zone;
}

export const onRequestGet = async ({ request, env }: EventContext): Promise<Response> => {
  const url = new URL(request.url);
  if (!ALLOWED_HOSTS.has(url.hostname)) return json({ error: 'not_found' }, 404);

  const viewerEmail = await verifiedAccessEmail(request);
  if (!viewerEmail || !ALLOWED_EMAILS.has(viewerEmail)) return json({ error: 'forbidden' }, 403);

  if (!env.CLOUDFLARE_ANALYTICS_TOKEN || !env.CLOUDFLARE_ZONE_ID) {
    return json({ error: 'analytics_unavailable' }, 503);
  }

  const now = new Date();
  const range = resolveDateRange(url, now);
  if (!range) return json({ error: 'invalid_date_range' }, 400);
  const liveStart = new Date(now.getTime() - DAY_MS);

  try {
    const historyChunks = chunkDateRange(range.startDate, range.endDate);
    const [historyResults, liveResult] = await Promise.all([
      Promise.allSettled(historyChunks.map((chunk) => queryCloudflare(
        env.CLOUDFLARE_ANALYTICS_TOKEN!,
        env.CLOUDFLARE_ZONE_ID!,
        HISTORY_QUERY,
        chunk,
      ))),
      queryCloudflare(
        env.CLOUDFLARE_ANALYTICS_TOKEN!,
        env.CLOUDFLARE_ZONE_ID!,
        LIVE_QUERY,
        { liveStart: liveStart.toISOString(), liveEnd: now.toISOString() },
      ).catch(() => ({ paths: [], devices: [], liveStatuses: [] })),
    ]);

    const successfulHistory = historyResults.filter((result) => result.status === 'fulfilled');
    if (!successfulHistory.length) throw new Error('No historical analytics chunks were available.');
    const failedHistory = historyResults.filter((result) => result.status === 'rejected');
    if (failedHistory.length) {
      console.warn('[traffic] Some requested historical chunks were unavailable.', {
        failed: failedHistory.length,
        requested: historyResults.length,
      });
    }

    const daysByDate = new Map<string, LegacyDay>();
    for (const result of successfulHistory) {
      if (result.status !== 'fulfilled') continue;
      for (const day of result.value.days ?? []) {
        const date = day.dimensions?.date;
        if (date) daysByDate.set(date, day);
      }
    }
    const historicalDays = [...daysByDate.values()]
      .sort((a, b) => (a.dimensions?.date ?? '').localeCompare(b.dimensions?.date ?? ''));

    const countries = new Map<string, number>();
    const browsers = new Map<string, number>();
    const statuses = new Map<string, number>();
    let requests = 0;
    let pageViews = 0;
    let bytes = 0;
    let cachedRequests = 0;

    const timeline = historicalDays.map((day) => {
      const sum = day.sum ?? {};
      requests += sum.requests ?? 0;
      pageViews += sum.pageViews ?? 0;
      bytes += sum.bytes ?? 0;
      cachedRequests += sum.cachedRequests ?? 0;
      for (const country of sum.countryMap ?? []) addToMap(countries, country.clientCountryName, country.requests);
      for (const browser of sum.browserMap ?? []) addToMap(browsers, browser.uaBrowserFamily, browser.pageViews);
      for (const status of sum.responseStatusMap ?? []) addToMap(statuses, String(status.edgeResponseStatus ?? ''), status.requests);

      return {
        date: day.dimensions?.date ?? '',
        visitors: day.uniq?.uniques ?? 0,
        pageViews: sum.pageViews ?? 0,
        requests: sum.requests ?? 0,
      };
    });

    // Daily unique counts cannot be added into a true period-wide unique count.
    // The dashboard labels this clearly as "daily unique total".
    const dailyUniqueTotal = timeline.reduce((total, day) => total + day.visitors, 0);
    const errorRequests = [...statuses.entries()]
      .filter(([status]) => status.startsWith('4') || status.startsWith('5'))
      .reduce((total, [, value]) => total + value, 0);

    const paths = (liveResult.paths ?? [])
      .map((group) => ({
        path: group.dimensions?.clientRequestPath ?? '',
        visits: group.sum?.visits ?? 0,
        requests: group.count ?? 0,
      }))
      .filter((item) => item.path && item.visits > 0 && isPublicContentPath(item.path))
      .slice(0, 10);

    const devices = (liveResult.devices ?? [])
      .map((group) => ({ name: group.dimensions?.clientDeviceType || 'Unknown', value: group.count ?? 0 }))
      .filter((item) => item.value > 0);

    const liveStatuses = (liveResult.liveStatuses ?? [])
      .map((group) => ({ name: String(group.dimensions?.edgeResponseStatus ?? 'Unknown'), value: group.count ?? 0 }))
      .filter((item) => item.value > 0);

    return json({
      periodDays: range.periodDays,
      rangeMode: range.mode,
      rangeStart: range.startDate,
      rangeEnd: range.endDate,
      availableStart: timeline[0]?.date ?? null,
      availableEnd: timeline[timeline.length - 1]?.date ?? null,
      generatedAt: now.toISOString(),
      summary: {
        dailyUniqueTotal,
        pageViews,
        requests,
        bytes,
        cacheHitRate: requests > 0 ? cachedRequests / requests : 0,
        errorRate: requests > 0 ? errorRequests / requests : 0,
      },
      timeline,
      countries: sortedEntries(countries),
      browsers: sortedEntries(browsers),
      statuses: sortedEntries(statuses),
      live24h: {
        paths,
        devices,
        statuses: liveStatuses,
      },
    });
  } catch (error) {
    console.warn('[traffic] Could not load analytics.', error);
    return json({ error: 'analytics_unavailable' }, 502);
  }
};
