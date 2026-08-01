/**
 * Latest FTC consumer alerts, fetched at BUILD TIME and baked into the static
 * News page. Rebuild (or redeploy) to refresh — Cloudflare Pages rebuilds on
 * every push, and you can schedule periodic deploy hooks if you want it fresher.
 *
 * The feed is quirky: <title> contains an <a> tag with the real URL, and <link>
 * is double-encoded and unusable. So the URL is pulled out of the title markup.
 */

export interface FtcAlert {
  title: string;
  url: string;
  summary: string;
  /** ISO date string, or null when the feed omits/garbles pubDate. */
  date: string | null;
}

const FEED_URL = 'https://consumer.ftc.gov/blog/rss';
export const FTC_ALERTS_PAGE = 'https://consumer.ftc.gov/consumer-alerts';

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
  mdash: '—',
  ndash: '–',
  hellip: '…',
};

function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

function clean(input: string): string {
  return decodeEntities(stripTags(decodeEntities(input))).replace(/\s+/g, ' ').trim();
}

function truncate(input: string, max = 220): string {
  if (input.length <= max) return input;
  const cut = input.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}…`;
}

function tagContent(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? match[1] : '';
}

export function parseFtcFeed(xml: string, limit: number): FtcAlert[] {
  const alerts: FtcAlert[] = [];
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

  for (const item of items) {
    const rawTitle = tagContent(item, 'title');
    // The real article URL lives in the anchor inside <title>; <link> is unusable.
    const href = decodeEntities(rawTitle).match(/href\s*=\s*"([^"]+)"/i)?.[1];
    const guid = clean(tagContent(item, 'guid'));
    const url = href ?? (guid.startsWith('http') ? guid : null);
    const title = clean(rawTitle);
    if (!url || !title) continue;

    const pubDate = clean(tagContent(item, 'pubDate'));
    const parsed = pubDate ? new Date(pubDate) : null;

    alerts.push({
      title,
      url,
      summary: truncate(clean(tagContent(item, 'description'))),
      date: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : null,
    });

    if (alerts.length >= limit) break;
  }

  return alerts;
}

/**
 * Returns an empty array if the feed is unreachable at build time; the News page
 * then shows a fallback message and a link to the FTC site, so a network blip
 * can never break the build.
 */
export async function fetchFtcAlerts(limit = 8): Promise<FtcAlert[]> {
  try {
    const response = await fetch(FEED_URL, {
      headers: {
        // The FTC rejects requests without a browser-like User-Agent.
        'User-Agent': 'Mozilla/5.0 (compatible; ConsumerResourceCenter/1.0; +https://consumer.ftc.gov)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.warn(`[news] FTC feed returned HTTP ${response.status}; rendering fallback.`);
      return [];
    }
    return parseFtcFeed(await response.text(), limit);
  } catch (error) {
    console.warn('[news] Could not load the FTC feed; rendering fallback.', error);
    return [];
  }
}
