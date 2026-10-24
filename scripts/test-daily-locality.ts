import assert from 'node:assert/strict';
import { isAllowedDailyHeadline } from '../src/data/dailyLocality';
import { eligibleDaily } from '../src/data/dailyEditorial';
import { eligibleDailyItem } from '../src/data/dailyNews';
import savedEdition from '../src/data/dailyEdition.json';
const item=(title:string,summary='')=>({sourceId:'news-koreatimes',title,summary,url:'https://example.com/article',date:'2026-10-24T14:00:00Z'});
for(const title of ['LA 한인타운 주택 침입 절도 주의','가주 고소득층 추가세','California housing benefits','한인 유학생 지원 안내','한국행 항공편 수하물 변경','미국 여권 새 디자인 공개','건강 관리 정보','소셜시큐리티 연금 인상','CLASS action lawsuit','CAD exchange rate']) assert(isAllowedDailyHeadline(item(title)),title);
for(const title of ['뉴욕한인수산인협 행사','JC원그룹 뉴저지 오피스 개원','시카고 택시 유류할증료','오리건 초등학교 총격','맨하탄 센트럴팍 마차 폐지','밴쿠버·토론토 시차 변경','New Jersey Korean community benefits','NJ residents get utility rebates','Texas health warning','Alabama health warning','뉴멕시코 한인 생활 정보','LA 기업의 뉴저지 사무실 개원']) {
  assert(!isAllowedDailyHeadline(item(title)),title);
  assert(!eligibleDaily(item(title)),`editorial: ${title}`);
}
assert(isAllowedDailyHeadline(item('한인작가 그룹전','맨하탄 갤러리가 뉴저지 포트리에서 개최한다.')),'summary alone does not trigger location exclusion');
assert(isAllowedDailyHeadline(item('한인 생활 정보','캘리포니아 어바인 본사 기업이 뉴저지에 새 사무실을 연다.')),'title-only policy');
assert(eligibleDaily(item('건강 관리 정보')),'restore general health information');
assert(eligibleDaily(item('한인 유학생 지원 안내')),'restore general Korean-American information');
assert(eligibleDaily(item('한국행 항공편 수하물 규정 변경')),'restore useful travel information');
assert(!eligibleDaily(item('LA 한인회장 선거')),'existing editorial exclusions remain');
assert(!eligibleDailyItem({...item('New Jersey utility rebates'),sourceId:'daily-la'}),'English source cannot bypass headline filter');
assert(eligibleDailyItem({...item('National health benefits update'),sourceId:'daily-la'}),'English informative story needs no California mention');
const published=savedEdition.items.filter(eligibleDailyItem);
assert(published.every(isAllowedDailyHeadline),'saved edition uses the same headline rule');
assert(published.some(story=>!/LA|가주|캘리포니아|California/.test(story.title)),'general informative stories restored');
console.log('PASS: explicit out-of-state headlines excluded, informative and location-neutral stories restored, summary-only locations ignored, editorial exclusions retained, saved and English items filtered consistently.');
