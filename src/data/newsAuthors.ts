import type { NewsItem, NewsSource } from './newsFeeds';
import { articlePage } from './newsDuplicates';
import { isExcludedNews } from './newsEditorial';

export type AuthorDecision = 'reporter' | 'commercial' | 'unverified';
const commercial = /보험|부동산|브로커|에이전트|공인회계사|세무사|재정상담|대표|사장|사업가|사업자|기업인|업주|원장|변호사|컨설턴트|\b(?:agent|broker|realtor|business\s*owner|entrepreneur|CEO|president|founder|CPA|financial\s*advis[eo]r|consultant)\b/i;
const reporter = /기자|특파원|취재팀|편집국|뉴스팀|\b(?:reporter|correspondent|staff\s*writer|newsroom|news\s*staff)\b/i;
const text = (s:string) => s.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();

/** Inspect author fields only; quoting a broker in a reporter's story is allowed. */
export function articleAuthorDecision(html:string): AuthorDecision {
  const evidence:string[]=[];
  // Korea Times' primary byline sits just below tit_arti, before the article body.
  const ktHeader=html.split(/id=["']tit_arti["']/)[1]?.slice(0,2000);
  const ktWriter=ktHeader?.match(/<span\b[^>]*class=["']writer["'][^>]*>([\s\S]*?)<\/span>\s*(?:기자)?\s*<\/span>/)?.[1];
  if(ktWriter)evidence.push(text(ktWriter));
  let reporterProfile=false;
  let primaryArticleSeen=false;
  for(const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const visit=(value:any) => {
        if(Array.isArray(value)){value.forEach(visit);return;}
        if(!value || typeof value!=='object')return;
        if(!primaryArticleSeen && /Article|Report/.test(String(value['@type']??''))) {
          primaryArticleSeen=true;
          for(const author of [value.author].flat().filter(Boolean)) {
            evidence.push(typeof author==='string'?author:[author.name,author.jobTitle,author.description,author.affiliation?.name,author.worksFor?.name].filter(Boolean).join(' '));
            if(typeof author==='object' && /\/(?:reporter|journalist)\//i.test(author.url??''))reporterProfile=true;
          }
        }
        if(value['@graph'])visit(value['@graph']);
        if(value.mainEntity)visit(value.mainEntity);
      };
      visit(JSON.parse(match[1]));
    }catch{/* Malformed metadata is not evidence of reporter authorship. */}
  }
  for(const tag of html.match(/<meta\b[^>]*>/gi)??[]) {
    if(/(?:name|property)=["'](?:author|article:author|byl)["']/i.test(tag)) {
      const content=tag.match(/content=["']([^"']*)["']/i)?.[1];
      if(content)evidence.push(text(content));
    }
  }
  const headlineAt=html.search(/<h1\b/i);
  const bodyAt=html.search(/(?:itemprop|data-content-field)=["']articleBody["']/i);
  const bylineScope=headlineAt>=0?html.slice(headlineAt,bodyAt>headlineAt?bodyAt:headlineAt+4000):html;
  for(const match of bylineScope.matchAll(/<(span|div|p|a)\b[^>]*(?:class|id|itemprop|data-content-field)=["'][^"']*(?:byline|article-info|reporter|author-name|author-info|jobTitle)[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi)) {
    const value=text(match[2]);
    if(value.length<500)evidence.push(value);
  }
  // Some outlets place the contributor's name/occupation beneath the article.
  // Never scan the whole page: unrelated recommended columns and ads are not bylines.
  const main=html.match(/<(?:div|section)\b[^>]*(?:itemprop|data-content-field)=["']articleBody["'][^>]*>([\s\S]*?)(?:<\/article>|<[^>]+(?:class|id)=["'][^"']*(?:copyright|related|share|comment)[^"']*["'])/i)?.[1];
  if(main){
    for(const match of main.matchAll(/<(?:p|div|span)[^>]*>([^<>]{2,120})<\/(?:p|div|span)>/gi)) {
      const value=text(match[1]);
      if(/^(?:글|필자|기고)\s*[:：]/.test(value) || /^[가-힣]{2,4}\s+[^.!?。]{0,55}(?:대표|사장|브로커|에이전트|기자|특파원)$/.test(value))evidence.push(value);
    }
  }
  if(evidence.some(s=>commercial.test(s)))return 'commercial';
  if(reporterProfile || evidence.some(s=>reporter.test(s)))return 'reporter';
  return 'unverified';
}

type Inspect = (item:NewsItem,source:NewsSource)=>Promise<string|null>;
const decisions=new Map<string,Promise<AuthorDecision>>();
/** Unknown authors are allowed; identified commercial authors remain excluded. */
export async function reporterNews(items:NewsItem[],sources:NewsSource[],inspect:Inspect=articlePage):Promise<NewsItem[]> {
  const sourceById=new Map(sources.map(s=>[s.id,s]));
  const allowed:boolean[]=new Array(items.length).fill(false);
  let next=0;
  const worker=async()=>{while(next<items.length){
    const index=next++,item=items[index],source=sourceById.get(item.sourceId);
    if(!source || isExcludedNews(item))continue;
    // This gate covers the four Korean-American media outlets. Official agency
    // releases and the separately curated English sources keep their own rules.
    if(source.lang!=='ko'){allowed[index]=true;continue;}
    const key=source.id+':'+item.url+':'+item.title;
    let decision=inspect===articlePage?decisions.get(key):undefined;
    if(!decision){
      decision=inspect(item,source).then(html=>html?articleAuthorDecision(html):'unverified' as AuthorDecision).catch(()=>'unverified' as AuthorDecision);
      if(inspect===articlePage)decisions.set(key,decision);
    }
    allowed[index]=(await decision)!=='commercial';
  }};
  await Promise.all(Array.from({length:4},worker));
  return items.filter((_,i)=>allowed[i]);
}
