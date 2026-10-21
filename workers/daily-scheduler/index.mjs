import { localDate, localHour, localMinute } from '../../scripts/daily-window.mjs';

export function due(now) {
  const hour=localHour(now), minute=localMinute(now), time=hour*60+minute;
  if(time>=315 && time<=390 && minute%5===0) return 'morning';
  if(hour>=6 && hour<17 && (minute===7 || minute===37)) return 'daytime';
  if((hour<5 || hour>=17) && minute===7) return 'overnight';
  return null;
}
export function freshEdition(feed,now) {
  const generated=Date.parse(feed?.generatedAt), images=Date.parse(feed?.imagesCapturedAt);
  return feed?.editionDate===localDate(now) && Number.isFinite(generated) && generated<=+now
    && localDate(new Date(generated))===localDate(now) && localHour(new Date(generated))*60+localMinute(new Date(generated))>=315
    && Number.isFinite(images) && images<=+now && localDate(new Date(images))===localDate(now)
    && Array.isArray(feed.items) && feed.items.some(item=>item.sourceId==='daily-la')
    && feed.items.some(item=>item.sourceId && item.sourceId!=='daily-la');
}
// Called with a mocked request in tests. No requests or writes occur while disabled.
export async function runScheduler(env,now=new Date(),request=fetch) {
  if(env.ENABLED!=='true') return 'disabled';
  const kind=due(now);
  if(!kind) return 'not-due';
  if(!env.GITHUB_DISPATCH_TOKEN || !env.STATE) throw Error('Scheduler token and STATE binding are required');
  const slot=`slot:${Math.floor(+now/60000)}`;
  if(await env.STATE.get(slot)) return 'duplicate';
  const root='https://api.github.com/repos/brandon-baek/CRC_Website';
  const headers={Authorization:`Bearer ${env.GITHUB_DISPATCH_TOKEN}`,Accept:'application/vnd.github+json','Content-Type':'application/json','User-Agent':'CRC daily scheduler','X-GitHub-Api-Version':'2022-11-28'};
  const call=(url,options={})=>request(url,{...options,signal:AbortSignal.timeout(20000)});
  let fresh=false;
  if(kind==='morning') {
    try {
      const response=await call(`https://crcnow.org/daily-feed.json?verification=${+now}`,{headers:{'Cache-Control':'no-cache'}});
      fresh=response.ok && freshEdition(await response.json(),now);
    } catch { /* An unavailable live feed is stale, never a verified success. */ }
    if(fresh) {
      await env.STATE.put(`verified:${localDate(now)}`,now.toISOString(),{expirationTtl:172800});
      await env.STATE.put(slot,'verified',{expirationTtl:3600});
      console.log(`Live morning edition verified: ${localDate(now)} at ${now.toISOString()}`);
      return 'verified';
    }
    if(localHour(now)>=6) {
      const key=`alert:${localDate(now)}`;
      if(!(await env.STATE.get(key))) {
        console.error(`DEADLINE MISSED: ${localDate(now)} morning edition not verified by 6am Pacific`);
        if(env.ALERT_WEBHOOK_URL) {
          const response=await call(env.ALERT_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:`CRC 생활정보: ${localDate(now)} morning edition has not been verified live by 6am Pacific. Automatic recovery is continuing.`})});
          if(!response.ok) throw Error(`Deadline alert failed: HTTP ${response.status}`);
          await env.STATE.put(key,'sent',{expirationTtl:172800});
        }
      }
    }
  }
  // Do not pile new runs behind a job already collecting/building. Retry next tick.
  const response=await call(`${root}/actions/workflows/refresh-daily.yml/runs?branch=main&per_page=20`,{headers});
  if(!response.ok) throw Error(`Read workflow runs: HTTP ${response.status}`);
  const {workflow_runs:runs}=await response.json();
  if(!Array.isArray(runs)) throw Error('Invalid workflow run response');
  if(runs.some(run=>run.head_branch==='main' && ['queued','in_progress','waiting','pending','requested'].includes(run.status))) return 'busy';
  const dispatched=await call(`${root}/actions/workflows/refresh-daily.yml/dispatches`,{method:'POST',headers,body:JSON.stringify({ref:'main'})});
  if(!dispatched.ok) throw Error(`Dispatch daily workflow: HTTP ${dispatched.status}`);
  await env.STATE.put(slot,'dispatched',{expirationTtl:3600});
  console.log(`Daily workflow dispatched: ${kind} at ${now.toISOString()}`);
  return 'dispatched';
}
export default {
  scheduled(controller,env,ctx) { ctx.waitUntil(runScheduler(env,new Date(controller.scheduledTime))); },
  fetch() { return new Response('Not found',{status:404}); },
};
