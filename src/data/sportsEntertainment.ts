import { fetchFeed, googleNews, newsSources, parseFeed, type NewsItem, type NewsSource } from './newsFeeds';
import { allowedKoreanPublishers } from './newsPublishers';
import { retainedNews } from './newsHistory';
import { sameStory } from './newsDuplicates';
import { isExcludedNews } from './newsEditorial';
import { reporterNews } from './newsAuthors';

export type PeopleCategory = 'sports' | 'entertainment';
export type PeopleNewsItem = NewsItem & { category: PeopleCategory };

// Broad, explicit editorial lists of well-known Korean/Korean American people.
// Do not infer identity from a Korean surname, Korean-language article or outlet.
export const ATHLETE_NAMES = [
  '손흥민','박지성','이강인','김민재','황희찬','황인범','기성용','이청용','차범근','차두리','안정환','이동국','이천수',
  '이정후','김하성','류현진','박찬호','추신수','김혜성','김도영','이대호','이승엽','양현종','양의지','김광현','김태균','박병호','최지만','배지환',
  '김연아','김연경','안세영','박태환','황선우','김우민','손연재','이상화','이승훈','곽윤기','최민정','심석희','황대헌','윤성빈','김연경',
  '박세리','박인비','고진영','김세영','전인지','김효주','유소연','신지애','김주형','임성재','안병훈','김시우','최경주','양용은','미셸 위','미셸위','대니엘 강','다니엘 강','케빈 나',
  '김수녕','기보배','안산','김우진','오진혁','임시현','오상욱','구본길','김준호','장미란','신유빈','유승민','현정화','이용대',
  '허훈','허웅','서장훈','김선형','김동현','정찬성','추성훈','이상혁','페이커',
];
export const ENTERTAINER_NAMES = [
  '임영웅','영탁','이찬원','정동원','장민호','김호중','송가인','장윤정','홍진영','양지은','전유진','박서진','나훈아','남진','조용필','이미자','김연자','김용임','주현미','진성','설운도','태진아','송대관','심수봉','혜은이','인순이','이선희','이문세','이승철','김건모','신승훈','김범수','박효신','성시경','임창정','윤종신','김종국','이효리','엄정화','보아','박진영','양희은','최백호',
  '방탄소년단','블랙핑크','정국','제이홉','지드래곤','빅뱅','태양','대성','아이유','싸이','태연','소녀시대','샤이니','엑소','세븐틴','뉴진스','에스파','아이브','르세라핌','스트레이 키즈','트와이스','레드벨벳','투모로우바이투게더','엔하이픈',
  '유재석','강호동','신동엽','이경규','박명수','김구라','김숙','송은이','이영자','박나래','전현무','조세호','양세형','이수근','탁재훈','김준호','서장훈','기안84','덱스','빠니보틀',
  '이병헌','송강호','윤여정','이정재','정우성','최민식','한석규','설경구','황정민','유해진','김혜수','전도연','김희애','고두심','김영옥','나문희','이순재','신구','최불암','김수미','강부자','김해숙','차승원','유동근','정보석','김갑수','최수종','하희라','채시라','신애라',
  '전지현','송혜교','현빈','손예진','김태희','이영애','송중기','박보검','박서준','이민호','지창욱','김수현','김지원','김고은','한지민','한효주','박신혜','공효진','장나라','한예슬','신민아','이준기','이동욱','정해인','변우석','김우빈','도경수','임윤아','배수지','차은우','이준호','옥택연','마동석','김윤진',
  '스티븐 연','스티븐연','존 조','존조','대니얼 대 김','대니얼대김','다니엘 대 김','켄 정','켄정','랜들 박','랜들박','마거릿 조','마가렛 조','바비 리','박재범','에릭남','에일리','티파니 영','티파니영','제시카 정','크리스탈 정',
];
const namePattern=(names:string[])=>names.map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/ /g,'\\s*')).join('|');
const ATHLETES = new RegExp(`${namePattern(ATHLETE_NAMES)}|\\b(?:Son Heung.min|Michelle Wie|Danielle Kang|Kevin Na)\\b`,'i');
const ENTERTAINERS = new RegExp(`${namePattern(ENTERTAINER_NAMES)}|\\b(?:BTS|BLACKPINK|Steven Yeun|John Cho|Daniel Dae Kim|Ken Jeong|Randall Park|Margaret Cho|Bobby Lee|Eric Nam|Jay Park)\\b`,'i');
const CONTEXTUAL_ENTERTAINERS = /배우\s*공유|공유.*(?:배우|영화|출연)|(?:배우|영화|출연).*공유|블랙핑크.*(?:제니|지수|로제)|(?:제니|지수|로제).*(?:블랙핑크|솔로|앨범|가수)/;
const PEOPLE_EXCLUDES = /정치|대선|선거|대통령|의원|민주당|공화당|국민의힘|정당|지지\s*선언|탄핵|국회|트럼프|바이든|이재명|윤석열|단체\s*소식|이취임|취임식|정기총회|창립\s*기념|기금\s*모금|후원\s*행사|제2의|닮은꼴|\b(?:Trump|Biden|endorsement|election)\b/i;

export function peopleCategory(title: string): PeopleCategory | null {
  if (PEOPLE_EXCLUDES.test(title)) return null;
  if (/폭격|미사일|전쟁|테러|스폰서에\s*장악/.test(title)) return null;
  // A foreign subject described as a Korean star's former coach/friend is not
  // a story about that Korean person. Also omit celebrity reaction clickbait.
  title=title.replace(/['"‘“][^'"’”]{0,80}(?:스승|동료|절친|라이벌|맞수)[^'"’”]{0,20}['"’”]/g,'');
  if (/(?:도|까지)\s*(?:반했다|놀랐다|감탄했다)/.test(title)) return null;
  // A name mentioned only in another person's quotation is not the subject.
  const outsideQuotes=title.replace(/["“][^"”]{4,}["”]|‘[^’]{4,}’/g,'');
  if (!ATHLETES.test(outsideQuotes) && !ENTERTAINERS.test(outsideQuotes) && !CONTEXTUAL_ENTERTAINERS.test(outsideQuotes)) return null;
  if (/^(?:[^…]*?(?:안무|작곡|작사|제작)).*?(?:…|\.\.)/.test(title)) {
    const subject=title.split(/…|\.\./).slice(1).join(' ');
    if (!ATHLETES.test(subject) && !ENTERTAINERS.test(subject) && !CONTEXTUAL_ENTERTAINERS.test(subject)) return null;
  }
  // Prefer the named subject in the opening clause, not a supporting name
  // later in a quotation, TV-show comparison or list of other personalities.
  title=title.split(/[,，…]|\.{2,}/,1)[0];
  if (ATHLETES.test(title) && !(ENTERTAINERS.test(title) && /예능|방송|개그|코미디|MC|사회자|출연/.test(title))) return 'sports';
  // A Korean group's name does not establish a foreign member's identity.
  const nonKoreanSolo=/블랙핑크[\s'"‘’“”·]*리사|트와이스[\s'"‘’“”·]*(?:모모|사나|미나|쯔위)|에스파[\s'"‘’“”·]*(?:닝닝|지젤)|아이브[\s'"‘’“”·]*레이|르세라핌[\s'"‘’“”·]*(?:사쿠라|카즈하)/;
  if (nonKoreanSolo.test(title)) return null;
  // 공유 and 지수 have ordinary meanings; require entertainment context.
  if (ENTERTAINERS.test(title) || CONTEXTUAL_ENTERTAINERS.test(title)) return 'entertainment';
  return null;
}

// The same event can be syndicated with quite different headlines. Only use
// narrow event keys; a confirmed lineup is distinct from an earlier prediction.
export function samePeopleStory(a: NewsItem, b: NewsItem): boolean {
  if (sameStory(a,b)) return true;
  if (!a.date || !b.date || Math.abs(Date.parse(a.date)-Date.parse(b.date))>3*86400000) return false;
  const event=(title:string):string|null=>{
    if (/키즈\s*초이스/.test(title) && /어워[드즈]/.test(title) && /후보/.test(title)) {
      const year=title.match(/20\d{2}/)?.[0];
      if (year) return `kids-choice-nominations:${year}`;
    }
    if (/손흥민/.test(title) && /LAFC/.test(title) && /밴쿠버/.test(title) && /무승부|비겨/.test(title)) return 'son-lafc-vancouver-draw';
    return null;
  };
  const key=event(a.title);
  return key!==null && key===event(b.title);
}

export const peopleSources: NewsSource[] = newsSources.filter(source => source.lang === 'ko').map(source => ({
  ...source,
  publisherPerItem: true,
  allowPublishers: allowedKoreanPublishers,
  keywords: new RegExp(`${ATHLETES.source}|${ENTERTAINERS.source}|${CONTEXTUAL_ENTERTAINERS.source}`, 'i'),
  requiredKeywords: undefined,
  excludeKeywords: PEOPLE_EXCLUDES,
  urls: [
    googleNews(`site:${source.publisherDomain} (스포츠 OR 손흥민 OR 이정후 OR 김하성 OR 류현진 OR 김연아 OR 김연경 OR 안세영 OR 신유빈) when:7d`, 'ko', 'US'),
    googleNews(`site:${source.publisherDomain} (연예 OR 배우 OR 가수 OR 임영웅 OR 조용필 OR 방탄소년단 OR BTS OR 블랙핑크) when:7d`, 'ko', 'US'),
  ],
}));

/** Validate fresh and retained stories equally; keep original publication dates. */
export function eligiblePeopleNews(input: NewsItem[], now: Date): PeopleNewsItem[] {
  const cutoff = +now - 7 * 86400000;
  const valid = retainedNews({items: input}, peopleSources, +now)
    .filter(item => item.date && Date.parse(item.date) >= cutoff && Date.parse(item.date) <= +now
      && !isExcludedNews(item) && peopleCategory(item.title))
    .sort((a, b) => Date.parse(a.date!) - Date.parse(b.date!) || a.url.localeCompare(b.url));
  const unique: PeopleNewsItem[] = [];
  // Earliest publisher wins, matching the main news list's rule.
  for (const item of valid) if (!unique.some(other => samePeopleStory(other, item))) {
    unique.push({...item, category: peopleCategory(item.title)!});
  }
  return unique.sort((a, b) => Date.parse(b.date!) - Date.parse(a.date!) || a.url.localeCompare(b.url));
}

/** Prefer 3 + 3; fill unused slots from the other category, never more than six. */
export function selectPeopleNews(input: NewsItem[], now: Date, mainItems: NewsItem[] = []): PeopleNewsItem[] {
  const available = eligiblePeopleNews(input, now).filter(item => !mainItems.some(main => samePeopleStory(main, item)));
  const chosen = [
    ...available.filter(item => item.category === 'sports').slice(0, 3),
    ...available.filter(item => item.category === 'entertainment').slice(0, 3),
  ];
  for (const item of available) {
    if (chosen.length >= 6) break;
    if (!chosen.includes(item)) chosen.push(item);
  }
  return chosen.sort((a, b) => Date.parse(b.date!) - Date.parse(a.date!) || a.url.localeCompare(b.url));
}

export async function collectPeopleNews(now: Date, previous: NewsItem[] = []): Promise<PeopleNewsItem[]> {
  const groups = await Promise.all(peopleSources.map(async source => {
    const documents = await Promise.all(source.urls.map(fetchFeed));
    return documents.flatMap(xml => xml ? parseFeed(xml, source, 100) : []);
  }));
  // Keep the candidate pool overnight so selection can balance both categories.
  return eligiblePeopleNews(await reporterNews(eligiblePeopleNews([...groups.flat(), ...previous],now).slice(0,200),peopleSources), now);
}
