import type { NewsItem } from './newsFeeds';

export const DAILY_TIME_ZONE = 'America/Los_Angeles';
export function editionDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DAILY_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Never label a prior report as today's. Friday remains eligible through the weekend. */
export function latestStockReport(rows: NewsItem[], now = new Date()): NewsItem | null {
  return rows.filter(item => {
    try {
      const host = new URL(item.url).hostname;
      return item.sourceId === 'news-radiokorea' && /증권\s*소식/.test(item.title)
        && ['www.radiokorea.com', 'radiokorea.com', 'news.google.com'].includes(host)
        && item.date && Date.parse(item.date) <= +now
        && Date.parse(item.date) >= +now - 14 * 86400000;
    } catch { return false; }
  }).sort((a, b) => Date.parse(b.date!) - Date.parse(a.date!))[0] ?? null;
}

export function isTodaysFortune(item: NewsItem, now = new Date()): boolean {
  const [, month, day] = editionDate(now).split('-').map(Number);
  const match = item.title.match(/(?:^|\D)(\d{1,2})월\s*(\d{1,2})일/);
  return !!match && +match[1] === month && +match[2] === day && !!item.date
    && Date.parse(item.date) <= +now && Date.parse(item.date) >= +now - 3 * 86400000;
}

/** Retain the latest dated fortune through weekends; never show tomorrow's early post. */
export function latestFortune(rows: NewsItem[], now = new Date()): NewsItem | null {
  const today = editionDate(now);
  const days = Array.from({length:14}, (_, offset) => {
    const date = new Date(today + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() - offset);
    return {month:date.getUTCMonth()+1, day:date.getUTCDate(), offset};
  });
  return rows.flatMap(item => {
    const match = item.title.match(/(?:^|\D)(\d{1,2})월\s*(\d{1,2})일/);
    if(item.sourceId !== 'news-koreadaily' || !/오늘의\s*운세/.test(item.title) || !match || !item.date
      || !Number.isFinite(Date.parse(item.date)) || Date.parse(item.date) > +now
      || Date.parse(item.date) < +now - 14*86400000) return [];
    try {
      if(!['koreadaily.com','www.koreadaily.com','news.google.com'].includes(new URL(item.url).hostname)) return [];
    } catch { return []; }
    const day = days.find(day => day.month === +match[1] && day.day === +match[2]);
    return day ? [{item,offset:day.offset}] : [];
  }).sort((a,b) => a.offset-b.offset || Date.parse(b.item.date!)-Date.parse(a.item.date!))[0]?.item ?? null;
}
