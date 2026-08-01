import type { Locale } from '../i18n';

/**
 * Fraud news, gathered from several trusted feeds at BUILD TIME and baked into
 * the static News page. Rebuild (or redeploy) to refresh — Cloudflare Pages
 * rebuilds on every push, and a scheduled deploy hook keeps it fresher.
 *
 * Replaces the single-source ftcAlerts.ts. The parsing quirks it handled are
 * still here, now as per-source flags rather than hard-coded behaviour.
 *
 * ADDING A SOURCE: append to `newsSources` below. It must be a government
 * agency, a recognised consumer-protection body, or an established newspaper —
 * this site sends fraud victims to reporting agencies, and a bad link in this
 * list costs more than a missing one. Check the feed returns HTTP 200 and real
 * <item> elements first; a source that fails simply loses its tab.
 */

export interface NewsSource {
  id: string;
  /** Tab label. */
  label: Record<Locale, string>;
  /** One or more RSS URLs; several are merged into one tab (e.g. IC3). */
  urls: string[];
  /** Where "see all" points. */
  homepage: string;
  /**
   * The FTC consumer-alerts feed puts the real article URL in an <a> inside
   * <title>, and its <link> is double-encoded and unusable.
   */
  urlFromTitleAnchor?: boolean;
  /**
   * Narrows an agency-wide feed to its fraud stories, matched against the
   * HEADLINE only. Matching the body too was tried and pulled in items that
   * merely mention fraud in passing — a terrorism financing case surfaced on a
   * consumer scam page. If the headline is not about fraud, neither is the item.
   */
  keywords?: RegExp;
  /** Whether to show the feed's own summary text under the headline. */
  showSummary?: boolean;
  /** Items link to a PDF rather than a web page. */
  linksToPdf?: boolean;
}

export interface NewsItem {
  sourceId: string;
  title: string;
  url: string;
  summary: string;
  /** ISO date string, or null when the feed omits/garbles pubDate. */
  date: string | null;
}

/**
 * Fraud vocabulary, for feeds that carry an agency's whole press output rather
 * than consumer alerts only — the FBI publishes plenty that has nothing to do
 * with consumer fraud.
 */
const FRAUD_TERMS =
  /fraud|scam|phish|identity theft|impost[eo]r|deceptive|romance|crypto|ponzi|robocall|spoof|elder|consumer protection|money launder/i;

export const newsSources: NewsSource[] = [
  {
    id: 'ftc-alerts',
    label: { en: 'FTC Alerts', ko: 'FTC 주의보' },
    urls: ['https://consumer.ftc.gov/blog/rss'],
    homepage: 'https://consumer.ftc.gov/consumer-alerts',
    urlFromTitleAnchor: true,
    showSummary: true,
  },
  {
    id: 'ftc-press',
    label: { en: 'FTC Press', ko: 'FTC 보도자료' },
    urls: ['https://www.ftc.gov/feeds/press-release-consumer-protection.xml'],
    homepage: 'https://www.ftc.gov/news-events/news/press-releases',
    showSummary: true,
  },
  {
    id: 'cfpb',
    label: { en: 'CFPB', ko: 'CFPB 소비자금융보호국' },
    // The blog feed (about-us/blog/feed/) is a valid but permanently empty
    // channel — the newsroom feed is the one that actually carries items.
    urls: ['https://www.consumerfinance.gov/about-us/newsroom/feed/'],
    homepage: 'https://www.consumerfinance.gov/about-us/newsroom/',
    // The newsroom is largely rulemaking and policy — mortgage data releases,
    // lending thresholds — so it needs the same narrowing as the FBI's feed.
    keywords: FRAUD_TERMS,
    showSummary: true,
  },
  {
    id: 'ic3',
    label: { en: 'FBI IC3', ko: 'FBI 인터넷범죄신고센터' },
    // Industry alerts and public service announcements, merged. Both skew
    // heavily to infrastructure cyber-security — water utilities, industrial
    // controllers — so only the consumer-facing minority is kept.
    urls: ['https://www.ic3.gov/CSA/RSS', 'https://www.ic3.gov/PSA/RSS'],
    homepage: 'https://www.ic3.gov/PSA',
    keywords: FRAUD_TERMS,
    linksToPdf: true,
  },
  {
    // The Postal Inspection Service would belong here, but it publishes no
    // working feed: /feed, /news/feed and /news-releases/feed all return either
    // an empty channel or the site's comments feed. It remains in the reporting
    // directory (agencies.ts) — only its news is unavailable.
    id: 'fbi',
    label: { en: 'FBI Press', ko: 'FBI 보도자료' },
    urls: ['https://www.fbi.gov/feeds/national-press-releases/rss.xml'],
    homepage: 'https://www.fbi.gov/news/press-releases',
    keywords: FRAUD_TERMS,
    showSummary: true,
  },
  /*
   * Two things were tried here and dropped, so they are not retried blindly:
   *
   * - California Attorney General: oag.ca.gov's only feed carries
   *   advisory-committee agendas and missing-persons bulletins, not the
   *   consumer press releases we wanted.
   * - Korean-language news: no LA Korean-American outlet (Korea Daily, Radio
   *   Korea, Korea Times) and no Korean government fraud source (FSS, KISA,
   *   경찰청) publishes a working feed. The Korea-domestic newspapers that do
   *   yielded roughly one fraud story per fifty items, and those were domestic
   *   court cases rather than scams affecting this community.
   */
];

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

/**
 * Unwrap CDATA before any tag stripping. `<[^>]*>` would otherwise swallow
 * `<![CDATA[ … ]]>` whole — its first `>` is the closing one — silently
 * emptying every title in the Korean newspaper feeds, which use CDATA throughout.
 */
function stripCdata(input: string): string {
  return input.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

function clean(input: string): string {
  return decodeEntities(stripTags(decodeEntities(stripCdata(input))))
    .replace(/\s+/g, ' ')
    .trim();
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

/** Parse one feed document into items. Exported for testing. */
export function parseFeed(xml: string, source: NewsSource, limit: number): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

  for (const block of blocks) {
    const rawTitle = tagContent(block, 'title');
    const title = clean(rawTitle);

    let url: string | null = null;
    if (source.urlFromTitleAnchor) {
      url = decodeEntities(rawTitle).match(/href\s*=\s*"([^"]+)"/i)?.[1] ?? null;
    }
    if (!url) {
      const link = clean(tagContent(block, 'link'));
      if (link.startsWith('http')) url = link;
    }
    if (!url) {
      const guid = clean(tagContent(block, 'guid'));
      if (guid.startsWith('http')) url = guid;
    }
    if (!url || !title) continue;

    if (source.keywords && !source.keywords.test(title)) continue;

    const summary = clean(tagContent(block, 'description'));

    const pubDate = clean(tagContent(block, 'pubDate'));
    const parsed = pubDate ? new Date(pubDate) : null;

    items.push({
      sourceId: source.id,
      title,
      url,
      summary: source.showSummary ? truncate(summary) : '',
      date: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : null,
    });

    if (items.length >= limit) break;
  }

  return items;
}

/**
 * One attempt. Returns the body, or null with the reason logged.
 *
 * The headers are both load-bearing: the FTC serves nothing without a
 * browser-like User-Agent, and the FBI's edge rejects a request that sends no
 * Accept header at all.
 */
async function fetchOnce(url: string): Promise<{ body: string } | { retryable: boolean }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (response.ok) return { body: await response.text() };
    console.warn(`[news] ${url} returned HTTP ${response.status}.`);
    return { retryable: response.status === 403 || response.status === 429 || response.status >= 500 };
  } catch (error) {
    console.warn(`[news] Could not reach ${url}.`, error);
    return { retryable: true };
  }
}

/**
 * The FBI's edge challenges the first request on a cold connection with a 403
 * and serves the retry — measured, not guessed. One retry costs a second on a
 * build and is the difference between having that source and losing it.
 */
async function fetchFeed(url: string): Promise<string | null> {
  const first = await fetchOnce(url);
  if ('body' in first) return first.body;
  if (!first.retryable) return null;

  await new Promise((resolve) => setTimeout(resolve, 1500));
  const second = await fetchOnce(url);
  if ('body' in second) return second.body;

  console.warn(`[news] Giving up on ${url}; skipping.`);
  return null;
}

function byDateDesc(a: NewsItem, b: NewsItem): number {
  if (a.date && b.date) return b.date.localeCompare(a.date);
  if (a.date) return -1;
  if (b.date) return 1;
  return 0;
}

export interface NewsFeedResult {
  items: NewsItem[];
  /** Sources that returned at least one item — the only ones that get a tab. */
  liveSources: NewsSource[];
}

/**
 * One fetch per build, shared by both language pages.
 *
 * Without this, /news and /ko/news each pulled every feed, and the FBI's edge
 * answered 403 to the second burst — the page lost a source to what was really
 * our own duplicate traffic.
 */
let pending: Promise<NewsFeedResult> | null = null;

/**
 * Fetch every source. Failures are contained: a source that is unreachable or
 * returns nothing usable simply drops out, so one dead feed can never break the
 * build or empty the page.
 */
export function fetchAllNews(perSource = 8): Promise<NewsFeedResult> {
  pending ??= gatherNews(perSource);
  return pending;
}

async function gatherNews(perSource: number): Promise<NewsFeedResult> {
  const results = await Promise.allSettled(
    newsSources.map(async (source) => {
      const documents = await Promise.all(source.urls.map(fetchFeed));
      const items: NewsItem[] = [];
      for (const xml of documents) {
        if (xml) items.push(...parseFeed(xml, source, perSource));
      }
      // Merged feeds (IC3) can exceed the cap once combined.
      return items.sort(byDateDesc).slice(0, perSource);
    }),
  );

  const items: NewsItem[] = [];
  const liveSources: NewsSource[] = [];
  const seen = new Set<string>();

  results.forEach((result, index) => {
    if (result.status !== 'fulfilled' || result.value.length === 0) {
      console.warn(`[news] No items from "${newsSources[index].id}"; its tab is hidden.`);
      return;
    }
    liveSources.push(newsSources[index]);
    for (const item of result.value) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      items.push(item);
    }
  });

  return { items: items.sort(byDateDesc), liveSources };
}
