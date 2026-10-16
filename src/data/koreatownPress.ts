import type { NewsItem, NewsSource } from './newsFeeds';

const origin = 'https://koreatownpress.org';
export function plainText(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/&(?:amp|quot|apos|nbsp);/g, m => ({'&amp;':'&','&quot;':'"','&apos;':"'",'&nbsp;':' '}[m]!))
    .replace(/&#(\d+);/g, (_, n) => +n <= 0x10ffff ? String.fromCodePoint(+n) : '').replace(/\s+/g, ' ').trim();
}

/** Collect newsroom sections; the daily relevance filter handles Korea-related usefulness. */
export function parseKoreatownPress(html: string): NewsItem[] {
  const items = new Map<string, NewsItem>();
  for (const block of html.match(/<article\b[\s\S]*?<\/article>/gi) ?? []) {
    const href = block.match(/<a\b[^>]*href=["']([^"']+)["']/i)?.[1];
    const heading = block.match(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/i)?.[1];
    const published = block.match(/<time\b(?=[^>]*data-content-field=["']datePublished["'])[^>]*datetime=["']([^"']+)["']/i)?.[1];
    if (!href || !heading || !published || !/Z$|[+-]\d\d:\d\d$/.test(published)) continue;
    try {
      const url = new URL(href, origin);
      const date = Date.parse(published);
      if (url.origin !== origin || !/^\/news\/(?:local|usa|town|immigration|korea)\/[^/]+\/?$/.test(url.pathname) || !Number.isFinite(date)) continue;
      const title = plainText(heading);
      if (title) items.set(url.href, { sourceId: 'news-koreatownpress', publisher: '코리아타운프레스', title, url: url.href, date: new Date(date).toISOString(), summary: '' });
    } catch { /* Ignore malformed publisher markup. */ }
  }
  return [...items.values()];
}

let pending: Promise<NewsItem[]> | undefined;
export function fetchKoreatownPress(source: NewsSource, read: (url: string) => Promise<string | null>): Promise<NewsItem[]> {
  pending ??= Promise.all([origin+'/', origin+'/news/town', origin+'/news/local', origin+'/news/usa', origin+'/news/immigration',origin+'/news/korea'].map(read))
    .then(pages => pages.flatMap(html => html ? parseKoreatownPress(html) : []));
  return pending.then(items => items.filter(item => (!source.keywords || source.keywords.test(item.title)) && !source.excludeKeywords?.test(item.title)));
}
