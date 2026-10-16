import type { DailyNews } from './dailyNews';
import type { NewsItem } from './newsFeeds';
import { headlineKey } from './newsDuplicates';
import { editionDate } from './dailySchedule';
import { dailySelection } from './dailySelection';
import { deduplicateDailyEvents } from './dailyEditorial';

const keys=(item:NewsItem)=>['title:'+headlineKey(item.title),'url:'+item.url];
/** Only called when preparing a publishable edition; overnight discoveries are not marked published. */
export function prepareDailyPublication(news:DailyNews,saved:DailyNews|null,now:Date):DailyNews {
  const today=editionDate(now),morning=saved?.editionDate!==today;
  const history:Record<string,string>={...(saved?.publishedHistory??{})};
  // Migration: previous saved editions predate the ledger. Do not recycle them.
  if(!saved?.publishedHistory&&saved?.editionDate)for(const item of [...saved.items,...(saved.sportsEntertainment??[])]) {
    const displayed=dailySelection([item],new Date(saved.generatedAt!),item.sourceId!=='daily-la').items.length>0;
    for(const key of keys(item))history[key]=displayed?saved.editionDate:(item.publicationDay??(item.date?editionDate(new Date(item.date)):'2000-01-01'));
  }
  const select=(rows:NewsItem[])=>{
   const eligible=rows.flatMap(item=>{
    const first=keys(item).map(key=>history[key]).filter(Boolean).sort()[0];
    if(first&&first!==today)return [];
    const regular=dailySelection([item],now,item.sourceId!=='daily-la').items.length>0;
    // A late-discovered recent story is eligible for its first morning release,
    // not as daytime backfill. Never relabel its original publisher date.
    const unseenMorning=morning&&!first&&!!item.date&&Date.parse(item.date)>=+now-2*86400000&&Date.parse(item.date)<=+now;
    if(!first&&!regular&&!unseenMorning)return [];
    return [{...item,firstPublishedEdition:first??today}];
  });
   const unique=deduplicateDailyEvents(eligible);
   const displayed=[...dailySelection(unique,now,true).items,...dailySelection(unique,now,false).items];
   for(const item of displayed)for(const key of keys(item))history[key]=item.firstPublishedEdition!;
   return displayed;
  };
  const items=select(news.items),sportsEntertainment=select(news.sportsEntertainment??[]);
  const cutoff=new Date(+now-30*86400000).toISOString().slice(0,10);
  return {...news,items,sportsEntertainment,publishedHistory:Object.fromEntries(Object.entries(history).filter(([,date])=>date>=cutoff))};
}
