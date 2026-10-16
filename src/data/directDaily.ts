import type { NewsItem, NewsSource } from './newsFeeds';
import { plainText } from './koreatownPress';
import { articlePage } from './newsDuplicates';
import { headlineKey } from './newsDuplicates';

const lists: Record<string,string[]> = {
  'news-koreadaily': ['https://www.koreadaily.com/','https://www.koreadaily.com/section/society','https://www.koreadaily.com/section/economy','https://www.koreadaily.com/section/life'],
  'news-koreatimes': ['http://la.koreatimes.com/','http://la.koreatimes.com/section/101','http://la.koreatimes.com/section/102','http://la.koreatimes.com/section/105','http://la.koreatimes.com/section/106','http://la.koreatimes.com/section/104'],
};
const pages=new Map<string,string>();
const titlePages=new Map<string,string>();
const rejected=new Set<string>();
export const rejectedDirectArticle=(item:NewsItem)=>rejected.has(item.sourceId+':'+headlineKey(item.title));
export async function inspectDailyArticle(item:NewsItem,source:NewsSource) {
  return pages.get(item.url) ?? titlePages.get(item.sourceId+':'+headlineKey(item.title)) ?? articlePage(item,source);
}
function meta(html:string,key:string) {
  for(const tag of html.match(/<meta\b[^>]*>/gi)??[]) {
    const attrs=Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(m=>[m[1].toLowerCase(),m[3]]));
    if((attrs.property??attrs.name)===key)return plainText(attrs.content??'');
  }
  return '';
}
export function directLinks(html:string,sourceId:string):string[] {
  const origin=sourceId==='news-koreadaily'?'https://www.koreadaily.com':'http://la.koreatimes.com';
  const domain=sourceId==='news-koreadaily'?'koreadaily.com':'koreatimes.com';
  const urls=new Set<string>();
  for(const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["']/gi))try {
    const u=new URL(m[1].replace(/&amp;/g,'&'),origin);
    if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.port||!(u.hostname===domain||u.hostname.endsWith('.'+domain)))continue;
    if(!/^\/article\/\d{8,17}(?:\/\d+)?\/?$/.test(u.pathname))continue;
    urls.add(origin+u.pathname.replace(/\/$/,''));
  }catch{}
  return [...urls].sort((a,b)=>b.localeCompare(a));
}
export function parseDirectArticle(html:string,url:string,source:NewsSource):NewsItem|null {
  const title=meta(html,'og:title').replace(/\s*(?:\||-)\s*미주\s*(?:중앙일보|한국일보)\s*$/,'').trim();
  const timestamp=meta(html,'article:published_time');
  const day=html.match(/class=["']upload_date["'][^>]*>\s*(\d{4}-\d{2}-\d{2})/)?.[1];
  // Korea Times exposes a date with an unlabelled clock. Preserve its displayed
  // calendar date rather than inventing a Pacific/UTC conversion for that clock.
  const date=timestamp&&/(?:Z|[+-]\d\d:\d\d)$/.test(timestamp)?timestamp:day??null;
  if(!title||!date||!Number.isFinite(Date.parse(date)))return null;
  const section=[meta(html,'article:section'),meta(html,'article:section2')].join(' ');
  const location=html.match(/<div\b[^>]*id=["']location_arti["'][^>]*>([\s\S]*?)<\/div>/)?.[1]??'';
  const health=/건강|혈액|치료|예방|질환|검진/.test(title);
  if(/정치|오피니언|사설|칼럼|연예|스포츠|종교/.test(section+plainText(location))||/\/section\/(?:113|103|109|111|102\/220|108\/259|105\/245)(?:[/'"])/.test(location)||(/\/102\/217/.test(location)&&!health)) {
    rejected.add(source.id+':'+headlineKey(title));return null;
  }
  return {sourceId:source.id,publisher:source.label.ko,title,url,date,summary:meta(html,'og:description').slice(0,450),...(timestamp?{}:{publicationDay:day})};
}
export async function fetchDirectDaily(source:NewsSource,read:(url:string)=>Promise<string|null>) {
  const documents=await Promise.all((lists[source.id]??[]).map(read));
  const urls=[...new Set(documents.flatMap(html=>html?directLinks(html,source.id):[]))].sort((a,b)=>b.localeCompare(a)).slice(0,120);
  const items:NewsItem[]=[];
  await Promise.all(Array.from({length:4},async()=>{while(urls.length){
    const url=urls.shift()!;
    const html=await read(url);if(!html)continue;
    pages.set(url,html);
    titlePages.set(source.id+':'+headlineKey(meta(html,'og:title').replace(/\s*(?:\||-)\s*미주\s*(?:중앙일보|한국일보)\s*$/,'')),html);
    const item=parseDirectArticle(html,url,source);if(item)items.push(item);
  }}));
  return items;
}
