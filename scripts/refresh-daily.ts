import { writeFile,readFile } from 'node:fs/promises';
import { collectDailyNews } from '../src/data/dailyNews';
import { refreshMode } from './daily-window.mjs';
import { prepareDailyPublication } from '../src/data/dailyPublication';

const now=new Date();
const saved=JSON.parse(await readFile('src/data/dailyEdition.json','utf8'));
const mode=process.env.DAILY_MODE==='hold'?'hold':refreshMode(saved,now);
const news=await collectDailyNews(now);
if(!news.liveItemCount || !news.items.some(item=>item.sourceId==='daily-la') || !news.items.some(item=>item.sourceId!=='daily-la')) {
  throw Error('Daily news sources did not return a complete bilingual collection');
}
// Keep discoveries even when they leave the publisher's front page overnight.
await writeFile('src/data/dailyPending.json',JSON.stringify(news)+'\n');
await writeFile('.daily-refresh-plan.json',JSON.stringify({mode,generatedAt:news.generatedAt})+'\n');
if(mode==='hold') {
  console.log('Outside 5:15am-5pm Pacific: discoveries saved; displayed edition unchanged.');
} else {
  let visuals={images:saved?.images,sourceChecks:saved?.sourceChecks};
  if(mode==='full') {
    const {captureDailyImages}=await import('./daily-capture/capture.mjs');
    visuals=await captureDailyImages(now);
  }
  const published=prepareDailyPublication(news,saved,now);
  await writeFile('src/data/dailyEdition.json',JSON.stringify({...published,timeZone:'America/Los_Angeles',...visuals})+'\n');
  console.log(`${mode} update ready: ${news.editionDate}; ${news.items.length} stories; stock report ${news.stocks?.date??'unavailable'}`);
}
