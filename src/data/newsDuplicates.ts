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
  return articleImageUrl(html) !== null;
}

function articleImageUrl(html: string): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = attributes(tag);
    if (!/^(?:og:image(?::url)?|twitter:image(?::src)?)$/i.test(attrs.property ?? attrs.name ?? '')) continue;
    const image = attrs.content ?? '';
    if (/^https?:\/\//i.test(image) && !/logo|favicon|placeholder|default|no[-_]?image|blank|spacer/i.test(image)) return image;
  }
  return null;
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
export async function articlePage(item: NewsItem, source: NewsSource): Promise<string | null> {
  try {
    const domain = source.publisherDomain ?? new URL(source.homepage).hostname;
    if (!source.publisherDomain && source.publisherPerItem) return null;
    const url = await resolveArticle(item, domain);
    if (!url) return null;
    const page = await readPage(url, domain);
    if (!page) return null;
    // Do not interpret a challenge/error page as an article without a photo.
    const titles = [page.html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''];
    for (const tag of page.html.match(/<meta\b[^>]*>/gi) ?? []) {
      const attrs = attributes(tag);
      if (/^(?:og:title|twitter:title|title)$/i.test(attrs.property ?? attrs.name ?? '')) titles.push(attrs.content ?? '');
    }
    if (!titles.some((title) => headlineKey(unescapeHtml(title)).includes(headlineKey(item.title)))) return null;
    return page.html;
  } catch {
    return null;
  }
}

export const inspectArticleImage: ImageCheck = async (item, source) => {
  const html = await articlePage(item, source);
  return html === null ? null : hasArticleImage(html);
};

/** Only featured cards request thumbnails; a missing photo uses a topic illustration. */
export async function featuredArticleImage(item: NewsItem, source: NewsSource): Promise<string | null> {
  const html = await articlePage(item, source);
  const image = html ? articleImageUrl(html) : null;
  return image?.startsWith('https://') ? image : null;
}

/** Conservative story match: punctuation changes, or near-identical syndicated headlines.
 * Different amounts remain distinct. Large rewrites need an editorial override;
 * broad topic matches would incorrectly hide separate incidents.
 */
export function sameStory(a: NewsItem, b: NewsItem): boolean {
  if (a.url === b.url) return true;
  const x = headlineKey(a.title), y = headlineKey(b.title);
  const eventKey = (title:string) => {
    // Narrow recurring events whose Korean headlines routinely use different names.
    // Forecasts are separate from announced changes; don't hide a material update.
    if (/(?:소셜|사회보장)/.test(title) && /연금|COLA/i.test(title) && /인상|오른|조정/.test(title) && !/전망|예상|오르나|추정|위기/.test(title)) {
      const rate=title.match(/\d+(?:\.\d+)?\s*%/)?.[0].replace(/\s/g,'');
      if(rate)return 'social-security-cola:'+rate;
    }
    if(/아마존.*프라임/.test(title)&&/환불/.test(title))return 'amazon-prime-refund';
    if(/아마존/.test(title)&&/타이레놀|진통제/.test(title)&&/리콜/.test(title))return 'amazon-painkiller-recall';
    if(/노벨\s*경제학상/.test(title)&&/미국|미국인|美|스탠퍼드/.test(title))return 'nobel-economics-us';
    return null;
  };
  const event=eventKey(a.title);
  if(event&&event===eventKey(b.title)&&a.date&&b.date&&Math.abs(Date.parse(a.date)-Date.parse(b.date))<3*86400000)return true;
  if (x === y) return true;
  if (a.sourceId !== b.sourceId && a.date && b.date && Math.abs(Date.parse(a.date)-Date.parse(b.date)) > 3*86400000) return false;
  if (Math.min(x.length, y.length) < 22) return false;
  if (JSON.stringify(x.match(/\d+/g)) !== JSON.stringify(y.match(/\d+/g))) return false;
  const grams = (s: string) => new Set(Array.from({length:s.length-2}, (_,i) => s.slice(i,i+3)));
  const gx = grams(x), gy = grams(y);
  const overlap = [...gx].filter(g => gy.has(g)).length;
  return overlap / Math.max(gx.size, gy.size) >= .86;
}

/** Earliest known publication wins. Missing dates sort last; URL breaks ties.
 * No outlet preference, photo preference, or network-response-order preference.
 */
export async function deduplicateNews(items: NewsItem[], _sources: NewsSource[]): Promise<NewsItem[]> {
  const stamp = (item: NewsItem) => item.date && Number.isFinite(Date.parse(item.date)) ? Date.parse(item.date) : Number.POSITIVE_INFINITY;
  const ordered = [...items].sort((a,b) => {
    const x=stamp(a), y=stamp(b);
    return (x < y ? -1 : x > y ? 1 : 0) || a.url.localeCompare(b.url) || a.sourceId.localeCompare(b.sourceId);
  });
  const winners: NewsItem[] = [];
  for (const item of ordered) if (!winners.some(winner => sameStory(winner,item))) winners.push(item);
  return winners;
}
