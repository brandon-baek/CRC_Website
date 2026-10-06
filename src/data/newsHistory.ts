import type { NewsItem, NewsSource } from './newsFeeds';

/** Validate a previous build's public snapshot; dates are never changed to look fresh. */
export function retainedNews(value: unknown, sources: NewsSource[], now = Date.now()): NewsItem[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { items?: unknown }).items)) return [];
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  return (value as { items: NewsItem[] }).items.filter((item) => {
    if (!item || typeof item.title !== 'string' || !item.title || item.title.length > 2000 || typeof item.url !== 'string' || typeof item.date !== 'string') return false;
    const source = sourceById.get(item.sourceId);
    const date = Date.parse(item.date);
    if (!source || !Number.isFinite(date) || date < now - 180 * 86400000 || date > now + 86400000) return false;
    try {
      const url = new URL(item.url);
      const domain = (source.publisherDomain ?? new URL(source.homepage).hostname).replace(/^www\./, '');
      return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.port
        && (url.hostname === domain || url.hostname.endsWith(`.${domain}`) || (source.publisherPerItem && url.hostname === 'news.google.com'));
    } catch { return false; }
  }).map((item) => ({ sourceId: item.sourceId, title: item.title, url: item.url, date: item.date, summary: typeof item.summary === 'string' ? item.summary : '', ...(typeof item.publisher === 'string' ? { publisher: item.publisher } : {}) }));
}
