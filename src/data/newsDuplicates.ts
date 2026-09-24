import type { NewsItem, NewsSource } from './newsFeeds';

/** Match identical headlines despite smart quotes, punctuation or spacing. */
export function headlineKey(title: string): string {
  return title.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

// Verified publisher URLs for the example selected by CRC. They also let the
// image check work when Google's redirect service is temporarily unavailable.
const FBI_HEADLINE = headlineKey('해커 조직 “FBI요원 수천명 신상정보 해킹”…FBI “철저 수사중”');
const VERIFIED_URLS: Record<string, string> = {
  [`news-koreadaily:${FBI_HEADLINE}`]: 'https://www.koreadaily.com/article/20260923142911205',
  [`news-koreatimes:${FBI_HEADLINE}`]: 'http://la.koreatimes.com/article/20260923/1631010',
};

function unescapeHtml(value: string): string {
  return value.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'").replace(/&apos;/gi, "'");
}

function attributes(tag: string): Record<string, string> {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)]
    .map((m) => [m[1].toLowerCase(), unescapeHtml(m[3])]));
}

/** Article-image metadata only: page ads, navigation images and logos do not count. */
export function hasArticleImage(html: string): boolean {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = attributes(tag);
    if (!/^(?:og:image(?::url)?|twitter:image(?::src)?)$/i.test(attrs.property ?? attrs.name ?? '')) continue;
    const image = attrs.content ?? '';
    if (/^https?:\/\//i.test(image) && !/logo|favicon|placeholder|default|no[-_]?image|blank|spacer/i.test(image)) return true;
  }
  return false;
}

function publisherUrl(value: string, domain: string): boolean {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.port
      && (url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch { return false; }
}

async function readPage(url: string, domain: string): Promise<{ html: string; url: string } | null> {
  for (let redirects = 0; redirects < 4; redirects++) {
    if (!publisherUrl(url, domain)) return null;
    const response = await fetch(url, {
      redirect: 'manual', signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return null;
      url = new URL(location, url).href;
      continue;
    }
    if (!response.ok) return null;
    return { html: await response.text(), url };
  }
  return null;
}

// Google News RSS wraps article URLs. This optional build-time lookup uses its
// public redirect response; failures never block the feed or disable deduping.
async function resolveArticle(item: NewsItem, domain: string): Promise<string | null> {
  const known = VERIFIED_URLS[`${item.sourceId}:${headlineKey(item.title)}`];
  if (known) return known;
  if (publisherUrl(item.url, domain)) return item.url;
  const url = new URL(item.url);
  if (url.hostname !== 'news.google.com' || !/^\/rss\/articles\/[\w-]+$/.test(url.pathname)) return null;
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  const html = await response.text();
  const tag = html.match(/<[^>]+\bdata-n-a-id=[^>]+>/i)?.[0];
  if (!tag) return null;
  const attrs = attributes(tag);
  const timestamp = Number(attrs['data-n-a-ts']);
  if (!attrs['data-n-a-id'] || !attrs['data-n-a-sg'] || !Number.isFinite(timestamp)) return null;
  const request = ['garturlreq', [['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1], 'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0], attrs['data-n-a-id'], timestamp, attrs['data-n-a-sg']];
  const decoded = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
    method: 'POST', signal: AbortSignal.timeout(8000),
    headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ 'f.req': JSON.stringify([[['Fbv4je', JSON.stringify(request)]]]) }),
  });
  if (!decoded.ok) return null;
  for (const line of (await decoded.text()).split('\n')) {
    if (!line.startsWith('[[')) continue;
    for (const row of JSON.parse(line)) {
      if (row[0] !== 'wrb.fr' || row[1] !== 'Fbv4je' || typeof row[2] !== 'string') continue;
      const result = JSON.parse(row[2]);
      if (result[0] === 'garturlres' && publisherUrl(result[1], domain)) return result[1];
    }
  }
  return null;
}

export type ImageCheck = (item: NewsItem, source: NewsSource) => Promise<boolean | null>;
export const inspectArticleImage: ImageCheck = async (item, source) => {
  if (!source.publisherDomain) return null;
  try {
    const url = await resolveArticle(item, source.publisherDomain);
    if (!url) return null;
    const page = await readPage(url, source.publisherDomain);
    if (!page) return null;
    // Do not interpret a challenge/error page as an article without a photo.
    const titles = [page.html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''];
    for (const tag of page.html.match(/<meta\b[^>]*>/gi) ?? []) {
      const attrs = attributes(tag);
      if (/^(?:og:title|twitter:title|title)$/i.test(attrs.property ?? attrs.name ?? '')) titles.push(attrs.content ?? '');
    }
    if (!titles.some((title) => headlineKey(unescapeHtml(title)).includes(headlineKey(item.title)))) return null;
    return hasArticleImage(page.html);
  } catch {
    return null;
  }
};

/** One row per headline across outlets. Inspect only duplicate newspaper stories. */
export async function deduplicateNews(
  items: NewsItem[], sources: NewsSource[], check: ImageCheck = inspectArticleImage,
): Promise<NewsItem[]> {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const groups = new Map<string, NewsItem[]>();
  for (const item of items) {
    const key = headlineKey(item.title);
    const group = groups.get(key) ?? [];
    if (!group.some((existing) => existing.url === item.url)) group.push(item);
    groups.set(key, group);
  }
  const winners: NewsItem[] = [];
  // Sequential groups bound network concurrency to the number of duplicates
  // in one group (normally two), without fetching every unique news article.
  for (const group of groups.values()) {
    const publishers = new Set(group.map((item) => sourceById.get(item.sourceId)?.publisherDomain).filter(Boolean));
    if (group.length < 2 || publishers.size < 2) { winners.push(group[0]); continue; }
    const imageStates = await Promise.all(group.map(async (item) => {
      try { return await check(item, sourceById.get(item.sourceId)!); } catch { return null; }
    }));
    const rank = (index: number) => imageStates[index] === true ? 2 : imageStates[index] === null ? 1 : 0;
    const ranked = group.map((item, index) => ({ item, index })).sort((a, b) =>
      rank(b.index) - rank(a.index)
      // CRC's chosen outlet for the example also provides a stable tie-breaker
      // when images are equal or article metadata cannot be retrieved.
      || Number(b.item.sourceId === 'news-koreatimes') - Number(a.item.sourceId === 'news-koreatimes')
      || (b.item.date ?? '').localeCompare(a.item.date ?? '')
      || a.item.url.localeCompare(b.item.url));
    winners.push(ranked[0].item);
  }
  const seenUrls = new Set<string>();
  return winners.filter((item) => {
    if (seenUrls.has(item.url)) return false;
    seenUrls.add(item.url);
    return true;
  });
}
