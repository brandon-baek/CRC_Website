import type { NewsItem, NewsSource } from './newsFeeds';
import type { Locale } from '../i18n';

export const newsTopics = [
  { id: 'scams', en: 'Scam alerts', ko: '사기 주의보', icon: 'shield' },
  { id: 'cyber', en: 'Identity & cyber safety', ko: '개인정보·해킹', icon: 'id-card' },
  { id: 'money', en: 'Money & investments', ko: '금융·투자', icon: 'bank' },
  { id: 'consumer', en: 'Consumer protection', ko: '소비자 보호', icon: 'cart' },
] as const;

export function newsTopic(title: string) {
  if (/hack|cyber|data breach|identity theft|malware|ransomware|phish|해킹|해커|개인정보|신상정보|신분.*도용|악성코드|랜섬웨어|피싱|스미싱/i.test(title)) return newsTopics[1];
  if (/invest|crypto|ponzi|loan|mortgage|bank|tax|medicare|insurance|투자|금융|대출|코인|은행|세금|보험|메디케어/i.test(title)) return newsTopics[2];
  if (/consumer|refund|shopping|subscription|deceptive|소비자|환불|쇼핑|구독|바가지|결제/i.test(title)) return newsTopics[3];
  return newsTopics[0];
}

export function localizedNews(items: NewsItem[], sources: NewsSource[], locale: Locale) {
  const byId = new Map(sources.map((source) => [source.id, source]));
  return items.filter((item) => byId.has(item.sourceId) && (byId.get(item.sourceId)?.lang ?? 'en') === locale)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

export function featuredNews(items: NewsItem[], limit = 3) {
  const selected: NewsItem[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.sourceId)) continue;
    selected.push(item);
    seen.add(item.sourceId);
    if (selected.length === limit) return selected;
  }
  return [...selected, ...items.filter((item) => !selected.includes(item))].slice(0, limit);
}

export function matchesNewsFilter(searchText: string, category: string, source: string, query: string, activeCategory: string, activeSource: string) {
  const words = query.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const normalized = searchText.normalize('NFKC').toLocaleLowerCase();
  return (!activeCategory || category === activeCategory) && (!activeSource || source === activeSource) && words.every((word) => normalized.includes(word));
}
