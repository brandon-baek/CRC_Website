import type { NewsItem } from './newsFeeds';
export const MANUAL_EDITION='2026-10-29';
// Explicit user additions for this edition only; preserve original publisher dates.
export const manualDailyItems:NewsItem[]=[
 {sourceId:'news-koreatimes',publisher:'미주한국일보',title:'임대 보증금 마련도 어려운 시대… 신청서 제출 전부터 마련해야',url:'https://www.koreatimes.com/article/11629539',date:'2026-10-28',publicationDay:'2026-10-28',summary:'',firstPublishedEdition:MANUAL_EDITION},
 {sourceId:'news-koreatimes',publisher:'미주한국일보',title:'페어플랜 주택보험료 가주 30% 급등 ‘비상’',url:'https://www.koreatimes.com/article/1634388',date:'2026-10-19',publicationDay:'2026-10-19',summary:'',firstPublishedEdition:MANUAL_EDITION},
 {sourceId:'news-koreatimes',publisher:'미주한국일보',title:'대한항공 ‘갤러리’서 비행 체험… LA 새뮤얼 오신 항공우주센터 개관',url:'https://www.koreatimes.com/article/11629583',date:'2026-10-29',publicationDay:'2026-10-29',summary:'',firstPublishedEdition:MANUAL_EDITION},
];
export function isManualDaily(item:NewsItem,day:string):boolean {
 return day===MANUAL_EDITION&&manualDailyItems.some(x=>x.url===item.url);
}
export function withManualDaily(items:NewsItem[],day:string):NewsItem[] {
 if(day!==MANUAL_EDITION)return items;
 return [...items.filter(item=>!manualDailyItems.some(x=>x.url===item.url||x.title===item.title)),...manualDailyItems];
}
