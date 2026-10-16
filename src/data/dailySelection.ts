import type { NewsItem } from './newsFeeds';
import { editionDate } from './dailySchedule';

/** One edition: today's reports plus the previous evening's held news (5pm onward). */
export function dailySelection(items: NewsItem[], now: Date, korean: boolean) {
  const today = editionDate(now);
  const previous = new Date(`${today}T12:00:00Z`);
  previous.setUTCDate(previous.getUTCDate()-1);
  const yesterday = previous.toISOString().slice(0,10);
  const hour = new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',hourCycle:'h23'});
  const rows = items.filter(item => {
    if (!(korean ? item.sourceId !== 'daily-la' : item.sourceId === 'daily-la') || !item.date) return false;
    const published = new Date(item.date);
    if (!Number.isFinite(+published) || +published > +now) return false;
    const day = editionDate(published);
    return day === today || (day === yesterday && Number(hour.format(published)) >= 17);
  }).sort((a,b) => Date.parse(b.date!) - Date.parse(a.date!));
  return { items: rows };
}
