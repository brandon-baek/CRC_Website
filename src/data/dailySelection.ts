import type { NewsItem } from './newsFeeds';
import { editionDate } from './dailySchedule';

/** Today's stories never lose a slot to the older-news tail. Keep original dates. */
export function dailySelection(items: NewsItem[], now: Date, korean: boolean) {
  const today = editionDate(now);
  const rows = items.filter(item => (korean ? item.sourceId !== 'daily-la' : item.sourceId === 'daily-la')
    && item.date && Number.isFinite(Date.parse(item.date)) && Date.parse(item.date) <= +now
    && Date.parse(item.date) >= +now - 7 * 86400000)
    .sort((a,b) => Date.parse(b.date!) - Date.parse(a.date!));
  const fresh = rows.filter(item => editionDate(new Date(item.date!)) === today);
  const older = rows.filter(item => editionDate(new Date(item.date!)) !== today).slice(0,40);
  return { fresh, older, items: [...fresh,...older] };
}
