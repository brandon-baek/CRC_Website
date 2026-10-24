import type { NewsItem } from './newsFeeds';

// Exclude only an explicit out-of-state location in the headline.
// Summary locations do not suppress otherwise eligible informative stories.
const ELSEWHERE=/뉴저지|뉴욕|맨해튼|맨하탄|브루클린|퀸즈|브롱스|포트리|포트\s*리|잉글우드클립스|보스턴|시카고|일리노이|애틀랜타|조지아주|텍사스|댈러스|달라스|휴스턴|오스틴|버지니아|메릴랜드|워싱턴|시애틀|플로리다|마이애미|올랜도|올란도|네바다|라스베이거스|라스베가스|애리조나|아리조나|피닉스|오리건|포틀랜드|펜실베이니아|펜실베니아|필라델피아|미시간|미시건|위스콘신|미네소타|콜로라도|덴버|하와이|호놀룰루|알래스카|유타|테네시|오하이오|인디애나|매사추세츠|코네티컷|노스캐롤라이나|사우스캐롤라이나|뉴잉글랜드|앨라배마|알라바마|아칸소|아칸소주|델라웨어|아이다호|아이오와|캔자스|켄터키|루이지애나|메인주|미시시피|미주리|몬태나|몬타나|네브래스카|뉴햄프셔|뉴멕시코|노스다코타|사우스다코타|오클라호마|로드아일랜드|버몬트|웨스트버지니아|와이오밍|캐나다|밴쿠버|토론토|(?:^|[^A-Za-z])(?:New Jersey|NJ|New York|NY|Manhattan|Brooklyn|Queens|Fort Lee|Boston|Chicago|Illinois|Atlanta|Georgia|Texas|TX|Dallas|Houston|Austin|Virginia|Maryland|Washington|Seattle|Florida|Miami|Orlando|Nevada|Las Vegas|Arizona|Phoenix|Oregon|Portland|Pennsylvania|Philadelphia|Michigan|Wisconsin|Minnesota|Colorado|Denver|Hawaii|Honolulu|Alaska|Utah|Tennessee|Ohio|Indiana|Massachusetts|Connecticut|Carolina|Alabama|Arkansas|Delaware|Idaho|Iowa|Kansas|Kentucky|Louisiana|Maine|Mississippi|Missouri|Montana|Nebraska|New Hampshire|New Mexico|North Dakota|South Dakota|Oklahoma|Rhode Island|Vermont|West Virginia|Wyoming|Canada|Vancouver|Toronto)(?=$|[^A-Za-z])/i;
export function isAllowedDailyHeadline(item:Pick<NewsItem,'title'>):boolean {
  return !ELSEWHERE.test(item.title);
}
