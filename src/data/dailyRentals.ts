import type { NewsItem } from './newsFeeds';

/** Rental listings and rental-housing news share the Sunday-only rule. */
export function isRentalNews(item:Pick<NewsItem,'title'|'summary'>):boolean {
  const text=item.title+' '+(item.summary??'');
  if(/(?:넓고|위치\s*좋은|인기\s*많은|중심가|장단기|중단기).*studio\s*apt|(?:콘도|아파트).*\d+\s*(?:배드|베드).*\d+\s*파킹/i.test(item.title))return true;
  return /렌트|렌탈|임대|월세|전세|룸메이트|리스(?=\s|$|기회|매물|정보|안내|계약|료)|리테일\s*공간|\b(?:rent(?:s|al|als|ed|ing)?|renters?|landlords?|tenan(?:t|ts|cy)|leases?|leasing|roommates?|sublets?|subleases?|evictions?)\b/i.test(text);
}
export function applyDailyRentalPolicy<T extends Pick<NewsItem,'title'|'summary'>>(items:T[],now:Date):T[] {
  const regular=items.filter(item=>!isRentalNews(item));
  if(regular.length) return regular;
  const weekday=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short'}).format(now);
  return weekday==='Sun' ? items : [];
}
