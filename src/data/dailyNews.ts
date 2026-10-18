import { fetchFeed, googleNews, newsSources, parseFeed, type NewsItem, type NewsSource } from './newsFeeds';
import { deduplicateNews } from './newsDuplicates';
import { fetchKoreatownPress } from './koreatownPress';
import { fetchRadioKorea } from './radioKorea';
import savedEdition from './dailyEdition.json';
import heldEdition from './dailyPending.json';
import { editionDate, latestFortune, latestStockReport } from './dailySchedule';
import { US_COMMUNITY_TERMS } from './newsLocality';
import { retainedNews } from './newsHistory';
import fallback from './dailyFallback.json';
import { isExcludedNews } from './newsEditorial';
import { reporterNews } from './newsAuthors';
import { collectPeopleNews, selectPeopleNews, peopleSources } from './sportsEntertainment';
import peopleSeed from './sportsEntertainmentSeed.json';
import { dailySelection } from './dailySelection';
import { fetchDirectDaily, inspectDailyArticle, rejectedDirectArticle } from './directDaily';
import { eligibleDaily } from './dailyEditorial';

export const DAILY_TOPICS = /경제|물가|금리|고용|일자리|주택|렌트|임대|보험|의료|병원|건강|메디|연금|소셜|은퇴|세금|세액|환불|리콜|소비자|전기|수도|공과금|교통|도로|차선|버스|메트로|공항|항공|산불|폭염|강풍|날씨|해변|상어|안전|경보|주의|지원|혜택|신청|이민|영주권|시민권|공연|콘서트|문화|박물관|도서관|사기|피싱|해킹|스캠|주가|증시|장학|학자금|학비|파산/i;
export const DAILY_EXCLUDES = /단체\s*소식|이취임|취임식|정기총회|창립\s*기념|이사회|축제재단|동문회|향우회|한인회|상공회의소|설명회|어워즈|박람회.*참여|퍼레이드|기금\s*모금|후원\s*행사|지지\s*선언|선거\s*운동|대선\s*후보|후보.*인터뷰|\[인터뷰\].*후보|후보\s*지지|결선|공방|정가|현역의원|트럼프\s*책임|오피니언|사설|칼럼|기고|정당|방송작가|병역\s*기피|소속사|드라마|예능/;
export const dailySources: NewsSource[] = newsSources.filter(s => s.lang === 'ko').map(source => ({
  ...source,
  urls: source.id === 'news-koreatownpress' ? [] : [
    '경제 OR 물가 OR 연금 OR 보험 OR 세금 OR 주택 OR 렌트 OR 환불',
    '사회 OR 교통 OR 안전 OR 산불 OR 날씨 OR 사고 OR 범죄',
    '생활 OR 건강 OR 의료 OR 문화 OR 지원 OR 혜택 OR 교육',
  ].map(topics => googleNews(`site:${source.publisherDomain} (${topics}) when:2d`, 'ko', 'US')),
  keywords: undefined,
  requiredKeywords: undefined,
  excludeKeywords: DAILY_EXCLUDES,
}));
const englishSources: NewsSource[] = newsSources.filter(s => s.id === 'news-la').map(s => ({...s, id:'daily-la',
  urls:[googleNews('California benefits when:7d','en-US','US'),googleNews('"Los Angeles" housing when:7d','en-US','US')],
  keywords:/benefit|housing|recall|traffic|retirement|health|insurance|utility|heat|fire|tax/i,
  allowPublishers:new Set([...s.allowPublishers!, 'KQED', 'Sacramento Bee', 'The Desert Sun']),
  excludeKeywords:/^Opinion\b|^Editorial\b|campaign endorsement/i,
}));

export interface DailyNews { items:NewsItem[]; fortune:NewsItem|null; stocks:NewsItem|null; sportsEntertainment?:NewsItem[]; generatedAt?:string; editionDate?:string; liveItemCount?:number; publishedHistory?:Record<string,string>; collectionCounts?:Record<string,number> }
let pending: Promise<DailyNews>;
// Ordinary builds only display the published edition; held stories stay out of the page.
export function fetchDailyNews(): Promise<DailyNews> {
  const saved = savedEdition as DailyNews | null;
  if (!pending) {
    if (saved?.generatedAt) {
      pending=reporterNews(saved.items.filter(item=>item.sourceId==='daily-la'||eligibleDaily(item)),[...dailySources,...englishSources]).then(async items=>{
      const mainKorean=dailySelection(items,new Date(saved.generatedAt!),true).items;
      // Use the displayed edition's time, not build time: evenings stay frozen.
      // One-time launch data contains only this section's verified articles.
      // It is tied to this exact edition and retires after the next refresh.
      const candidates=saved.sportsEntertainment??(saved.generatedAt===peopleSeed.editionGeneratedAt?peopleSeed.items:[]);
      const sportsEntertainment=selectPeopleNews(await reporterNews(candidates,peopleSources),new Date(saved.generatedAt),mainKorean);
      return {...saved,items,sportsEntertainment};
      });
    } else pending=collectDailyNews().then(data=>({...data,sportsEntertainment:selectPeopleNews(data.sportsEntertainment??[],new Date(data.generatedAt!),dailySelection(data.items,new Date(data.generatedAt!),true).items)}));
  }
  return pending;
}
export async function collectDailyNews(now = new Date(), saved:DailyNews|null = savedEdition) {
  const sources = [...dailySources, ...englishSources];
  let previous: NewsItem[]=retainedNews(fallback,sources);
  let previousStocks: NewsItem[] = saved?.stocks ? [saved.stocks] : [];
  const held=heldEdition as DailyNews|null;
  const previousPeople=[...(saved?.sportsEntertainment??[]),...(held?.sportsEntertainment??[])];
  const previousFortunes=[saved?.fortune,held?.fortune].filter((item):item is NewsItem=>!!item);
  if(held) previous=[...retainedNews(held,sources),...previous];
  if(held?.stocks) previousStocks.push(held.stocks);
  if(saved) previous = [...retainedNews(saved,sources), ...previous];
  try {
    const response=await fetch('https://crcnow.org/daily-feed.json',{signal:AbortSignal.timeout(8000)});
    if(response.ok) {
      const data = await response.json();
      previous=[...retainedNews(data,sources),...previous];
      if(data.stocks) previousStocks.push(data.stocks);
      if(Array.isArray(data.sportsEntertainment)) previousPeople.push(...data.sportsEntertainment);
    }
  } catch { /* A first preview has no saved bulletin. */ }
  const groups=await Promise.all(sources.map(async source=> {
    const [documents,direct]=await Promise.all([
      Promise.all(source.urls.map(fetchFeed)),
      source.id==='news-koreatownpress'?fetchKoreatownPress(source,fetchFeed):source.id==='news-radiokorea'?fetchRadioKorea(source,fetchFeed):fetchDirectDaily(source,fetchFeed),
    ]);
    return [...direct,...documents.flatMap(xml=>xml?parseFeed(xml,source,100):[])];
  }));
  const cutoff=+now-7*86400000;
  const candidates=[...groups.flat(),...previous].filter(item=> !rejectedDirectArticle(item) && !isExcludedNews(item) && (item.sourceId==='daily-la'||eligibleDaily(item)) && item.date && Date.parse(item.date)>=cutoff && Date.parse(item.date)<=+now);
  const items=await reporterNews((await deduplicateNews(candidates,sources)).sort((a,b)=>(b.date??'').localeCompare(a.date??'')),sources,inspectDailyArticle);
  const latestLink=async(id:string,query:string)=> {
    const source=newsSources.find(s=>s.id===id)!;
    const linkSource={...source,keywords:new RegExp(query),requiredKeywords:undefined,excludeKeywords:undefined};
    const [xml,direct]=await Promise.all([
      fetchFeed(googleNews(`site:${source.publisherDomain} ${query} when:7d`,'ko','US')),
      id==='news-radiokorea'?fetchRadioKorea(linkSource,fetchFeed):Promise.resolve([]),
    ]);
    const rows=[...direct,...(xml?parseFeed(xml,linkSource,30):[])].sort((a,b)=>(b.date??'').localeCompare(a.date??''));
    if(id==='news-koreadaily') {
      return latestFortune([...rows,...previousFortunes],now);
    }
    return latestStockReport([...rows,...previousStocks],now);
  };
  const [fortune,stocks,sportsEntertainment]=await Promise.all([latestLink('news-koreadaily','오늘의 운세'),latestLink('news-radiokorea','증권소식'),collectPeopleNews(now,previousPeople)]);
  return {items,fortune,stocks,sportsEntertainment,generatedAt:now.toISOString(),editionDate:editionDate(now),liveItemCount:groups.flat().length,collectionCounts:Object.fromEntries(sources.map((source,i)=>[source.id,groups[i].length]))};
}
