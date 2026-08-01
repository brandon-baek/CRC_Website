/**
 * Retrieval for the site assistant (src/components/ChatWidget.astro).
 *
 * Plain JS with JSDoc types rather than TS so the exact code that ships to the
 * browser can also be imported directly by Node for testing.
 *
 * Scoring has to serve two very different query shapes:
 *
 *   English — whitespace-separable, so tokens do most of the work, but short
 *     filler words ("do", "me", "the") fuzzy-match into unrelated keywords and
 *     have to be filtered. Keyword containment uses word boundaries so "sec"
 *     does not match inside "security".
 *
 *   Korean — particles glue onto stems ("센터에", "은행에서"), so tokenizing
 *     misses matches that whole-query containment catches. Two-character words
 *     (연락, 은행, 세금, 비용) are meaningful and must not be length-filtered
 *     the way two-character English fragments are, and there are no word
 *     boundaries to anchor on.
 */

/** @typedef {{id:string,kind:string,title:string,url:string,external?:boolean,summary:string,body:string,keywords:string[]}} KbEntry */
/** @typedef {{locale:string,entries:KbEntry[],urgentTriggers:string[],fallbackIds:string[]}} Kb */
/** @typedef {{entry:KbEntry,score:number}} Hit */

/** Filler words that carry no retrieval signal and cause false fuzzy matches. */
const STOPWORDS = new Set([
  'the', 'and', 'for', 'you', 'your', 'yours', 'are', 'was', 'were', 'that', 'this', 'these',
  'those', 'with', 'from', 'have', 'has', 'had', 'but', 'not', 'what', 'when', 'where', 'who',
  'whom', 'why', 'how', 'can', 'did', 'does', 'doing', 'about', 'into', 'then', 'than', 'some',
  'someone', 'somebody', 'something', 'anyone', 'anything', 'get', 'got', 'getting', 'just',
  'out', 'all', 'any', 'also', 'one', 'two', 'say', 'says', 'said', 'tell', 'tells', 'told',
  'will', 'would', 'should', 'could', 'there', 'here', 'been', 'being', 'over', 'very', 'much',
  'many', 'more', 'most', 'other', 'because', 'which', 'while', 'after', 'before', 'now',
  'they', 'them', 'their', 'she', 'her', 'hers', 'him', 'his', 'its', 'our', 'ours',
]);

const HANGUL = /[가-힣]/;

function hasHangul(s) {
  return HANGUL.test(s);
}

/** Shortest run of characters that can carry meaning in each script. */
function minMatchLen(s) {
  return hasHangul(s) ? 2 : 3;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Does `keyword` appear in `query` as a real word?
 * Latin needs word boundaries ("sec" must not match "security"); Korean has no
 * boundaries to anchor to, so plain containment is the only option — and is
 * safe, because Korean keywords here are content words, not fragments.
 */
function containsKeyword(query, keyword) {
  if (hasHangul(keyword)) return query.indexOf(keyword) !== -1;
  return new RegExp('\\b' + escapeRe(keyword) + '\\b').test(query);
}

/**
 * Split a query into scoreable tokens.
 * @param {string} q
 * @returns {string[]}
 */
export function tokenize(q) {
  return q
    .toLowerCase()
    .split(/[^0-9a-z가-힣.]+/)
    .filter((tk) => tk.length > 1 && !STOPWORDS.has(tk));
}

/**
 * @param {KbEntry} entry
 * @param {string} lowerQuery full lowercased query
 * @param {string[]} tokens
 * @returns {number}
 */
export function scoreEntry(entry, lowerQuery, tokens) {
  const title = entry.title.toLowerCase();
  const summary = entry.summary.toLowerCase();
  const body = entry.body.toLowerCase();
  const kws = entry.keywords.map((k) => k.toLowerCase());

  // "strong" = the query actually names this entry (title, keyword, summary).
  // "weak"   = the words merely appear somewhere in its long body text.
  // Body text alone is not evidence — every guide mentions "money" and "call" —
  // so weak points only count for entries that already matched strongly.
  let strong = 0;
  let weak = 0;

  for (const kw of kws) {
    if (kw.length < minMatchLen(kw)) continue;
    if (!containsKeyword(lowerQuery, kw)) continue;

    // Longer, more specific keywords beat shorter ones: "기프트카드" should
    // outrank the "카드" sitting inside it.
    const specificity = Math.min(10, Math.max(0, kw.length - 3));
    const words = kw.split(' ').length;
    const phraseBonus = (words - 1) * 5;
    // A keyword covering most of what was typed is a near-exact intent match
    // ("is this a scam", "정부 기관인가요").
    const coverageBonus = kw.length / Math.max(lowerQuery.length, 1) >= 0.5 ? 18 : 0;

    strong += 7 + specificity + phraseBonus + coverageBonus;
  }

  for (const tk of tokens) {
    // Substring matching needs a token long enough to mean something: "is"
    // otherwise matches inside "Phishing" and invents a hit out of nothing.
    const substrOk = tk.length >= minMatchLen(tk);

    if (substrOk && title.indexOf(tk) !== -1) strong += 8;
    for (const kw of kws) {
      if (kw === tk) {
        strong += 6;
      } else if (
        // Fuzzy substring, but only between single words long enough to be
        // meaningful — otherwise "me" matches "emergency" and "do" matches
        // "what do i do now".
        kw.indexOf(' ') === -1 &&
        tk.length >= minMatchLen(tk) + 1 &&
        kw.length >= minMatchLen(kw) + 1 &&
        (kw.indexOf(tk) !== -1 || tk.indexOf(kw) !== -1)
      ) {
        strong += 3;
      }
    }
    if (substrOk && summary.indexOf(tk) !== -1) strong += 3;
    if (substrOk && body.indexOf(tk) !== -1) weak += 1;
  }

  if (strong <= 0) return 0;
  // Nudge our own pages ahead of near-tied external agencies: when someone asks
  // "where do I report?", the guided helper is a better first stop than
  // dropping them straight onto a federal intake form.
  const kindBonus = entry.kind === 'page' ? 2 : 0;
  return strong + weak + kindBonus;
}

/** Minimum score to be considered a match at all. */
export const MIN_SCORE = 7;

/**
 * @param {Kb|null} kb
 * @param {string} q
 * @returns {Hit[]} best matches, strongest first
 */
export function search(kb, q) {
  if (!kb) return [];
  const lower = q.toLowerCase();
  const tokens = tokenize(q);
  const hits = kb.entries
    .map((entry) => ({ entry, score: scoreEntry(entry, lower, tokens) }))
    .filter((h) => h.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  if (!hits.length) return [];
  // Keep runners-up only if they are in the same league as the top hit, so a
  // confident answer is not padded out with unrelated "also helpful" links.
  const floor = Math.max(MIN_SCORE, hits[0].score * 0.35);
  return hits.filter((h) => h.score >= floor).slice(0, 4);
}

/**
 * Does this message sound like someone is mid-emergency?
 * @param {Kb|null} kb
 * @param {string} q
 * @returns {boolean}
 */
export function isUrgent(kb, q) {
  if (!kb) return false;
  const lower = q.toLowerCase();
  return kb.urgentTriggers.some((t) => lower.indexOf(t.toLowerCase()) !== -1);
}
