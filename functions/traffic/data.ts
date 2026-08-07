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

interface GraphQLPayload {
  data?: {
    viewer?: {
      zones?: Array<{
        days?: LegacyDay[];
        paths?: AdaptiveGroup[];
        devices?: AdaptiveGroup[];
        liveStatuses?: AdaptiveGroup[];
      }>;
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

const QUERY = `
  query TrafficDashboard(
    $zoneTag: string,
    $startDate: Date,
    $endDate: Date,
    $liveStart: Time,
    $liveEnd: Time
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

export const onRequestGet = async ({ request, env }: EventContext): Promise<Response> => {
  const url = new URL(request.url);
  if (!ALLOWED_HOSTS.has(url.hostname)) return json({ error: 'not_found' }, 404);

  const viewerEmail = await verifiedAccessEmail(request);
  if (!viewerEmail || !ALLOWED_EMAILS.has(viewerEmail)) return json({ error: 'forbidden' }, 403);

  if (!env.CLOUDFLARE_ANALYTICS_TOKEN || !env.CLOUDFLARE_ZONE_ID) {
    return json({ error: 'analytics_unavailable' }, 503);
  }

  const requestedDays = Number(url.searchParams.get('days'));
  const days = requestedDays === 30 ? 30 : 7;
  const now = new Date();
  const start = new Date(now.getTime() - (days - 1) * 86_400_000);
  const liveStart = new Date(now.getTime() - 86_400_000);

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.CLOUDFLARE_ANALYTICS_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: {
          zoneTag: env.CLOUDFLARE_ZONE_ID,
          startDate: start.toISOString().slice(0, 10),
          endDate: now.toISOString().slice(0, 10),
          liveStart: liveStart.toISOString(),
          liveEnd: now.toISOString(),
        },
      }),
    });

    const payload = await response.json() as GraphQLPayload;
    const zone = payload.data?.viewer?.zones?.[0];
    if (!response.ok || payload.errors?.length || !zone) {
      console.warn('[traffic] Cloudflare analytics query failed.', {
        status: response.status,
        errors: payload.errors?.map((error) => error.message),
      });
      return json({ error: 'analytics_unavailable' }, 502);
    }

    const countries = new Map<string, number>();
    const browsers = new Map<string, number>();
    const statuses = new Map<string, number>();
    let requests = 0;
    let pageViews = 0;
    let bytes = 0;
    let cachedRequests = 0;

    const timeline = (zone.days ?? []).map((day) => {
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

    const paths = (zone.paths ?? [])
      .map((group) => ({
        path: group.dimensions?.clientRequestPath ?? '',
        visits: group.sum?.visits ?? 0,
        requests: group.count ?? 0,
      }))
      .filter((item) => item.path && item.visits > 0 && isPublicContentPath(item.path))
      .slice(0, 10);

    const devices = (zone.devices ?? [])
      .map((group) => ({ name: group.dimensions?.clientDeviceType || 'Unknown', value: group.count ?? 0 }))
      .filter((item) => item.value > 0);

    const liveStatuses = (zone.liveStatuses ?? [])
      .map((group) => ({ name: String(group.dimensions?.edgeResponseStatus ?? 'Unknown'), value: group.count ?? 0 }))
      .filter((item) => item.value > 0);

    return json({
      periodDays: days,
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
