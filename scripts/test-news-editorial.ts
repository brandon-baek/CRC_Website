import assert from 'node:assert/strict';
import { isExcludedNews } from '../src/data/newsEditorial.ts';
const story=(title:string,url='https://example.com/story',summary='')=>({title,url,summary});
assert(isExcludedNews(story('여름 인턴십 성공 전략 배운다','https://news.google.com/rss/articles/syndicated')));
for (const host of ['la.koreatimes.com','koreatimes.com','www1.koreatimes.com']) {
 assert(isExcludedNews(story('Updated program headline',`http://${host}/article/20261016/1634139?source=feed`)));
}
assert(isExcludedNews(story('법무부, CA주에 소송 비시민권 의심 2만명 개표 제한 요청')));
assert(isExcludedNews(story('Updated headline','https://koreatownpress.org/news/usa/doj-california-noncitizen-voter-lawsuit?source=feed')));
assert(isExcludedNews(story('California voter eligibility lawsuit')));
assert(!isExcludedNews(story('[LA 하지정맥외과] 다리 건강의 첫걸음… 올바른 혈액순환 관리가 중요','https://example.com/health','혈액순환 관리와 다리 건강 정보. 문의 (213) 555-0100')));
for(const title of [
 'ICE 이민단속국 미국시민권자 500명이상 체포구금',
 '강경화 주미대사 이민단속 한인피해 최소화',
 'LA housing affected by ICE raids',
 'U.S. Immigration and Customs Enforcement announces operation',
 '이민세관국 요원 체포',
]) {
 assert(isExcludedNews(story(title)),title);
}
assert(isExcludedNews(story('LA benefits update','https://example.com/news/ice-operation')));
assert(isExcludedNews(story('Local update','https://example.com/story','ICE raids in Los Angeles')));
for(const title of ['Social Security office offers benefits help','Rice prices rise','Local ice cream recall','한인 영주권 신청 절차 안내','메디케어 혜택 변경'])assert(!isExcludedNews(story(title)),title);
// Filtering after merge removes previously saved stories as well as fresh feeds.
const saved=[story('ICE 이민단속국 미국시민권자 체포'),story('한인 영주권 신청 절차 안내')];
assert.deepEqual(saved.filter(item=>!isExcludedNews(item)),[saved[1]]);
console.log('PASS: Korean/English ICE coverage, enforcement names and URLs, saved articles; benefits and unrelated words retained.');

const removedTitle='이웃케어클리닉 "주민발의안 44로 한인 환자들, 피해 떠안을 수도"';
const removedUrl='https://koreatownpress.org/news/town/neighbor-care-clinic-prop-44-patient-risk';
assert(isExcludedNews(story(removedTitle,removedUrl)));
assert(isExcludedNews(story('Updated headline',removedUrl+'/?utm_source=news#article')));
assert(isExcludedNews(story('Updated headline',removedUrl.replace('https://','http://www.'))));
assert(isExcludedNews(story('이웃케어클리닉 “주민발의안 44로 한인 환자들 피해 떠안을 수도”','https://news.google.com/rss/articles/example')));
assert(!isExcludedNews(story('이웃케어클리닉 무료 건강검진 안내','https://koreatownpress.org/news/town/free-health-screening')));
assert(!isExcludedNews(story('이웃케어클리닉 메디케어 혜택 신청 안내')));
const cached=[story(removedTitle,removedUrl),story('가주 주택보험 가입자 보호 강화')];
assert.deepEqual(cached.filter(item=>!isExcludedNews(item)),[cached[1]]);
console.log('PASS: removed clinic article stays excluded by URL and normalized title; unrelated clinic services retained.');

// Rewritten headlines and different publishers must not revive the same political story.
for (const title of [
 '이웃케어 “발의안 44, 한인 의료서비스 타격”',
 '주민 발의안 44가 메디케어에 미치는 영향',
 'California’s Prop 45 aims to speed construction projects',
 'Health clinic warns about Proposition 44',
 'LA mayor election: candidates debate healthcare',
 '공화당 후보 지지 선언',
 '오마르 의원 이민서류 조작 의혹',
 '[알뜰정보] 엠제이보험 마크 정 대표…2027 메디케어·메디캘 특별 세미나',
 '[부동산 가이드] OC 부동산, 금리·보험 변수↑',
 '[보험 가이드] 메디케어 어드밴티지 vs 메디갭',
 '【보험 가이드】 내년 메디케어 가입 안내',
 'ABC보험 무료 세미나 개최',
 'Sponsored content: choosing a Medicare plan',
]) assert(isExcludedNews(story(title,'https://news.google.com/rss/articles/another-publisher')),title);
assert(isExcludedNews(story('한인 의료서비스 영향','https://example.com/story','발의안 44 반대 캠페인')));
assert(isExcludedNews(story('주택 구매 정보','https://example.com/story','글: 홍길동 부동산 에이전트')));
assert(isExcludedNews(story('Medicare options','https://example.com/story','By Jane Kim, insurance agent')));
// Independent reporting stays eligible even when it quotes a business/agent.
for (const title of [
 '메디케어 어드밴티지 vs 메디갭',
 'OC 부동산, 금리·보험 변수 증가',
 '메디케어 가입 기간과 변경 사항',
 '가주 주택보험 가입자 보호 강화',
 '보험 에이전트 사기 피해 주의',
 '부동산 브로커 사기 혐의 기소',
 '은행 수수료 환불 받는 방법',
 'New Medicare benefits explained by our health reporter',
]) assert(!isExcludedNews(story(title,'https://example.com/report','김민수 기자 취재')),title);
assert(!isExcludedNews(story('OC housing costs rise','https://example.com/report','A reporter interviews a real estate agent about rising insurance costs.')));
const mixedEdition=[story('이웃케어 발의안 44 의료서비스 타격'),story('[보험 가이드] 혜택 안내'),story('메디케어 가입 기간 안내')];
assert.deepEqual(mixedEdition.filter(item=>!isExcludedNews(item)),[mixedEdition[2]]);
console.log('PASS: political variants and commercial columns removed from saved/fresh articles; independent consumer reporting retained.');
