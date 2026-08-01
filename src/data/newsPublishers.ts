/**
 * Which news outlets may appear on the News page.
 *
 * The press-coverage feeds come from Google News searches, and Google indexes
 * everything — corporate blogs, content farms, blog platforms, overseas papers
 * with no bearing on Los Angeles. This file is the filter.
 *
 * THE RULE FOR ADDING ONE: this site's whole job is telling people whom to
 * trust. An outlet belongs here only if a reader could reasonably be expected
 * to trust it — an established newspaper, a broadcast station, a wire service,
 * a recognised consumer organisation. When in doubt, leave it off; a shorter
 * page costs nothing next to one bad source on a page about fraud.
 *
 * Names must match EXACTLY what Google reports in each item's <source> element,
 * which is not always the outlet's own branding ("ABC7 Los Angeles", not
 * "ABC7"). To see what a feed currently reports:
 *
 *   curl -s "https://news.google.com/rss/search?q=scam&hl=en-US&gl=US&ceid=US:en" \
 *     | grep -o '<source[^>]*>[^<]*' | sed 's/.*>//' | sort | uniq -c | sort -rn
 *
 * An outlet that renames itself in Google's index silently stops appearing, so
 * re-run that occasionally if a source seems to have gone quiet.
 */

/** Los Angeles and California — the coverage closest to our community. */
const LOCAL = [
  'Los Angeles Times',
  'LAist',
  'Los Angeles Daily News',
  'KTLA',
  'ABC7 Los Angeles',
  'NBC Los Angeles',
  'FOX 11 Los Angeles',
  'KCAL News',
  'CalMatters',
  'The Orange County Register',
  'Long Beach Post',
  'LAmag',
];

/** National outlets and recognised consumer organisations. */
const NATIONAL = [
  'NBC News',
  'ABC News',
  'CBS News',
  'NPR',
  'USA TODAY',
  'CNBC',
  'The Washington Post',
  'The New York Times',
  'Associated Press',
  'AP News',
  'Reuters',
  'AARP',
  'Consumer Reports',
  'The Wall Street Journal',
];

/** Korean-American press. Several publish no RSS of their own but are indexed. */
const KOREAN_AMERICAN = [
  '미주중앙일보',
  '미주한국일보',
  '미주조선일보',
  '시애틀코리안데일리',
  '한인포스트',
  '재외동포신문',
  '라디오코리아',
  '동포저널',
];

/** Korea-domestic outlets, for 보이스피싱 coverage. */
const KOREA = [
  '연합뉴스',
  '연합뉴스TV',
  '동아일보',
  '조선일보',
  '중앙일보',
  '한겨레',
  '경향신문',
  '뉴스1',
  '한국경제',
  '매일경제',
  '머니투데이',
  '파이낸셜뉴스',
  '서울경제',
  'KBS',
  'MBC',
  'SBS',
  'YTN',
];

/** English-language coverage: local first, then national. */
export const allowedEnglishPublishers = new Set([...LOCAL, ...NATIONAL]);

/** Korean-language coverage, community papers and Korean outlets alike. */
export const allowedKoreanPublishers = new Set([...KOREAN_AMERICAN, ...KOREA]);
