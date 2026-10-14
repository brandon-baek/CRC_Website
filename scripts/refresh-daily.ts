import { writeFile } from 'node:fs/promises';
import { collectDailyNews } from '../src/data/dailyNews';
import { captureDailyImages } from './daily-capture/capture.mjs';

const now=new Date();
// Publish one complete edition, never a mixture of new labels and old captures.
const [news,visuals]=await Promise.all([collectDailyNews(now),captureDailyImages(now)]);
if(!news.liveItemCount || !news.items.some(item=>item.sourceId==='daily-la') || !news.items.some(item=>item.sourceId!=='daily-la')) {
  throw Error('Daily news sources did not return a complete bilingual edition');
}
if(!news.fortune) console.warn('Today’s fortune has not been published/indexed; no older fortune will be substituted.');
if(!news.stocks) console.warn('No recent Radio Korea stock report is available.');
await writeFile('src/data/dailyEdition.json',JSON.stringify({...news,timeZone:'America/Los_Angeles',...visuals})+'\n');
console.log(`Daily edition ready: ${news.editionDate}; ${news.items.length} stories; stock report ${news.stocks?.date??'unavailable'}`);
