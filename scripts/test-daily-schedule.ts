import assert from 'node:assert/strict';
import { editionDate, isTodaysFortune, latestStockReport, latestFortune } from '../src/data/dailySchedule';
import type { NewsItem } from '../src/data/newsFeeds';
import { forecastDays } from './daily-capture/weather.mjs';
import { refreshMode,canPublishEdition,isPublishingWindow } from './daily-window.mjs';

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
const periods=Array.from({length:8},(_,i)=>{
  const day=14+Math.floor(i/2),night=i%2===1;
  return {isDaytime:!night,startTime:`2026-10-${day}T${night?'18':'06'}:00:00-07:00`,endTime:`2026-10-${night?day+1:day}T${night?'06':'18'}:00:00-07:00`,temperature:night?60:80,temperatureUnit:'F',shortForecast:'Sunny'};
});
const forecast={properties:{updateTime:'2026-10-14T12:00:00Z',periods}};
assert.deepEqual(forecastDays(forecast,new Date('2026-10-14T13:00:00Z')).map(d=>[d.high,d.low]),[[80,60],[80,60],[80,60],[80,60]]);
assert.throws(()=>forecastDays(forecast,new Date('2026-10-16T13:00:00Z')),/outdated/);
assert.throws(()=>forecastDays({properties:{...forecast.properties,periods:periods.filter(p=>p.isDaytime)}},new Date('2026-10-14T13:00:00Z')),/missing temperatures/);
assert.throws(()=>forecastDays({properties:{...forecast.properties,periods:periods.map(p=>({...p,temperatureUnit:'C'}))}},new Date('2026-10-14T13:00:00Z')),/missing temperatures/);
console.log('PASS: four-day source forecast, matching overnight lows, stale/missing/Celsius data rejected.');
const current={editionDate:'2026-10-14',generatedAt:'2026-10-14T13:00:00Z',images:{capturedAt:'2026-10-14T13:00:00Z'}};
assert.equal(refreshMode(current,new Date('2026-10-14T12:14:59Z')),'hold','5:14am holds');
assert.equal(refreshMode(null,new Date('2026-10-14T12:15:00Z')),'full','5:15am prepares morning package');
assert(canPublishEdition({...current,generatedAt:'2026-10-14T12:20:00Z'},new Date('2026-10-14T12:25:00Z')),'publish before 6am');
assert.equal(refreshMode(null,new Date('2026-10-14T13:00:00Z')),'full','6am opens full package');
assert.equal(refreshMode(current,new Date('2026-10-14T23:59:59Z')),'news','4:59pm refreshes news');
assert.equal(refreshMode(current,new Date('2026-10-15T00:00:00Z')),'hold','5pm freezes');
assert.equal(refreshMode(current,new Date('2026-10-15T07:00:00Z')),'hold','midnight does not release queue');
assert.equal(refreshMode(current,new Date('2026-10-15T12:14:59Z')),'hold');
assert.equal(refreshMode(current,new Date('2026-10-15T12:15:00Z')),'full');
assert.equal(refreshMode(current,new Date('2026-10-15T13:00:00Z')),'full','next 6am releases morning package');
const late={...current,generatedAt:'2026-10-14T23:58:00Z'};
assert(canPublishEdition(late,new Date('2026-10-14T23:59:59Z')));
assert(!canPublishEdition(late,new Date('2026-10-15T00:00:00Z')),'in-flight build cannot publish after cutoff');
assert(!canPublishEdition(late,new Date('2026-10-15T13:00:00Z')),'yesterday delayed job cannot replace morning edition');
assert.equal(isPublishingWindow(new Date('2026-11-02T13:14:59Z')),false,'winter 5:14am PST');
assert.equal(isPublishingWindow(new Date('2026-11-02T13:15:00Z')),true,'winter 5:15am PST');
assert.equal(isPublishingWindow(new Date('2026-11-03T01:00:00Z')),false,'winter 5pm PST');
assert.equal(isPublishingWindow(new Date('2026-11-01T08:30:00Z')),false,'first fall-back 1:30am');
assert.equal(isPublishingWindow(new Date('2026-11-01T09:30:00Z')),false,'second fall-back 1:30am');
console.log('PASS: 5:15am opening, daytime updates, 5pm freeze, overnight hold, next-day release, delayed job guard, DST.');

const fortuneFriday={...fortune,title:'[오늘의 운세] 10월 16일',date:'2026-10-15T15:02:00Z',url:'https://www.koreadaily.com/article/friday'};
const fortuneMonday={...fortuneFriday,title:'[오늘의 운세] 10월 19일',date:'2026-10-18T15:02:00Z'};
for(const date of ['2026-10-17T13:00:00Z','2026-10-18T23:00:00Z','2026-10-19T13:00:00Z']) {
 assert.equal(latestFortune([fortuneFriday],new Date(date)),fortuneFriday);
}
assert.equal(latestFortune([fortuneMonday,fortuneFriday],new Date('2026-10-18T23:00:00Z')),fortuneFriday,'early Monday post is not Sunday fortune');
assert.equal(latestFortune([fortuneMonday,fortuneFriday],new Date('2026-10-19T13:00:00Z')),fortuneMonday);
assert.equal(latestFortune([fortuneFriday],new Date('2026-11-20T13:00:00Z')),null);
assert.equal(latestFortune([{...fortuneFriday,url:'https://evil.example/'}],new Date('2026-10-17T13:00:00Z')),null);
console.log('PASS: latest fortune retention, original date, replacement, future-day and stale rejection.');
