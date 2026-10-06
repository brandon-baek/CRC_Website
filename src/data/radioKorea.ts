import type { NewsItem, NewsSource } from './newsFeeds';

const ORIGIN = 'https://www.radiokorea.com';
const LISTS = [
  `${ORIGIN}/news/`,
  ...[1, 2, 3].map((page) => `${ORIGIN}/news/news.php?type=local&page=${page}`),
  `${ORIGIN}/news/news.php?type=immigration`,
  `${ORIGIN}/news/news.php?type=it`,
];

function text(html: string): string {
  const entities: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”' };
  return html.replace(/<[^>]*>/g, '').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (!entity.startsWith('#')) return entities[entity.toLowerCase()] ?? match;
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  }).replace(/\s+/g, ' ').trim();
}

/** Accept only Radio Korea's article endpoint, never ads or third-party links. */
function articleUrl(href: string): string | null {
  try {
    const url = new URL(href.replace(/&amp;/g, '&'), ORIGIN);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return null;
    if (!['radiokorea.com', 'www.radiokorea.com'].includes(url.hostname) || url.pathname !== '/news/article.php') return null;
    const uid = url.searchParams.get('uid');
    return uid && /^\d+$/.test(uid) ? `${ORIGIN}/news/article.php?uid=${uid}` : null;
  } catch { return null; }
}

export function parseRadioKoreaLinks(html: string): { title: string; url: string }[] {
  const links = new Map<string, { title: string; url: string }>();
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = articleUrl(match[1]);
    const title = text(match[2]);
    if (url && title) links.set(url, { title, url });
  }
  return [...links.values()];
}

/** The publisher displays Los Angeles time. Convert it without assuming PDT year-round. */
function publishedDate(html: string): string | null {
  const header = html.match(/<span\b[^>]*class=["']article-info["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? '';
  const match = text(header).match(/입력\s+(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  const [, month, day, year, hour, minute, period] = match;
  const wall = Date.UTC(+year, +month - 1, +day, +hour % 12 + (period.toUpperCase() === 'PM' ? 12 : 0), +minute);
  const zone = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'longOffset' });
  const offset = zone.formatToParts(new Date(wall)).find((part) => part.type === 'timeZoneName')?.value.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!offset) return null;
  const minutes = (+offset[2] * 60 + +offset[3]) * (offset[1] === '-' ? -1 : 1);
  return new Date(wall - minutes * 60000).toISOString();
}

export function parseRadioKoreaArticle(html: string, url: string): NewsItem | null {
  const canonical = articleUrl(url);
  const rawTitle = html.match(/<h1\b[^>]*class=["']article-title["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const title = rawTitle ? text(rawTitle) : '';
  const date = publishedDate(html);
  if (!canonical || !title || !date) return null;
  return { sourceId: 'news-radiokorea', publisher: '라디오코리아', title, url: canonical, date, summary: '' };
}

export async function fetchRadioKorea(
  source: NewsSource,
  read: (url: string) => Promise<string | null>,
): Promise<NewsItem[]> {
  const relevant = (title: string) => (!source.keywords || source.keywords.test(title))
    && (!source.requiredKeywords || source.requiredKeywords.test(title))
    && !source.excludeKeywords?.test(title);
  const lists = await Promise.allSettled(LISTS.map(read));
  const candidates = new Map<string, { title: string; url: string }>();
  for (const result of lists) {
    if (result.status !== 'fulfilled' || !result.value) continue;
    for (const link of parseRadioKoreaLinks(result.value)) {
      if (relevant(link.title)) candidates.set(link.url, link);
    }
  }
  // Bound article requests and use four workers, so refreshes do not hammer the publisher.
  const queue = [...candidates.values()].sort((a, b) => Number(new URL(b.url).searchParams.get('uid')) - Number(new URL(a.url).searchParams.get('uid'))).slice(0, 24);
  const items: NewsItem[] = [];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const link = queue.shift()!;
      try {
        const html = await read(link.url);
        const item = html ? parseRadioKoreaArticle(html, link.url) : null;
        if (item && relevant(item.title)) items.push(item);
      } catch { /* Keep other stories and the Google RSS fallback available. */ }
    }
  }));
  return items;
}
