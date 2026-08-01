import type { Locale } from '../i18n';

export interface PressPost {
  /** ISO date, e.g. '2026-08-14'. Sorted newest first automatically. */
  date: string;
  title: Record<Locale, string>;
  /** One or two sentences shown on the news page. */
  summary: Record<Locale, string>;
  /** Optional link: a PDF in /public, or an external article. */
  url?: string;
}

/**
 * Consumer Resource Center announcements and press releases.
 * ADD ENTRIES HERE — newest or oldest order does not matter, they are sorted by date.
 *
 * Example:
 * {
 *   date: '2026-08-14',
 *   title: {
 *     en: 'CRC launches Korean-language fraud helpline',
 *     ko: '한인시민센터, 한국어 사기 피해 상담 전화 개설',
 *   },
 *   summary: {
 *     en: 'Starting this month, community members can call the center directly for help filing fraud reports.',
 *     ko: '이번 달부터 신고서 작성이 어려우신 분은 센터로 바로 전화하실 수 있습니다.',
 *   },
 * },
 */
export const pressPosts: PressPost[] = [];

export const sortedPressPosts = [...pressPosts].sort((a, b) => b.date.localeCompare(a.date));
