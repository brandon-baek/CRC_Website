import type { NewsItem } from './newsFeeds';

// CRC editorial scope: exclude ICE and immigration-enforcement coverage.
// Keep ordinary immigration benefits, citizenship services and unrelated words.
const ENFORCEMENT = /\bICE\b(?!\s+(?:cream|cubes?|rink|skating)\b)|\bI\.C\.E\b|이민\s*(?:세관\s*)?단속|이민세관국|이민세관집행국|이민관세집행국|이민세관수사국/;
const ENGLISH_ENFORCEMENT = /immigration\s+(?:and\s+customs\s+enforcement|enforcement|raids?|crackdown)|deportation\s+(?:raids?|operations?)/i;
const ENFORCEMENT_URL = /(?:^|[\/_-])(?:ice|immigration-enforcement|immigration-raids?|deportation-raids?)(?:[\/_-]|$)/i;

export function isExcludedNews(item: Pick<NewsItem, 'title' | 'summary' | 'url'>): boolean {
  const text = item.title + ' ' + item.summary;
  if (ENFORCEMENT.test(text) || ENGLISH_ENFORCEMENT.test(text)) return true;
  try { return ENFORCEMENT_URL.test(new URL(item.url).pathname); } catch { return false; }
}
