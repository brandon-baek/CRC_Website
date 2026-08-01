import { agencies } from '../data/agencies';
import { scamGuides } from '../data/scams';
import { localePath, t, type Locale } from '../i18n';

/**
 * Knowledge base for the site assistant (src/components/ChatWidget.astro).
 *
 * Built at build time from the same data files the pages render from, so the
 * assistant can never drift from the site. It is emitted as a static JSON file
 * per locale by src/pages/chat-kb-[locale].json.ts, which is:
 *   - fetched lazily by the widget the first time a visitor opens it, and
 *   - fetched by functions/api/chat.ts as grounding context for the Claude API.
 *
 * `keywords` deliberately mixes Korean and English terms in BOTH locales:
 * people search "IRS" on the Korean site and type "보이스피싱" on the English one.
 */

export interface KbAction {
  label: string;
  url: string;
  external?: boolean;
}

export interface KbEntry {
  id: string;
  kind: 'page' | 'scam' | 'agency' | 'topic';
  title: string;
  url: string;
  external?: boolean;
  /** One or two sentences, shown directly in the chat answer. */
  summary: string;
  /** Fuller text: matched against, and given to the AI as context. */
  body: string;
  keywords: string[];
  actions?: KbAction[];
}

export interface ChatKb {
  locale: Locale;
  entries: KbEntry[];
  /** Substrings that mean "this person may be mid-emergency". */
  urgentTriggers: string[];
  /** Shown when nothing matches. */
  fallbackIds: string[];
}

/** Cross-language search terms per scam guide, keyed by slug. */
const scamKeywords: Record<string, string[]> = {
  phishing: [
    'phishing', 'smishing', 'text', 'sms', 'message', 'email', 'link', 'package', 'delivery',
    'usps', 'ups', 'fedex', 'amazon', 'bank alert', 'account locked', 'verify',
    '피싱', '스미싱', '문자', '이메일', '링크', '택배', '배송', '가짜 문자', '문자 사기', '계정 잠김',
  ],
  'government-impersonation': [
    'government', 'impersonation', 'irs', 'ssa', 'social security', 'medicare', 'police',
    'arrest', 'warrant', 'deportation', 'immigration', 'ice', 'court', 'fine', 'badge',
    '정부 사칭', '사칭', '국세청', '사회보장국', '소셜', '메디케어', '경찰', '체포', '영장',
    '이민국', '추방', '법원', '벌금', '공무원',
  ],
  'family-emergency': [
    'family', 'emergency', 'grandparent', 'grandchild', 'grandson', 'granddaughter', 'son',
    'daughter', 'bail', 'kidnap', 'accident', 'jail', 'voice', 'ai voice', 'cloned',
    '가족 사칭', '납치', '보이스피싱', '손주', '손자', '자녀', '아들', '딸', '사고', '보석금',
    '유치장', '목소리', '음성 복제',
  ],
  'investment-crypto': [
    'investment', 'invest', 'crypto', 'cryptocurrency', 'bitcoin', 'coin', 'trading', 'forex',
    'ponzi', 'guaranteed', 'returns', 'profit', 'pig butchering', 'broker', 'wallet', 'stock',
    '투자', '암호화폐', '가상화폐', '코인', '비트코인', '리딩방', '폰지', '수익 보장', '선물 거래',
    '주식', '지갑', '거래소',
  ],
  'romance-scams': [
    'romance', 'dating', 'love', 'relationship', 'girlfriend', 'boyfriend', 'online date',
    'match', 'lonely', 'met online',
    '로맨스', '연애', '데이팅', '사랑', '온라인 만남', '소개팅', '여자친구', '남자친구', '애인',
  ],
  'tech-support': [
    'tech support', 'technical support', 'computer', 'laptop', 'virus', 'malware', 'popup',
    'pop-up', 'microsoft', 'apple', 'remote access', 'anydesk', 'teamviewer', 'refund',
    '기술 지원', '테크 서포트', '컴퓨터', '노트북', '바이러스', '팝업', '원격 접속',
    '마이크로소프트', '애플', '수리',
  ],
  'identity-theft': [
    'identity', 'identity theft', 'ssn', 'social security number', 'credit', 'credit report',
    'credit freeze', 'fraud alert', 'account opened', 'stolen identity', 'my name', 'dmv',
    '신분 도용', '명의 도용', '개인정보 도용', '소셜 번호', '주민번호', '크레딧', '신용 보고',
    '신용 동결', '내 이름으로',
  ],
  'online-shopping': [
    'shopping', 'online store', 'website', 'marketplace', 'facebook marketplace', 'ebay',
    'fake store', 'never arrived', 'never shipped', 'counterfeit', 'seller', 'order',
    '온라인 쇼핑', '쇼핑몰', '중고 거래', '당근', '가짜 사이트', '배송 안', '물건이 안', '짝퉁',
    '판매자', '주문',
  ],
  'job-scams': [
    'job', 'jobs', 'employment', 'work from home', 'hiring', 'recruiter', 'interview',
    'offer', 'reshipping', 'task', 'paycheck', 'overpayment', 'check',
    '구인', '구직', '취업', '재택근무', '알바', '아르바이트', '채용', '면접', '입금', '수표',
  ],
  'mail-lottery': [
    'mail', 'letter', 'lottery', 'sweepstakes', 'prize', 'won', 'winner', 'publishers clearing',
    'check', 'envelope', 'postcard', 'inheritance',
    '우편', '편지', '복권', '경품', '당첨', '상금', '수표', '봉투', '엽서', '유산', '상속',
  ],
};

/** Cross-language search terms per agency, keyed by agency id. */
const agencyKeywords: Record<string, string[]> = {
  usagov: ['usa.gov', 'usagov', 'not sure', 'where do i report', 'router', '어디에 신고', '모르겠'],
  ftc: ['ftc', 'reportfraud', 'federal trade commission', 'consumer sentinel', '연방거래위원회', '소비자 사기'],
  idtheft: ['identitytheft.gov', 'identity theft report', 'recovery plan', '신분 도용 신고서', '회복 계획'],
  ic3: ['ic3', 'fbi', 'internet crime', 'cyber', 'ransomware', 'bec', '인터넷 범죄', '사이버', '연방수사국'],
  cfpb: ['cfpb', 'bank', 'credit card', 'loan', 'mortgage', 'debt collection', 'credit bureau',
    '은행', '카드', '대출', '모기지', '채권 추심', '소비자금융보호국'],
  sec: ['sec', 'securities', 'whistleblower', 'tcr', '증권거래위원회', '증권', '내부고발'],
  irs: ['irs', 'tax', 'taxes', 'return', 'preparer', '국세청', '세금', '탈세', '세무'],
  'ssa-oig': ['ssa', 'social security', 'oig', 'benefits', 'payee', '사회보장국', '소셜', '연금', '감찰관'],
  'hhs-oig': ['hhs', 'medicare', 'medicaid', 'health', 'billing', 'kickback', '메디케어', '메디케이드', '보건', '의료비'],
  uspis: ['uspis', 'postal', 'usps', 'mail fraud', 'post office', '우정 감찰국', '우편', '우체국'],
  oversight: ['oversight.gov', 'inspector general', 'federal agency', 'waste', 'grant', '감찰관실', '연방 기관', '보조금'],
  'ca-ag': ['california', 'attorney general', 'oag', 'state', 'business complaint',
    '캘리포니아', '법무장관', '주정부', '업체 민원'],
};

export function buildKb(locale: Locale): ChatKb {
  const d = t(locale);
  const p = (path: string) => localePath(locale, path);
  const entries: KbEntry[] = [];

  /* ---------- Site pages (navigation intents) ---------- */
  entries.push(
    {
      id: 'page-get-help',
      kind: 'page',
      title: d.wizard.pageTitle,
      url: p('/get-help'),
      summary: d.wizard.pageLede,
      body: [d.wizard.pageLede, d.wizard.resultIntro, d.home.how1Body, d.home.how2Body, d.home.how3Body].join(' '),
      keywords: [
        'report', 'where to report', 'where do i report', 'file a report', 'help', 'guided',
        'wizard', 'questions', 'which agency', 'who do i call', 'what do i do',
        '신고', '어디에 신고', '신고처', '도움', '도와', '안내', '어떻게 해야', '어느 기관',
      ],
      actions: [{ label: d.hero.ctaPrimary, url: p('/get-help') }],
    },
    {
      id: 'page-directory',
      kind: 'page',
      title: d.directory.pageTitle,
      url: p('/directory'),
      summary: d.directory.pageLede,
      body: [d.directory.pageLede, d.directory.official].join(' '),
      keywords: [
        'directory', 'list', 'all agencies', 'agencies', 'search', 'browse', 'every',
        'government agency', 'official',
        '목록', '전체', '기관', '검색', '찾아보기', '정부 기관', '공식',
      ],
      actions: [{ label: d.home.dirCta, url: p('/directory') }],
    },
    {
      id: 'page-learn',
      kind: 'page',
      title: d.learn.pageTitle,
      url: p('/learn'),
      summary: d.learn.pageLede,
      body: [d.learn.pageLede, d.home.what2Body].join(' '),
      keywords: [
        'learn', 'guides', 'education', 'scam types', 'how scams work', 'warning signs',
        'prevent', 'protect', 'avoid',
        '교육', '가이드', '사기 수법', '예방', '경고 신호', '보호', '피하는 법', '알아보기',
      ],
      actions: [{ label: d.home.learnMore, url: p('/learn') }],
    },
    {
      id: 'page-contact',
      kind: 'page',
      title: d.contact.pageTitle,
      url: p('/contact'),
      summary: d.contact.pageLede,
      body: [d.contact.pageLede, d.contact.comingSoonBody, d.wizard.needHelp, d.home.what3Body].join(' '),
      keywords: [
        'contact', 'phone', 'call', 'email', 'talk to a person', 'talk to someone', 'staff',
        'speak', 'human', 'appointment', 'help me file', 'korean speaker',
        '연락', '전화', '이메일', '문의', '상담', '직원', '사람', '통화', '예약', '한국어',
      ],
      actions: [{ label: d.wizard.contactCta, url: p('/contact') }],
    },
    {
      id: 'page-about',
      kind: 'page',
      title: d.about.pageTitle,
      url: p('/about'),
      summary: d.about.missionBody2,
      body: [d.about.missionTitle, d.about.missionBody1, d.about.missionBody2, d.about.whoBody].join(' '),
      keywords: [
        'about', 'who are you', 'mission', 'organization', 'location', 'address', 'hours',
        'visit', 'office', 'team', 'nonprofit',
        '소개', '누구', '사명', '단체', '위치', '주소', '운영 시간', '방문', '사무실', '팀', '비영리',
      ],
      actions: [{ label: d.about.pageTitle, url: p('/about') }],
    },
    {
      id: 'page-home',
      kind: 'page',
      title: `${d.siteName} · ${d.siteNameKo}`,
      url: p('/'),
      summary: d.hero.lede,
      body: [d.hero.lede, d.tagline, d.home.what1Body, d.home.what2Body, d.home.what3Body].join(' '),
      keywords: ['home', 'start', 'main page', 'homepage', '홈', '처음', '메인', '시작'],
      actions: [{ label: d.nav.home, url: p('/') }],
    },
  );

  /* ---------- Scam guides ---------- */
  for (const g of scamGuides) {
    entries.push({
      id: `scam-${g.slug}`,
      kind: 'scam',
      title: g.title[locale],
      url: p(`/learn/${g.slug}`),
      summary: g.tagline[locale],
      body: [
        g.what[locale],
        `${d.learn.warning}: ${g.warningSigns[locale].join(' ')}`,
        `${d.learn.protect}: ${g.protect[locale].join(' ')}`,
        `${d.learn.ifHappened}: ${g.ifHappened[locale].join(' ')}`,
      ].join('\n'),
      keywords: [
        g.slug,
        ...g.slug.split('-'),
        ...g.title.en.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2),
        ...g.title.ko.split(/[^가-힣]+/).filter(Boolean),
        ...(scamKeywords[g.slug] ?? []),
      ],
      actions: [
        { label: d.learn.readGuide, url: p(`/learn/${g.slug}`) },
        ...g.reportTo.slice(0, 1).map((id) => {
          const a = agencies.find((x) => x.id === id);
          return { label: a ? a.name[locale] : d.learn.whereReport, url: a?.url ?? p('/directory'), external: !!a };
        }),
      ],
    });
  }

  /* ---------- Reporting agencies ---------- */
  for (const a of agencies) {
    entries.push({
      id: `agency-${a.id}`,
      kind: 'agency',
      title: a.name[locale],
      url: a.url,
      external: true,
      summary: a.bestFor[locale],
      body: `${a.bestFor[locale]}\n${d.wizard.whatToExpect}: ${a.intake[locale]}`,
      keywords: [
        a.id,
        ...a.id.split('-'),
        ...a.name.en.toLowerCase().split(/[^a-z0-9.]+/).filter((w) => w.length > 2),
        ...a.categories.map((c) => d.categories[c].toLowerCase()),
        ...a.categories.map((c) => c),
        ...(agencyKeywords[a.id] ?? []),
      ],
      actions: [
        { label: d.wizard.visit, url: a.url, external: true },
        { label: d.wizard.seeAll, url: p('/directory') },
      ],
    });
  }

  /* ---------- Short answers to questions people actually ask ---------- */
  entries.push(
    {
      id: 'topic-gift-cards',
      kind: 'topic',
      title: d.home.rule2Title,
      url: p('/'),
      summary: d.home.rule2Body,
      body: d.home.rule2Body,
      keywords: [
        'gift card', 'gift cards', 'itunes', 'google play', 'target card', 'wire transfer',
        'wire', 'zelle', 'venmo', 'cash app', 'bitcoin atm', 'pay by', 'how to pay',
        '기프트카드', '상품권', '기프트 카드', '송금', '전신 송금', '비트코인 atm', '결제 요구',
      ],
      actions: [{ label: d.hero.ctaSecondary, url: p('/learn') }],
    },
    {
      id: 'topic-slow-down',
      kind: 'topic',
      title: d.home.rule1Title,
      url: p('/'),
      summary: d.home.rule1Body,
      body: `${d.home.rule1Body} ${d.home.rulesSub}`,
      keywords: [
        'urgent', 'hurry', 'pressure', 'right now', 'immediately', 'threat', 'threatening',
        'scared', 'deadline', '24 hours',
        '급하게', '서두르', '협박', '지금 당장', '무섭', '겁이', '마감', '시간 안에',
      ],
      actions: [{ label: d.hero.ctaSecondary, url: p('/learn') }],
    },
    {
      id: 'topic-verify',
      kind: 'topic',
      title: d.home.rule3Title,
      url: p('/'),
      summary: d.home.rule3Body,
      body: d.home.rule3Body,
      keywords: [
        'is this real', 'is it a scam', 'is this a scam', 'legit', 'legitimate', 'verify',
        'check if', 'fake', 'real or fake', 'suspicious',
        '진짜인가요', '사기인가요', '사기 맞나요', '확인', '진짜', '가짜', '의심',
      ],
      actions: [{ label: d.hero.ctaPrimary, url: p('/get-help') }],
    },
    {
      id: 'topic-who-we-are',
      kind: 'topic',
      title: d.about.whoTitle,
      url: p('/about'),
      summary: d.about.whoBody,
      body: `${d.about.whoBody} ${d.footer.disclaimer}`,
      keywords: [
        'are you the government', 'are you a government agency', 'are you the government agency',
        'government agency', 'lawyer', 'legal advice', 'attorney', 'do you investigate',
        'police', 'who are you', 'what are you', 'nonprofit',
        '정부 기관인가요', '정부 기관', '변호사', '법률 자문', '수사', '누구세요', '비영리',
      ],
      actions: [{ label: d.about.pageTitle, url: p('/about') }],
    },
    {
      id: 'topic-free',
      kind: 'topic',
      title: d.directory.pageTitle,
      url: p('/directory'),
      summary: d.directory.official,
      body: d.directory.official,
      keywords: [
        'cost', 'cost to report', 'fee', 'how much', 'pay to report', 'recovery service',
        'get my money back', 'refund', 'recover money', 'charge', 'is it free',
        '비용', '신고 비용', '비용이 드나요', '돈이 드나요', '신고 수수료', '얼마', '신고 대행',
        '피해금 회수', '돈을 돌려', '환불', '무료인가요', '무료',
      ],
      actions: [{ label: d.home.dirCta, url: p('/directory') }],
    },
    {
      id: 'topic-language',
      kind: 'topic',
      title: d.home.what3Title,
      url: p('/contact'),
      summary: d.home.what3Body,
      body: `${d.home.what3Body} ${d.wizard.needHelp}`,
      keywords: [
        'korean', 'english', 'language', 'translate', 'interpreter', 'speak korean',
        '한국어', '영어', '언어', '통역', '번역', '한국말',
      ],
      actions: [{ label: d.wizard.contactCta, url: p('/contact') }],
    },
    {
      id: 'topic-privacy',
      kind: 'topic',
      title: d.wizard.pageTitle,
      url: p('/get-help'),
      summary: d.wizard.pageLede,
      body: `${d.wizard.pageLede} ${d.contact.messageHint}`,
      keywords: [
        'privacy', 'personal information', 'anonymous', 'do you store', 'data', 'safe to use',
        '개인정보', '익명', '저장', '데이터', '안전한가요', '수집',
      ],
      actions: [{ label: d.hero.ctaPrimary, url: p('/get-help') }],
    },
    {
      id: 'topic-lost-money',
      kind: 'topic',
      title: d.wizard.lossTitle,
      url: p('/get-help'),
      summary: d.wizard.lossIntro,
      body: [
        d.wizard.lossIntro,
        `1. ${d.wizard.loss1Title} — ${d.wizard.loss1Body}`,
        `2. ${d.wizard.loss2Title} — ${d.wizard.loss2Body}`,
        `3. ${d.wizard.loss3Title} — ${d.wizard.loss3Body}`,
        `4. ${d.wizard.loss4Title} — ${d.wizard.loss4Body}`,
      ].join('\n'),
      keywords: [
        'lost money', 'sent money', 'i paid', 'i sent', 'wired money', 'they took', 'stolen',
        'just happened', 'what do i do now', 'emergency', 'freeze',
        '돈을 보냈', '송금했', '피해를 입었', '털렸', '당했어요', '어떡하죠', '방금', '동결',
      ],
      actions: [
        { label: d.hero.ctaPrimary, url: p('/get-help') },
        { label: d.wizard.contactCta, url: p('/contact') },
      ],
    },
  );

  return {
    locale,
    entries,
    urgentTriggers: [
      // English — phrases that mean money or data has already moved.
      'lost money', 'sent money', 'sent them', 'sent him', 'sent her', 'i sent', 'i paid',
      'paid them', 'paid him', 'paid her', 'gave them', 'gave him', 'gave her', 'transferred',
      'deposited', 'wired', 'wire transfer', 'gift card', 'zelle', 'venmo', 'cash app',
      'bitcoin', 'they have my', 'gave out my', 'social security number', 'my ssn',
      'bank account', 'my account', 'hacked', 'remote access', 'took over', 'stole', 'stolen',
      'scammed me', 'help me',
      // Korean
      '돈을 보냈', '돈을 부쳤', '송금', '입금했', '이체했', '기프트카드', '상품권', '해킹', '털렸',
      '당했어요', '당했습니다', '사기당', '계좌', '소셜번호', '주민번호', '개인정보를 알려',
      '알려줬', '원격', '도와주세요',
    ],
    fallbackIds: ['page-get-help', 'page-directory', 'page-learn', 'page-contact'],
  };
}
