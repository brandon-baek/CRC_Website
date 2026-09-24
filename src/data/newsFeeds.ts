import type { Locale } from '../i18n';
import { allowedEnglishPublishers, allowedKoreanPublishers } from './newsPublishers';
import { deduplicateNews, headlineKey } from './newsDuplicates';

/**
 * Fraud and cyber-risk news, gathered from trusted feeds at BUILD TIME and baked into
 * the static News page. Rebuild (or redeploy) to refresh — Cloudflare Pages
 * rebuilds on every push, and a scheduled deploy hook keeps it fresher.
 *
 * Two kinds of source feed this page:
 *   - Government agencies, each its own feed (FTC, CFPB, FBI).
 *   - Press coverage, via Google News search feeds. Outlets' own RSS is no use
 *     here: front-page feeds from KTLA, ABC7, NBC LA, FOX 11, NPR, NBC, ABC and
 *     CBS MoneyWatch together yielded zero scam stories across 152 items, and
 *     their per-topic tag feeds return nothing at all. One Google News query
 *     returns 100 items from dozens of real outlets, each naming its publisher.
 *
 * ADDING A SOURCE: append to `newsSources` below. It must be a government
 * agency, a recognised consumer-protection body, or an established newspaper —
 * this site sends fraud victims to reporting agencies, and a bad link in this
 * list costs more than a missing one. Check the feed returns HTTP 200 and real
 * <item> elements first; a source that fails simply loses its tab.
 * For press coverage, the outlet must also be in src/data/newsPublishers.ts.
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
  /** Secondary relevance check, such as community context or cyber risk. */
  requiredKeywords?: RegExp;
  /** Exclude syndicated entertainment headlines. */
  excludeKeywords?: RegExp;
  /** Whether to show the feed's own summary text under the headline. */
  showSummary?: boolean;
  /** Items link to a PDF rather than a web page. */
  linksToPdf?: boolean;
  /**
   * Google News aggregates many outlets into one feed, naming the publisher per
   * item in <source> rather than per feed. Set this to read that name, strip the
   * " - Publisher" suffix Google appends to every headline, and enforce
   * `allowPublishers`.
   */
  publisherPerItem?: boolean;
  /**
   * Only these outlets may appear. Required alongside `publisherPerItem`:
   * Google indexes corporate blogs and content farms next to real newspapers,
   * and this page is about whom to trust. See src/data/newsPublishers.ts.
   */
  allowPublishers?: Set<string>;
  /** Validate the RSS publisher URL as well as its display name. */
  publisherDomain?: string;
  /** Language of the items, for the lang/hreflang attributes on each link. */
  lang?: Locale;
}

export interface NewsItem {
  sourceId: string;
  title: string;
  url: string;
  summary: string;
  /** ISO date string, or null when the feed omits/garbles pubDate. */
  date: string | null;
  /** The outlet, when the feed carries many. Shown instead of the feed label. */
  publisher?: string;
}

/**
 * Build a Google News search feed URL.
 *
 * `hl`/`gl`/`ceid` together decide both the interface language and which
 * edition is searched. The two Korean-American papers use the US edition and
 * explicit site restrictions, with publisher domains verified during parsing.
 */
function googleNews(query: string, hl: string, gl: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}&ceid=${gl}:${hl.split('-')[0]}`;
}

/**
 * Fraud vocabulary, for feeds that carry an agency's whole press output rather
 * than consumer alerts only — the FBI publishes plenty that has nothing to do
 * with consumer fraud.
 */
const FRAUD_TERMS =
  /fraud|scam|phish|identity theft|impost[eo]r|deceptive|romance|crypto|ponzi|robocall|spoof|elder|consumer protection|money launder/i;

/**
 * The Korean equivalent.
 *
 * Deliberately does NOT match a bare 사기: it is a substring of common,
 * unrelated words — 군사기밀 (military secrets), 수사기관 (investigative body),
 * 사기충천 (high morale) — which pulled politics and crime stories onto a
 * consumer-fraud page when this was tried the obvious way. Match compounds.
 */
const KO_FRAUD_TERMS =
  /보이스피싱|스미싱|피싱|사기범|사기단|사기당|사기[\s·]?혐의|사기[\s·]?피해|사기[\s·]?사건|사기[\s·]?행각|금융[\s·]?사기|투자[\s·]?사기|전화[\s·]?사기|보험[\s·]?사기|중고[\s·]?거래[\s·]?사기|로맨스[\s·]?스캠|사칭|먹튀|신분[\s·]?도용|바가지|(?:^|[^\p{L}\p{N}])사기(?=$|[\s·….,!?])/u;

// These US papers also syndicate overseas news. Keep community and consumer
// headlines; this deliberately favors relevance over filling every available row.
const KO_COMMUNITY_TERMS = /한인|미국|미주|북미|캘리포니아|가주|LA\b|뉴욕|뉴저지|워싱턴|텍사스|시카고|연방|달러|\d[\d,.]*\s*만?불|401\s*\(?k|메디케어|소셜|이민|공관|배심원|재산세|납세자|신용카드|차고문/i;
const KO_ENTERTAINMENT_TERMS = /Oh!|오!쎈|연예|소속사|드라마|예능|방송작가|병역\s*기피/i;

// Hacking and stolen personal/account data can enable identity theft and scams,
// even when a headline does not yet mention fraud or a US location. Do not
// match a bare "유출" or "탈취": those also describe product leaks and trade disputes.
const KO_CYBER_TERMS = /해킹|해커|랜섬웨어|악성코드|피싱|(?:개인|신상|고객|회원|계정|금융|카드|결제)\s*(?:정보|데이터)(?:가|를|의)?\s*(?:유출|탈취|도용)|(?:계정|비밀번호|패스워드)\s*(?:정보\s*)?(?:유출|탈취|도용)/i;
const KO_NEWS_TERMS = new RegExp(`${KO_FRAUD_TERMS.source}|${KO_CYBER_TERMS.source}`, 'iu');
const KO_COMMUNITY_OR_CYBER_TERMS = new RegExp(`${KO_COMMUNITY_TERMS.source}|${KO_CYBER_TERMS.source}`, 'i');

function koreanCyberFeed(domain: string): string {
  return googleNews(`site:${domain} (해킹 OR 해커 OR 개인정보 유출 OR 정보유출 OR 랜섬웨어 OR 계정 탈취) when:180d`, 'ko', 'US');
}

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
  /* ---------- Press coverage, via Google News searches ---------- */
  {
    id: 'news-la',
    label: { en: 'LA & California', ko: 'LA·캘리포니아 뉴스' },
    urls: [
      googleNews(
        '("scam" OR "scams" OR "scammer" OR "consumer fraud" OR "identity theft") ("Los Angeles" OR "Southern California" OR California)',
        'en-US',
        'US',
      ),
    ],
    homepage: 'https://news.google.com/search?q=scam%20%22Los%20Angeles%22',
    publisherPerItem: true,
    allowPublishers: allowedEnglishPublishers,
    keywords: FRAUD_TERMS,
    lang: 'en',
  },
  {
    id: 'news-national',
    label: { en: 'National', ko: '전국 뉴스' },
    urls: [
      googleNews(
        '"phone scam" OR "text scam" OR "romance scam" OR "elder fraud" OR "identity theft" OR "imposter scam"',
        'en-US',
        'US',
      ),
    ],
    homepage: 'https://news.google.com/search?q=%22phone%20scam%22',
    publisherPerItem: true,
    allowPublishers: allowedEnglishPublishers,
    keywords: FRAUD_TERMS,
    lang: 'en',
  },
  {
    id: 'news-koreadaily',
    label: { en: 'Korea Daily', ko: '미주중앙일보' },
    urls: [googleNews('site:koreadaily.com 사기', 'ko', 'US'), koreanCyberFeed('koreadaily.com')],
    homepage: 'https://www.koreadaily.com/',
    publisherPerItem: true,
    allowPublishers: allowedKoreanPublishers,
    publisherDomain: 'koreadaily.com',
    keywords: KO_NEWS_TERMS,
    requiredKeywords: KO_COMMUNITY_OR_CYBER_TERMS,
    excludeKeywords: KO_ENTERTAINMENT_TERMS,
    lang: 'ko',
  },
  {
    id: 'news-koreatimes',
    label: { en: 'The Korea Times (US)', ko: '미주한국일보' },
    urls: [googleNews('site:koreatimes.com (사기 OR 피싱 OR 사칭 OR 스캠 OR 신분도용) (미국 OR 한인 OR LA OR 캘리포니아 OR 연방) -연예 -스포츠 when:180d', 'ko', 'US'), koreanCyberFeed('koreatimes.com')],
    homepage: 'https://www.koreatimes.com/',
    publisherPerItem: true,
    allowPublishers: allowedKoreanPublishers,
    publisherDomain: 'koreatimes.com',
    keywords: KO_NEWS_TERMS,
    requiredKeywords: KO_COMMUNITY_OR_CYBER_TERMS,
    excludeKeywords: KO_ENTERTAINMENT_TERMS,
    lang: 'ko',
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
    let title = clean(rawTitle);
    let publisher: string | undefined;

    if (source.publisherPerItem) {
      publisher = clean(tagContent(block, 'source'));
      // The allowlist is the whole point of this branch: without it Google
      // hands us corporate blogs and content farms alongside the newspapers.
      if (!publisher || !source.allowPublishers?.has(publisher)) continue;
      if (source.publisherDomain) {
        const sourceUrl = block.match(/<source\b[^>]*\burl=["']([^"']+)["']/i)?.[1];
        try {
          const hostname = new URL(decodeEntities(sourceUrl ?? '')).hostname.toLowerCase();
          if (hostname !== source.publisherDomain && !hostname.endsWith('.' + source.publisherDomain)) continue;
        } catch {
          continue;
        }
      }
      // Google appends " - Publisher" to every headline. Match on the known
      // publisher name rather than the last dash — headlines contain dashes.
      // Looped, because an outlet that already signs its own headline ends up
      // with the suffix twice and one pass leaves the other showing.
      const suffix = ` - ${publisher}`;
      while (title.endsWith(suffix)) title = title.slice(0, -suffix.length).trim();
      // Use the newspaper's name rather than Google's hostname-style branding.
      if (source.publisherDomain) publisher = source.label.ko;
    }

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
    if (source.requiredKeywords && !source.requiredKeywords.test(title)) continue;
    if (source.excludeKeywords?.test(title)) continue;

    const summary = clean(tagContent(block, 'description'));

    const pubDate = clean(tagContent(block, 'pubDate'));
    const parsed = pubDate ? new Date(pubDate) : null;

    items.push({
      sourceId: source.id,
      title,
      url,
      summary: source.showSummary ? truncate(summary) : '',
      date: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : null,
      publisher,
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

/** Loose key for spotting the same story twice: case, punctuation and spacing differ. */
function normalizeTitle(title: string): string {
  return headlineKey(title);
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
        if (xml) items.push(...parseFeed(xml, source, Number.POSITIVE_INFINITY));
      }
      // Merged feeds (IC3) can exceed the cap once combined.
      // Google ranks by relevance. Sort and deduplicate before limiting rows.
      const seen = new Set<string>();
      return items.sort(byDateDesc).filter((item) => {
        const key = normalizeTitle(item.title);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, perSource);
    }),
  );

  const candidates = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  const items = await deduplicateNews(candidates, newsSources);
  // A source whose only story lost a duplicate comparison must not leave an empty tab.
  const retainedSources = new Set(items.map((item) => item.sourceId));
  const liveSources = newsSources.filter((source) => retainedSources.has(source.id));
  return { items: items.sort(byDateDesc), liveSources };
}
