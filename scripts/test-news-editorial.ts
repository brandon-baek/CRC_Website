import assert from 'node:assert/strict';
import { isExcludedNews } from '../src/data/newsEditorial.ts';
const story=(title:string,url='https://example.com/story',summary='')=>({title,url,summary});
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
