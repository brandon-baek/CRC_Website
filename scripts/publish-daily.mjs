import { readFile } from 'node:fs/promises';

const root=`https://api.github.com/repos/${process.env.GH_REPO}`;
const branch=process.env.DAILY_BRANCH || 'main';
const content=await readFile('src/data/dailyEdition.json','utf8');
const edition=JSON.parse(content);
if(!edition?.images?.cropped || !edition.generatedAt) throw Error('No validated edition to publish');
async function api(path,method='GET',body) {
  const response=await fetch(root+path,{method,headers:{Authorization:`Bearer ${process.env.GH_TOKEN}`,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
  if(!response.ok) throw Error(`${method} ${path}: HTTP ${response.status}`);
  return response.json();
}
// Rebase this one generated file onto the latest tree, preserving concurrent site edits.
for(let attempt=1;attempt<=3;attempt++) {
  const parent=await api(`/commits/${encodeURIComponent(branch)}`);
  const existing=await api(`/contents/src/data/dailyEdition.json?ref=${encodeURIComponent(branch)}`);
  const prior=JSON.parse(Buffer.from(existing.content,'base64').toString('utf8'));
  if(prior?.generatedAt && prior.generatedAt>=edition.generatedAt) {console.log('A newer edition is already saved.');break;}
  const tree=await api('/git/trees','POST',{base_tree:parent.commit.tree.sha,tree:[{path:'src/data/dailyEdition.json',mode:'100644',type:'blob',content}]});
  const commit=await api('/git/commits','POST',{message:`Publish daily edition (${edition.editionDate})`,tree:tree.sha,parents:[parent.sha]});
  try {await api(`/git/refs/heads/${branch}`,'PATCH',{sha:commit.sha,force:false});console.log(`Daily edition published: ${commit.sha}`);break;}
  catch(error) {if(attempt===3)throw error;}
}
