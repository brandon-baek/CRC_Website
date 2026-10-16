import type { NewsItem } from './newsFeeds';
import { US_COMMUNITY_TERMS } from './newsLocality';
import { isExcludedNews } from './newsEditorial';

const KOREAN_AMERICAN=/한인|미주|재미|교포|동포|한인타운|코리아타운|Korean.American/i;
const US_LOCAL=/남가주|북가주|말리부|어바인|오리건|맨해튼|샌타|산타|샌디|샌프|라스베|브렌트우드|할리우드|헐리우드|벤투라|리버사이드|샌버나디노|패서디나|풀러턴|버뱅크|헌팅턴|롱비치|미시건|위스콘신|애리조나|메릴랜드|펜실베이니아|뉴잉글랜드|노스캐롤라이나|사우스캐롤라이나|보스턴|뉴욕|캐나다|미국인|미국행|미국산|달러|USC|UCLA|TSA|FDA|코스트코|소셜시큐리티/i;
const PRACTICAL=/건강|의료|병원|질환|치료|예방|다리|혈액|백신|약값|메디케어|치매|당뇨|암\s|항공|공항|비행|여권|국적|재외|한국행|귀국|방문|환율|송금|연금|상속|세금|리콜|식품|영주|비자|취업허가|노후|은퇴|주택|렌트|전기|휘발유|개솔린|물가|금리/;
const ANNOUNCEMENTS=/단체\s*소식|이취임|취임식|공식\s*취임|정기총회|창립\s*기념|이사회|축제재단|동문회|향우회|한인회|상공회의소|어워즈|기금\s*모금|후원\s*행사|한인재단.*지원금|사설|오피니언|특별기고|오늘의\s*운세|증권\s*소식|뉴스\s*헤드라인/;
const PROMOTIONS=/프로모션\s*코드|할인\s*코드|고객\s*모집|상품\s*출시|한정판.*출시|매장\s*오픈|타운\s*비지니스|\[(?:부동산|보험|재정|세무)\s*(?:가이드|칼럼)\]/;
const NON_DAILY=/백악관|대변인|전폭기|국방부|군사|교황|평통|진보.*보수|스왈웰|재정적자.*증세|총결산.*세일|폭탄세일|팝업스토어|출사표|기업.*세미나|대학원.*세미나|친목|찬양|선교단|개인전|사진전|작품전|시조.*수상|대회.*대상|\[(?:금요단상|한국춘추|전망대|지평선|핫피플|전문)\]|\[(?:베스트원|케이만남|엘리트골프)|월드\s*파이널|월드시리즈|대표팀|손흥민|오타니|태민|뷔|방탄소년단|빅나티|하츠웨이브|하트시그널|김혜자|오스카|LA다저스|(?<!공공)공연.*홍보/;

/** Prioritize Korean-American coverage; useful Korea-related information is eligible. */
export function dailyPriority(item:NewsItem):number {
  const text=item.title+' '+item.summary;
  if(KOREAN_AMERICAN.test(text))return 0;
  if(US_COMMUNITY_TERMS.test(text)||US_LOCAL.test(text))return 1;
  return 2;
}
export function eligibleDaily(item:NewsItem):boolean {
  if(/보러\s*오세요|실질적\s*기여\s*약속|외식협.*세미나|봄\s*마켓\s*준비|의료.*시대\s*연다|센터메디컬그룹.*행사|단체.*교류\s*확대|풀러턴.*횡성군|지속.*위로\s*전할/.test(item.title))return false;
  if(isExcludedNews(item)||ANNOUNCEMENTS.test(item.title)||NON_DAILY.test(item.title)||PROMOTIONS.test(item.title+' '+item.summary))return false;
  // Health information is eligible without a U.S. place name; a domestic Korean
  // incident is not automatically useful solely because it mentions a house or flight.
  return dailyPriority(item)<2||/건강.*(?:정보|관리)|혈액|질환|치매|당뇨|백신|한국행|한국.*(?:병원|건강보험|입국|여행)|재외|복수국적|국적.*(?:법|신청)|환율|송금/.test(item.title);
}

/** Known local incidents with heavily rewritten syndicated headlines. */
export function dailyEvent(item:NewsItem):string|null {
  if(/말리부/.test(item.title)&&/산불/.test(item.title))return 'malibu-fire';
  if(/오리건/.test(item.title)&&/초등/.test(item.title)&&/총격|총기/.test(item.title))return 'oregon-school-shooting';
  if(/남가주|샌타애나|산타애나/.test(item.title)&&/강풍/.test(item.title)&&/적색경보|산불.*위험/.test(item.title))return 'socal-wind-fire-warning';
  return null;
}
export function deduplicateDailyEvents(rows:NewsItem[]):NewsItem[] {
  const sorted=[...rows].sort((a,b)=>Date.parse(a.date!)-Date.parse(b.date!));
  return sorted.filter((item,index)=>!dailyEvent(item)||!sorted.slice(0,index).some(prior=>dailyEvent(prior)===dailyEvent(item)&&Math.abs(Date.parse(item.date!)-Date.parse(prior.date!))<48*3600000));
}
