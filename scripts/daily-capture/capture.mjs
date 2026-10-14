import { chromium } from 'playwright';
import sharp from 'sharp';
import { weather,weatherLink } from './weather.mjs';

export const SOURCES = {
  weather: weatherLink,
  // This is the Wise converter embedded by Korea Times, cropped below KRW.
  rates: 'https://wise.com/gb/currency-converter/fx-widget/table?sourceCurrency=USD&targetCurrencies=KRW%2CGBP%2CEUR%2CJPY',
  lottery: 'https://www.calottery.com/',
};

async function readyImages(locator) {
  await locator.evaluate(async el => {
    await Promise.all([...el.querySelectorAll('img')].map(img => img.decode()));
    await document.fonts.ready;
  });
}

async function rates(page) {
  await page.setViewportSize({width:360,height:600});
  await page.goto(SOURCES.rates,{waitUntil:'domcontentloaded'});
  const row=page.locator('[class*="_tableRow_"]').filter({hasText:'KRW'});
  await row.waitFor({state:'visible'});
  const text=await row.innerText();
  const value=Number(text.replace(/KRW/g,'').replace(/[,\s]/g,''));
  if(!Number.isFinite(value)||value<100||value>10000) throw Error('USD/KRW value is missing or invalid');
  if(await page.locator('#money-input').inputValue()!=='1' || await page.locator('select').inputValue()!=='USD') throw Error('Rate source currency changed');
  await page.evaluate(()=>document.fonts.ready);
  const card=page.locator('[class*="_card_"]').first();
  const box=await card.boundingBox(), bottom=await row.boundingBox();
  if(!box||!bottom) throw Error('Rate crop missing');
  const bytes=await page.screenshot({clip:{x:box.x,y:box.y,width:box.width,height:bottom.y+bottom.height-box.y},animations:'disabled'});
  return {bytes,details:{base:'USD',quote:'KRW',value}};
}

async function lottery(page, now) {
  await page.goto(SOURCES.lottery,{waitUntil:'domcontentloaded'});
  const ids=['draw-card-12','draw-card-15','draw-card-8'];
  const images=[], details=[];
  for(const id of ids) {
    const card=page.locator(`#${id}`);
    await card.waitFor({state:'visible'});
    await card.scrollIntoViewIfNeeded();
    await readyImages(card);
    const amount=await card.locator('.draw-cards--lottery-amount').innerText();
    const nextDraw=await card.locator('.draw-cards--next-draw-date strong').innerText();
    const date=nextDraw.replace(/^[A-Z]+\//,'').replace(/\//g,' ');
    const drawTime=Date.parse(date+' 23:59:59 GMT-0800');
    if(!/\$[\d,.]+\s*(MILLION|BILLION)/i.test(amount)||!Number.isFinite(drawTime)||drawTime<+now||drawTime>+now+8*86400000) throw Error(`Invalid or outdated lottery card: ${id}`);
    // Capture each official card to exclude the floating 'See all games' button.
    images.push(await card.screenshot({animations:'disabled'}));
    details.push({game:id,jackpot:amount,nextDraw});
  }
  const resized=await Promise.all(images.map(bytes=>sharp(bytes).resize({width:318}).png().toBuffer()));
  const sizes=await Promise.all(resized.map(bytes=>sharp(bytes).metadata()));
  const height=Math.max(...sizes.map(s=>s.height));
  const bytes=await sharp({create:{width:994,height,channels:3,background:'#f5f5f5'}})
    .composite(resized.map((input,i)=>({input,left:i*338,top:0}))).png().toBuffer();
  return {bytes,details};
}

export async function captureDailyImages(now=new Date()) {
  const browser=await chromium.launch({headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:2,locale:'en-US',timezoneId:'America/Los_Angeles'});
    context.setDefaultTimeout(45000);
    context.setDefaultNavigationTimeout(45000);
    const output={}, checks={};
    for(const [name,fn] of Object.entries({weather,rates,lottery})) {
      let result;
      for(let attempt=1;attempt<=3;attempt++) {
        const page=await context.newPage();
        try { result=await fn(page,now); break; }
        catch(error) {
          console.warn(`${name} attempt ${attempt}: ${error.message}`);
          console.warn((await page.locator('body').innerText({timeout:2000}).catch(()=>'' )).slice(0,500));
          if(attempt===3) throw error;
        }
        finally { await page.close(); }
      }
      if(result.bytes.length<1500) throw Error(`Empty ${name} capture`);
      output[name]='data:image/png;base64,'+result.bytes.toString('base64');
      checks[name]={url:SOURCES[name],checkedAt:new Date().toISOString(),details:result.details};
      console.log(`Captured ${name}: ${result.bytes.length} bytes`);
    }
    return {images:{...output,capturedAt:now.toISOString(),cropped:true},sourceChecks:checks};
  } finally {await browser.close();}
}
