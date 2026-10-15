import type { NewsItem } from './newsFeeds';

// CRC editorial scope: exclude ICE and immigration-enforcement coverage.
// Keep ordinary immigration benefits, citizenship services and unrelated words.
const ENFORCEMENT = /\bICE\b(?!\s+(?:cream|cubes?|rink|skating)\b)|\bI\.C\.E\b|이민\s*(?:세관\s*)?단속|이민세관국|이민세관집행국|이민관세집행국|이민세관수사국/;
const ENGLISH_ENFORCEMENT = /immigration\s+(?:and\s+customs\s+enforcement|enforcement|raids?|crackdown)|deportation\s+(?:raids?|operations?)/i;
const ENFORCEMENT_URL = /(?:^|[\/_-])(?:ice|immigration-enforcement|immigration-raids?|deportation-raids?)(?:[\/_-]|$)/i;

// Specific editorial removals apply to both new feeds and saved editions.
// Keep unrelated clinic services and healthcare information eligible.
const REMOVED_ARTICLE_URLS = new Set([
  'https://koreatownpress.org/news/town/neighbor-care-clinic-prop-44-patient-risk',
]);
const normalizeTitle = (title: string) => title.normalize('NFKC').replace(/[\p{P}\p{S}\s]/gu, '').toLowerCase();
const REMOVED_ARTICLE_TITLES = new Set([
  normalizeTitle('이웃케어클리닉 "주민발의안 44로 한인 환자들, 피해 떠안을 수도"'),
]);

export function isExcludedNews(item: Pick<NewsItem, 'title' | 'summary' | 'url'>): boolean {
  if (REMOVED_ARTICLE_TITLES.has(normalizeTitle(item.title))) return true;
  const text = item.title + ' ' + item.summary;
  if (ENFORCEMENT.test(text) || ENGLISH_ENFORCEMENT.test(text)) return true;
  try {
    const url = new URL(item.url);
    const canonical = `https://${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}`;
    return REMOVED_ARTICLE_URLS.has(canonical) || ENFORCEMENT_URL.test(url.pathname);
  } catch { return false; }
}
