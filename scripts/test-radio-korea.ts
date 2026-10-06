// Run with: node --experimental-strip-types scripts/test-radio-korea.ts
import assert from 'node:assert/strict';
import { parseRadioKoreaLinks, parseRadioKoreaArticle, fetchRadioKorea } from '../src/data/radioKorea.ts';
import type { NewsSource } from '../src/data/newsFeeds.ts';

const url = 'https://www.radiokorea.com/news/article.php?uid=505899';
const title = 'LA 은퇴 노인 전화사기로 500만 달러 피해…6개월간 속여 돈 빼내';
const article = (date = '10.05.2026 11:17 AM', headline = title) => `<div id="article-header"><h1 class="article-title">${headline}</h1><span class="article-info"><span class="article-prop">입력 ${date}</span><span class="article-prop">수정 10.06.2026 01:00 PM</span></span></div>`;
const list = `<a href="/news/article.php?uid=505899"><img src="photo.jpg"></a><a href="${url}&amp;tracking=1">${title}</a><a href="https://radiokorea.com.evil.example/news/article.php?uid=505899">${title}</a><a href="javascript:alert(1)">${title}</a>`;
assert.deepEqual(parseRadioKoreaLinks(list), [{ url, title }]);
assert.equal(parseRadioKoreaArticle(article(), url)?.date, '2026-10-05T18:17:00.000Z');
assert.equal(parseRadioKoreaArticle(article('01.05.2026 11:17 AM'), url)?.date, '2026-01-05T19:17:00.000Z');
assert.equal(parseRadioKoreaArticle(article('10.05.2026 12:17 AM'), url)?.date, '2026-10-05T07:17:00.000Z');
assert.equal(parseRadioKoreaArticle(article('10.05.2026 12:17 PM'), url)?.date, '2026-10-05T19:17:00.000Z');
assert.equal(parseRadioKoreaArticle(article(), 'https://evil.example/news/article.php?uid=505899'), null);
assert.equal(parseRadioKoreaArticle('<html>Temporarily unavailable</html>', url), null);
assert.equal(parseRadioKoreaArticle(article().replace('입력', '수정'), url), null);

const source: NewsSource = { id: 'news-radiokorea', label: { en: 'Radio Korea', ko: '라디오코리아' }, urls: [], homepage: 'https://www.radiokorea.com/news/', keywords: /사기/, requiredKeywords: /LA/ };
let articleReads = 0;
const items = await fetchRadioKorea(source, async (link) => {
  if (link === url) { articleReads++; return article(); }
  if (link.includes('page=2')) throw new Error('One listing is unavailable');
  return list;
});
assert.equal(items.length, 1);
assert.equal(items[0].url, url);
assert.equal(articleReads, 1, 'duplicate listing links are fetched once');
assert.deepEqual(await fetchRadioKorea(source, async (link) => link === url ? article(undefined, 'LA sports news') : list), []);
assert.deepEqual(await fetchRadioKorea(source, async () => null), []);
console.log('PASS: direct discovery, URL validation, original publication time, PDT/PST, duplicate links, article relevance, and partial/total failures.');
