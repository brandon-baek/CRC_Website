import { readFile } from 'node:fs/promises';
import { canPublishEdition } from './daily-window.mjs';

const root=`https://api.github.com/repos/${process.env.GH_REPO}`;
const branch=process.env.DAILY_BRANCH || 'main';
const plan=JSON.parse(await readFile('.daily-refresh-plan.json','utf8'));
const pendingContent=await readFile('src/data/dailyPending.json','utf8');
const content=await readFile('src/data/dailyEdition.json','utf8');
const edition=JSON.parse(content);
async function api(path,method='GET',body) {
  const response=await fetch(root+path,{method,headers:{Authorization:`Bearer ${process.env.GH_TOKEN}`,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
  if(!response.ok) throw Error(`${method} ${path}: HTTP ${response.status}`);
  return response.json();
}
async function existing(path) {
  const file=await api(`/contents/${path}?ref=${encodeURIComponent(branch)}`);
  return JSON.parse(Buffer.from(file.content,'base64').toString('utf8'));
}
for(let attempt=1;attempt<=3;attempt++) {
  const parent=await api(`/commits/${encodeURIComponent(branch)}`);
  const priorQueue=await existing('src/data/dailyPending.json');
  if(priorQueue?.generatedAt>=plan.generatedAt) {console.log('A newer collection is already saved.');break;}
  const publish=plan.mode!=='hold' && canPublishEdition(edition,new Date());
  if(publish && !edition?.images?.cropped) throw Error('No validated images to publish');
  const entries=[{path:'src/data/dailyPending.json',mode:'100644',type:'blob',content:pendingContent}];
  if(publish) {
    const prior=await existing('src/data/dailyEdition.json');
    if(!prior?.generatedAt || prior.generatedAt<edition.generatedAt) entries.push({path:'src/data/dailyEdition.json',mode:'100644',type:'blob',content});
  }
  const tree=await api('/git/trees','POST',{base_tree:parent.commit.tree.sha,tree:entries});
  const commit=await api('/git/commits','POST',{message:`${publish?'Update daily news':'Hold news for next morning'} (${plan.generatedAt})`,tree:tree.sha,parents:[parent.sha]});
  // A job that finishes after 5pm must save only the queue, even if it started earlier.
  if(publish && !canPublishEdition(edition,new Date())) {
    if(attempt===3) throw Error('Publication cutoff reached; next collection will retain these discoveries.');
    continue;
  }
  try {await api(`/git/refs/heads/${branch}`,'PATCH',{sha:commit.sha,force:false});console.log(`${publish?'Daily edition published':'Overnight queue saved'}: ${commit.sha}`);break;}
  catch(error) {if(attempt===3)throw error;}
}
