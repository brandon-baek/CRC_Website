import assert from 'node:assert/strict';
import { dailySelection } from '../src/data/dailySelection';
import type { NewsItem } from '../src/data/newsFeeds';
const story=(date:string,i=0)=>({sourceId:'news-koreatimes',title:String(i),url:`https://example.com/${i}`,date,summary:''} as NewsItem);
const now=new Date('2026-10-16T18:00:00Z');
const fresh=Array.from({length:45},(_,i)=>story(`2026-10-16T17:${String(i).padStart(2,'0')}:00Z`,i));
const overnight=story('2026-10-16T00:00:00Z',99); // Previous day 5pm PDT.
const selected=dailySelection([...fresh,overnight,story('2026-10-15T23:59:59Z'),story('2026-10-17T00:00:00Z'),story('2026-10-01T00:00:00Z')],now,true).items;
assert.equal(selected.length,40);
assert.equal(selected[0].title,'44');
assert.equal(dailySelection([overnight],now,true).items[0],overnight);
assert.equal(dailySelection(fresh,now,false).items.length,0);
for(const [edition,cutoff] of [['2026-11-02T15:00:00Z','2026-11-02T01:00:00Z'],['2026-03-09T14:00:00Z','2026-03-09T00:00:00Z']]) {
 const rows=[story(cutoff),story(new Date(Date.parse(cutoff)-1).toISOString())];
 assert.deepEqual(dailySelection(rows,new Date(edition),true).items,[rows[0]]);
}
console.log('PASS: one prioritized 40-story edition; prior evening after 5pm retained, earlier/future news removed, DST boundaries.');
