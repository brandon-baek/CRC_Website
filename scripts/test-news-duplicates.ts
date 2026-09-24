// Run with: node --experimental-strip-types scripts/test-news-duplicates.ts
import assert from 'node:assert/strict';
import { deduplicateNews, headlineKey, hasArticleImage } from '../src/data/newsDuplicates.ts';
import type { NewsItem, NewsSource } from '../src/data/newsFeeds.ts';

const sources: NewsSource[] = ['koreadaily', 'koreatimes'].map((name) => ({
  id: `news-${name}`, label: { en: name, ko: name }, urls: [],
  homepage: `https://${name}.com`, publisherDomain: `${name}.com`,
}));
const daily: NewsItem = { sourceId: 'news-koreadaily', title: '해커 조직 "FBI요원 신상정보 해킹"…FBI "수사중"', url: 'https://koreadaily.com/a', summary: '', date: '2026-09-24' };
const times: NewsItem = { ...daily, sourceId: 'news-koreatimes', title: '해커 조직 “FBI요원 신상정보 해킹”…FBI “수사중”', url: 'https://koreatimes.com/b', date: '2026-09-23' };
assert.equal(headlineKey(daily.title), headlineKey(times.title));
assert.equal(headlineKey('한인 투자사기'), headlineKey('한인  투자 사기'));
assert.notEqual(headlineKey('피해자 100명'), headlineKey('피해자 200명'));
assert.equal(hasArticleImage('<meta property="og:image" content="https://www.koreadaily.com/images/logo/sns-logo.png">'), false);
assert.equal(hasArticleImage('<img src="https://ads.example/banner.jpg">'), false);
assert.equal(hasArticleImage('<meta content="https://mimg.koreatimes.com/article/photo.jpg" property="og:image">'), true);
assert.equal(hasArticleImage("<meta name='twitter:image' content='https://koreadaily.com/photo.jpg'>"), true);

for (const reversed of [false, true]) {
  const items = reversed ? [times, daily] : [daily, times];
  let result = await deduplicateNews(items, sources, async item => item.sourceId === times.sourceId);
  assert.equal(result.length, 1);
  assert.equal(result[0].sourceId, times.sourceId, 'article photo beats newer publication date');
  result = await deduplicateNews(items, sources, async item => item.sourceId === daily.sourceId);
  assert.equal(result[0].sourceId, daily.sourceId, 'Korea Daily wins when it alone has the photo');
  for (const state of [true, false, null]) {
    result = await deduplicateNews(items, sources, async () => state);
    assert.equal(result[0].sourceId, times.sourceId, 'deterministic tie/failure fallback');
  }
  result = await deduplicateNews(items, sources, async () => { throw Error('offline'); });
  assert.equal(result.length, 1, 'network errors never restore duplicate rows');
}
let checks = 0;
const unique = { ...daily, title: '다른 사건', url: 'https://koreadaily.com/c' };
const result = await deduplicateNews([daily, times, unique], sources, async () => { checks++; return false; });
assert.equal(result.length, 2);
assert.equal(checks, 2, 'do not fetch unique stories just to inspect their images');
console.log('PASS: duplicate matching, image preference in both directions, logo exclusion, ties, failures, and unique stories.');
