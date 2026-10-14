import assert from 'node:assert/strict';
import { editionDate, isTodaysFortune, latestStockReport } from '../src/data/dailySchedule';
import type { NewsItem } from '../src/data/newsFeeds';

const friday:NewsItem={sourceId:'news-radiokorea',title:'오늘의 증권소식(10월 16일)',date:'2026-10-16T21:30:00Z',url:'https://www.radiokorea.com/news/article.php?uid=123',summary:''};
for(const date of ['2026-10-17T13:00:00Z','2026-10-18T13:00:00Z','2026-10-19T13:00:00Z']) {
  assert.deepEqual(latestStockReport([friday],new Date(date)),friday,'weekends and Monday morning retain original Friday date');
}
const monday={...friday,date:'2026-10-19T21:30:00Z',title:'오늘의 증권소식(10월 19일)'};
assert.equal(latestStockReport([monday,friday],new Date('2026-10-19T13:00:00Z'))?.date,friday.date,'no future reports');
assert.equal(latestStockReport([monday,friday],new Date('2026-10-20T13:00:00Z'))?.date,monday.date);
assert.equal(latestStockReport([friday],new Date('2026-11-20T14:00:00Z')),null,'do not retain a report indefinitely');
assert.equal(latestStockReport([{...friday,url:'https://evil.example/'}],new Date('2026-10-18T13:00:00Z')),null);
assert.equal(editionDate(new Date('2026-10-15T06:30:00Z')),'2026-10-14','Pacific date before local midnight');
assert.equal(editionDate(new Date('2026-11-02T14:00:00Z')),'2026-11-02','winter 6am PST');
assert.equal(editionDate(new Date('2026-07-02T13:00:00Z')),'2026-07-02','summer 6am PDT');
const fortune={...friday,sourceId:'news-koreadaily',date:'2026-10-14T08:00:00Z',title:'[오늘의 운세] 10월 14일'};
assert(isTodaysFortune(fortune,new Date('2026-10-14T13:00:00Z')));
assert(!isTodaysFortune(fortune,new Date('2026-10-15T13:00:00Z')),'do not relabel yesterday’s fortune');
assert(!isTodaysFortune({...fortune,title:'[오늘의 운세] 11월 14일'},new Date('2026-10-14T13:00:00Z')));
console.log('PASS: Pacific dates, weekend/holiday stock retention, original timestamps, future/stale report rejection, same-day fortune.');
