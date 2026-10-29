import type { NewsItem } from './newsFeeds';
import { editionDate } from './dailySchedule';
import { dailyPriority, deduplicateDailyEvents } from './dailyEditorial';
import { isManualDaily } from './manualDaily';
import { applyDailyRentalPolicy } from './dailyRentals';

/** One edition: today's reports plus the previous evening's held news (5pm onward). */
export function dailySelection(items: NewsItem[], now: Date, korean: boolean) {
  const today = editionDate(now);
  const previous = new Date(`${today}T12:00:00Z`);
  previous.setUTCDate(previous.getUTCDate()-1);
  const yesterday = previous.toISOString().slice(0,10);
  const hour = new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',hourCycle:'h23'});
  const rows = items.filter(item => {
    if (!item.date) return false;
    const published = new Date(item.date);
    if (!Number.isFinite(+published) || +published > +now) return false;
    if(item.firstPublishedEdition)return item.firstPublishedEdition===today;
    const day = item.publicationDay ?? editionDate(published);
    return day === today || (day === yesterday && Number(hour.format(published)) >= 17);
  });
  // Reserve explicitly requested articles for this edition, including the rental exception.
  const manual=rows.filter(item=>isManualDaily(item,today));
  const pool=[...applyDailyRentalPolicy(rows.filter(item=>!isManualDaily(item,today)),now),...manual];
  const unique=deduplicateDailyEvents(pool).filter(item=>korean ? item.sourceId!=='daily-la' : item.sourceId==='daily-la');
  // Community relevance selects the pool; publication date controls visible order.
  const priority=[...unique].sort((a,b)=>(Number(isManualDaily(b,today))-Number(isManualDaily(a,today)))
    || (korean?dailyPriority(a)-dailyPriority(b):0)
    || (b.publicationDay??editionDate(new Date(b.date!))).localeCompare(a.publicationDay??editionDate(new Date(a.date!)))
    || (b.publicationDay?0:Date.parse(b.date!))-(a.publicationDay?0:Date.parse(a.date!)));
  const selected=priority.slice(0,40).sort((a,b)=>
    (b.publicationDay??editionDate(new Date(b.date!))).localeCompare(a.publicationDay??editionDate(new Date(a.date!)))
    || (b.publicationDay?0:Date.parse(b.date!))-(a.publicationDay?0:Date.parse(a.date!)));
  return { items: selected };
}
