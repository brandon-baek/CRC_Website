import type { NewsItem } from './newsFeeds';

// CRC editorial scope: exclude ICE and immigration-enforcement coverage.
// Keep ordinary immigration benefits, citizenship services and unrelated words.
const ENFORCEMENT = /\bICE\b(?!\s+(?:cream|cubes?|rink|skating)\b)|\bI\.C\.E\b|이민\s*(?:세관\s*)?단속|이민세관국|이민세관집행국|이민관세집행국|이민세관수사국/;
const ENGLISH_ENFORCEMENT = /immigration\s+(?:and\s+customs\s+enforcement|enforcement|raids?|crackdown)|deportation\s+(?:raids?|operations?)/i;
const ENFORCEMENT_URL = /(?:^|[\/_-])(?:ice|immigration-enforcement|immigration-raids?|deportation-raids?)(?:[\/_-]|$)/i;

// Apply topic exclusions across publishers, including rewritten/syndicated headlines.
// Practical benefits reporting is eligible; elections, ballot measures and political coverage are not.
const POLITICS = /(?:주민\s*)?발의안|주민\s*투표|선거|대선|총선|정당|민주당|공화당|국민의힘|정치|국회의원|시의원|상원의원|하원의원|주지사|[가-힣]{2,8}\s+의원|탄핵|정권|대통령|트럼프|바이든|지지\s*선언|후보\s*지지|\b(?:politic\w*|elections?|ballot|referendum|democrats?|republicans?|partisan|presidential|congress(?:ional)?|senators?|governors?|lawmakers?|Trump|Biden)\b|\b(?:proposition|prop\.?)\s*\d+/i;
// These publisher labels identify commercial advice columns, not staff reporting.
const BUSINESS_COLUMNS = /[\[【〈<]\s*(?:보험|부동산|융자|재정|재테크|세무)\s*(?:가이드|칼럼|컬럼|상담)[\]】〉>]|\b(?:sponsored\s+(?:content|post|article)|advertorial|paid\s+(?:content|advertisement))\b/i;
const BUSINESS_PROMOTION = /(?:보험|부동산|융자|중개|브로커|에이전트|재정|투자|업체|기업|회사).{0,60}(?:특별\s*세미나|무료\s*세미나|설명회|상담회|고객\s*모집|고객\s*감사|프로모션)|(?:특별|무료)\s*세미나.{0,60}(?:보험|부동산|메디케어|메디캘)|\[(?:알뜰정보|업소탐방|업체탐방|비즈니스탐방|업소소개|광고|협찬)\]|\b(?:grand\s+opening|customer\s+appreciation|promotional\s+offer)\b/i;
const COMMERCIAL_BYLINE = /(?:글|필자|기고|칼럼|문의)\s*[:：][^\n]{0,60}(?:보험|부동산|브로커|에이전트|공인회계사)|\bby\s+[^\n]{0,60},\s*(?:realtor|real\s+estate\s+(?:agent|broker)|insurance\s+agent)\b/i;
const VOTING = /개표|유권자|투표권|투표\s*(?:자격|제한|소송|등록)|\b(?:voters?|voting|vote\s*count(?:ing)?)\b/i;

// Specific editorial removals apply to both new feeds and saved editions.
// Keep unrelated clinic services and healthcare information eligible.
const REMOVED_ARTICLE_URLS = new Set([
  'https://la.koreatimes.com/article/20261016/1634139',
  'https://koreatimes.com/article/20261016/1634139',
  'https://www1.koreatimes.com/article/20261016/1634139',
  'https://koreatownpress.org/news/usa/doj-california-noncitizen-voter-lawsuit',
  'https://www1.koreatimes.com/article/20261014/1633888',
  'https://koreatimes.com/article/20261014/1633888',
  'https://la.koreatimes.com/article/20261014/1633888',
  'https://koreatownpress.org/news/town/neighbor-care-clinic-prop-44-patient-risk',
]);
const normalizeTitle = (title: string) => title.normalize('NFKC').replace(/[\p{P}\p{S}\s]/gu, '').toLowerCase();
const REMOVED_ARTICLE_TITLES = new Set([
  normalizeTitle('여름 인턴십 성공 전략 배운다'),
  normalizeTitle('법무부, CA주에 소송 비시민권 의심 2만명 개표 제한 요청'),
  normalizeTitle('메디케어, 제대로 알자'),
  normalizeTitle('이웃케어클리닉 "주민발의안 44로 한인 환자들, 피해 떠안을 수도"'),
  normalizeTitle('이웃케어 “발의안 44, 한인 의료서비스 타격”'),
  normalizeTitle('[알뜰정보] 엠제이보험 마크 정 대표…2027 메디케어·메디캘 특별 세미나'),
  normalizeTitle('[부동산 가이드] OC 부동산, 금리·보험 변수↑'),
  normalizeTitle('[보험 가이드] 메디케어 어드밴티지 vs 메디갭'),
]);

export function isExcludedNews(item: Pick<NewsItem, 'title' | 'summary' | 'url'>): boolean {
  if (REMOVED_ARTICLE_TITLES.has(normalizeTitle(item.title))) return true;
  const text = (item.title + ' ' + (item.summary ?? '')).normalize('NFKC');
  if (ENFORCEMENT.test(text) || ENGLISH_ENFORCEMENT.test(text)) return true;
  if (POLITICS.test(text) || VOTING.test(text) || BUSINESS_COLUMNS.test(text) || BUSINESS_PROMOTION.test(text) || COMMERCIAL_BYLINE.test(text)) return true;
  try {
    const url = new URL(item.url);
    const canonical = `https://${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}`;
    return REMOVED_ARTICLE_URLS.has(canonical) || ENFORCEMENT_URL.test(url.pathname);
  } catch { return false; }
}
