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
