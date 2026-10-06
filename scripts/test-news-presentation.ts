import assert from 'node:assert/strict';
import { localizedNews, featuredNews, newsTopic, matchesNewsFilter } from '../src/data/newsPresentation.ts';
import type { NewsItem, NewsSource } from '../src/data/newsFeeds.ts';
const sources: NewsSource[] = [
  { id: 'ko1', label: { en: 'Korean outlet', ko: '한국어 언론' }, lang: 'ko', urls: [], homepage: 'https://example.com' },
  { id: 'en1', label: { en: 'Agency', ko: '기관' }, urls: [], homepage: 'https://example.com' },
  { id: 'en2', label: { en: 'News', ko: '뉴스' }, lang: 'en', urls: [], homepage: 'https://example.com' },
];
const item = (sourceId: string, day: number): NewsItem => ({ sourceId, title: sourceId + day, url: `https://example.com/${sourceId}/${day}`, date: `2026-10-0${day}`, summary: '' });
const items = [item('ko1', 3), item('en1', 1), item('ko1', 1), item('en1', 4), item('en2', 2), item('missing', 5)];
const ko = localizedNews(items, sources, 'ko');
const en = localizedNews(items, sources, 'en');
assert.deepEqual(ko.map(x=>x.sourceId), ['ko1','ko1']);
assert.deepEqual(en.map(x=>x.date), ['2026-10-04','2026-10-02','2026-10-01']);
assert.equal(featuredNews(en).length, 3);
assert.equal(new Set(featuredNews(en).map(x=>x.url)).size, 3);
assert.deepEqual(featuredNews([]), []);
assert.equal(newsTopic('개인정보 해킹 주의').id, 'cyber');
assert.equal(newsTopic('Investment fraud warning').id, 'money');
assert.equal(newsTopic('Shopping refund warning').id, 'consumer');
assert.equal(newsTopic('전화사기 피해').id, 'scams');
assert(matchesNewsFilter('LA 전화사기 라디오코리아', 'scams', 'radio', '  라디오코리아 LA  ', 'scams', 'radio'));
assert(!matchesNewsFilter('LA 전화사기 라디오코리아', 'scams', 'radio', 'missing', '', ''));
assert(!matchesNewsFilter('LA 전화사기 라디오코리아', 'scams', 'radio', '', 'cyber', ''));
assert(!matchesNewsFilter('LA 전화사기 라디오코리아', 'scams', 'radio', '', '', 'other'));
assert(matchesNewsFilter('FBI Alert', 'scams', 'fbi', 'ｆｂｉ', '', ''));
console.log('PASS: language isolation, newest-first order, unique featured stories, topic classification, and combined search/source/topic filters.');
