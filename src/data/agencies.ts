import type { Locale } from '../i18n';

export type CategoryId =
  | 'general'
  | 'identity'
  | 'online'
  | 'banking'
  | 'investment'
  | 'tax'
  | 'benefits'
  | 'mail'
  | 'business'
  | 'government'
  | 'california';

export interface Agency {
  id: string;
  url: string;
  categories: CategoryId[];
  name: Record<Locale, string>;
  /**
   * The acronyms in `name`, written out. Shown under the name on every agency
   * card, so "FTC" or "IC3" always appears next to what it actually stands for.
   * Omitted where the name has no acronym to expand; an empty string for one
   * locale where that language's name already spells it out in full.
   */
  fullName?: Record<Locale, string>;
  /** Short "best used for" line, from the planning table. */
  bestFor: Record<Locale, string>;
  /** What the intake asks for and what happens after filing. */
  intake: Record<Locale, string>;
}

/**
 * Single source of truth for fraud reporting places.
 * Used by both the directory page and the get-help wizard, so the
 * routing logic and the listings never diverge.
 */
export const agencies: Agency[] = [
  {
    id: 'usagov',
    url: 'https://www.usa.gov/where-report-scams',
    categories: ['general'],
    name: {
      en: 'USA.gov Scam Reporting Tool',
      ko: 'USA.gov 사기 신고 안내 도구',
    },
    bestFor: {
      en: 'Anyone who does not know where to report a scam.',
      ko: '어디에 신고해야 할지 모르는 모든 분.',
    },
    intake: {
      en: 'A short decision tree based on where the scam occurred and its category. It routes you to the right agency rather than collecting the final report itself.',
      ko: '사기가 발생한 장소와 유형에 따라 몇 가지 질문을 거쳐 알맞은 기관으로 안내합니다. 이 도구 자체는 최종 신고서를 접수하지 않습니다.',
    },
  },
  {
    id: 'ftc',
    url: 'https://reportfraud.ftc.gov',
    categories: ['general', 'business', 'online'],
    name: {
      en: 'FTC ReportFraud.gov',
      ko: 'FTC ReportFraud.gov',
    },
    fullName: {
      en: 'Federal Trade Commission',
      ko: '연방거래위원회 (Federal Trade Commission)',
    },
    bestFor: {
      en: 'General scams, deceptive businesses, impersonation, unwanted calls, and consumer fraud.',
      ko: '일반 사기, 기만적인 업체, 사칭, 스팸 전화, 소비자 사기 전반.',
    },
    intake: {
      en: 'Collects the scam category, payment and loss details, suspect information, and your story; reporter details are optional. You get a report number and tailored next steps. Reports feed the Consumer Sentinel law-enforcement database; the FTC generally does not resolve individual cases.',
      ko: '사기 유형, 결제·피해 내역, 용의자 정보, 사건 경위를 입력합니다(신고자 정보는 선택). 신고 번호와 맞춤 안내를 받게 되며, 신고 내용은 법 집행기관이 사용하는 Consumer Sentinel 데이터베이스에 반영됩니다. 다만 FTC가 개별 사건을 직접 해결해 주지는 않습니다.',
    },
  },
  {
    id: 'idtheft',
    url: 'https://www.identitytheft.gov',
    categories: ['identity'],
    name: {
      en: 'FTC IdentityTheft.gov',
      ko: 'FTC IdentityTheft.gov (신분 도용)',
    },
    fullName: {
      en: 'Federal Trade Commission',
      ko: '연방거래위원회 (Federal Trade Commission)',
    },
    bestFor: {
      en: 'Fraud involving misuse of your identity: SSN, accounts, or cards opened in your name.',
      ko: '신분 도용 피해: 내 이름으로 개설된 계좌·카드, SSN 도용 등.',
    },
    intake: {
      en: 'Produces an official FTC Identity Theft Report and a personalized recovery plan. Creating an account lets you track recovery tasks and generate pre-filled letters and forms.',
      ko: '공식 FTC 신분 도용 신고서(Identity Theft Report)와 맞춤 회복 계획을 만들어 줍니다. 계정을 만들면 회복 절차를 단계별로 관리하고, 미리 작성된 서한과 양식을 출력할 수 있습니다.',
    },
  },
  {
    id: 'ic3',
    url: 'https://www.ic3.gov',
    categories: ['online', 'investment'],
    name: {
      en: 'FBI Internet Crime Complaint Center (IC3)',
      ko: 'FBI 인터넷범죄신고센터 (IC3)',
    },
    fullName: {
      // The English name already spells out IC3; only the FBI needs expanding.
      en: 'Federal Bureau of Investigation',
      ko: '연방수사국 인터넷범죄신고센터 (Federal Bureau of Investigation)',
    },
    bestFor: {
      en: 'Cybercrime, online scams, ransomware, business email compromise, cryptocurrency fraud, and internet-enabled financial crime.',
      ko: '사이버 범죄, 온라인 사기, 랜섬웨어, 업무 이메일 침해(BEC), 암호화폐 사기 등 인터넷 관련 금융 범죄.',
    },
    intake: {
      en: 'A detailed seven-part law-enforcement intake covering you, transactions, suspects, the incident narrative, and other agency reports. Analysts review and forward reports to the right agencies, but IC3 does not provide investigation status updates.',
      ko: '신고인, 거래 내역, 용의자, 사건 경위, 타 기관 신고 여부 등 7개 항목으로 이루어진 상세한 수사기관용 신고서입니다. 분석관이 검토 후 해당 기관에 전달하지만, 수사 진행 상황은 별도로 알려주지 않습니다.',
    },
  },
  {
    id: 'cfpb',
    url: 'https://www.consumerfinance.gov/complaint/',
    categories: ['banking'],
    name: {
      en: 'CFPB Consumer Complaint Portal',
      ko: 'CFPB 민원 포털',
    },
    fullName: {
      en: 'Consumer Financial Protection Bureau',
      ko: '소비자금융보호국 (Consumer Financial Protection Bureau)',
    },
    bestFor: {
      en: 'Problems with banks, cards, credit reporting, debt collection, loans, mortgages, money transfers, or virtual currency services.',
      ko: '은행, 카드, 신용 보고, 채권 추심, 대출, 모기지, 송금, 가상화폐 서비스 관련 문제.',
    },
    intake: {
      en: 'A comparatively closed-loop process: the CFPB screens your complaint and sends it to the company, provides status updates, and lets you review the response. Companies generally respond within 15 days, with up to 60 days for a final response.',
      ko: '비교적 결과를 확인할 수 있는 절차입니다. CFPB가 민원을 검토해 해당 회사에 전달하고, 진행 상황을 알려주며, 회사의 답변을 직접 확인할 수 있습니다. 회사는 보통 15일 이내에 답변하며, 최종 답변은 최대 60일까지 걸릴 수 있습니다.',
    },
  },
  {
    id: 'sec',
    url: 'https://www.sec.gov/tcr',
    categories: ['investment'],
    name: {
      en: 'SEC Tips, Complaints and Referrals',
      ko: 'SEC 제보·민원 접수',
    },
    fullName: {
      en: 'Securities and Exchange Commission',
      ko: '증권거래위원회 (Securities and Exchange Commission)',
    },
    bestFor: {
      en: 'Investment fraud, Ponzi schemes, insider trading, market manipulation, and securities violations.',
      ko: '투자 사기, 폰지 사기, 내부자 거래, 시세 조종 등 증권 관련 위법 행위.',
    },
    intake: {
      en: 'Accepts confidential tips and whistleblower submissions and generates a submission number. Anonymous whistleblowers seeking an award must file through an attorney.',
      ko: '비공개 제보와 내부고발을 접수하고 접수 번호를 발급합니다. 익명으로 포상금을 신청하려면 변호사를 통해 제출해야 합니다.',
    },
  },
  {
    id: 'irs',
    url: 'https://www.irs.gov/help/tax-scams/report-a-tax-scam-or-fraud',
    categories: ['tax'],
    name: {
      en: 'IRS Report Fraud',
      ko: 'IRS 사기 신고',
    },
    fullName: {
      en: 'Internal Revenue Service',
      ko: '국세청 (Internal Revenue Service)',
    },
    bestFor: {
      en: 'Tax evasion, fraudulent returns, tax preparer misconduct, IRS impersonation, and tax-related identity theft.',
      ko: '탈세, 허위 세금 신고, 세무 대리인 비위, IRS 사칭, 세금 관련 신분 도용.',
    },
    intake: {
      en: 'An initial routing questionnaire directs you to the correct form or reporting method. The IRS now offers this as a single consolidated entry point for reporting tax scams and fraud.',
      ko: '몇 가지 질문을 통해 알맞은 양식과 신고 방법으로 안내합니다. IRS가 세금 관련 사기 신고를 한곳에서 접수하도록 마련한 통합 창구입니다.',
    },
  },
  {
    id: 'ssa-oig',
    url: 'https://oig.ssa.gov/report/',
    categories: ['benefits'],
    name: {
      en: 'SSA Office of Inspector General (OIG)',
      ko: 'SSA 감찰관실 (OIG)',
    },
    fullName: {
      en: 'Social Security Administration — Office of the Inspector General',
      ko: '사회보장국 감찰관실 (Social Security Administration, Office of the Inspector General)',
    },
    bestFor: {
      en: 'Social Security benefit fraud, SSN misuse, representative-payee fraud, and SSA impersonation scams.',
      ko: '소셜시큐리티 연금 사기, SSN 오남용, 수령 대리인 사기, SSA 사칭 사기.',
    },
    intake: {
      en: 'Separates fraud against SSA programs from scams impersonating the SSA. Reports may be anonymous or confidential. The OIG may investigate, refer, or close a report, but does not provide status updates.',
      ko: 'SSA 프로그램에 대한 사기와 SSA를 사칭하는 사기를 구분해 접수합니다. 익명 또는 비공개 신고가 가능합니다. OIG는 조사·이관·종결 여부를 결정하지만 진행 상황을 알려주지는 않습니다.',
    },
  },
  {
    id: 'hhs-oig',
    url: 'https://oig.hhs.gov/fraud/report-fraud/',
    categories: ['benefits'],
    name: {
      en: 'HHS Office of Inspector General (OIG)',
      ko: 'HHS 감찰관실 (OIG)',
    },
    fullName: {
      en: 'Department of Health and Human Services — Office of the Inspector General',
      ko: '보건복지부 감찰관실 (Department of Health and Human Services, Office of the Inspector General)',
    },
    bestFor: {
      en: 'Medicare, Medicaid, healthcare billing fraud, HHS grants or contracts, kickbacks, and program abuse.',
      ko: '메디케어·메디케이드 사기, 의료비 부정 청구, HHS 보조금·계약 비리, 리베이트.',
    },
    intake: {
      en: 'Requests involved parties, dates, scope, witnesses, your narrative, and supporting evidence. It is an investigative hotline, not a way to get refunds or resolve personal benefits disputes.',
      ko: '관련자, 날짜, 규모, 증인, 사건 경위, 증빙 자료를 입력합니다. 수사용 핫라인이며, 환불을 받거나 개인 혜택 분쟁을 해결하는 창구는 아닙니다.',
    },
  },
  {
    id: 'uspis',
    url: 'https://www.uspis.gov/report',
    categories: ['mail'],
    name: {
      en: 'U.S. Postal Inspection Service (USPIS)',
      ko: '미국 우정 감찰국 (USPIS)',
    },
    fullName: {
      // Already written out in the English name; only Korean needs the English.
      en: '',
      ko: 'United States Postal Inspection Service',
    },
    bestFor: {
      en: 'Mail fraud, lottery and sweepstakes scams, fraudulent mailings, mail theft, and fraudulent address changes.',
      ko: '우편 사기, 복권·경품 당첨 사기, 사기성 우편물, 우편물 절도, 무단 주소 변경.',
    },
    intake: {
      en: 'Routes you into separate forms by postal offense. Note: misconduct by a USPS employee belongs with the USPS OIG instead.',
      ko: '우편 범죄 유형별로 각각의 신고 양식으로 안내합니다. 참고: USPS 직원의 비위 행위는 USPS OIG(감찰실)에 신고해야 합니다.',
    },
  },
  {
    id: 'oversight',
    url: 'https://www.oversight.gov/hotline',
    categories: ['government'],
    name: {
      en: 'Oversight.gov Reporting Router',
      ko: 'Oversight.gov 연방기관 신고 안내',
    },
    bestFor: {
      en: 'Fraud, waste, abuse, or contract/grant wrongdoing involving federal agencies.',
      ko: '연방 기관 관련 사기·낭비·비리, 계약 및 보조금 부정.',
    },
    intake: {
      en: 'Routes disclosures to the appropriate agency Inspector General and separately handles whistleblower-retaliation routing. Primarily a jurisdiction finder.',
      ko: '제보를 해당 연방 기관의 감찰관실(IG)로 연결하고, 내부고발자 보복 신고는 별도로 처리합니다. 주로 관할 기관을 찾아주는 역할을 합니다.',
    },
  },
  {
    id: 'ca-ag',
    url: 'https://oag.ca.gov/contact/consumer-complaint-against-business-or-company',
    categories: ['california', 'business'],
    name: {
      en: 'California Attorney General Consumer Complaint',
      ko: '캘리포니아 법무장관실 소비자 민원',
    },
    bestFor: {
      en: 'California complaints against businesses not regulated by a more specialized agency.',
      ko: '별도의 전문 규제 기관이 없는 캘리포니아 내 업체에 대한 민원.',
    },
    intake: {
      en: 'Collects your and the business’s information, disputed amount, desired resolution, prior contacts, narrative, and up to five documents. The office may refer complaints or use them to identify patterns, but does not act as your attorney.',
      ko: '신고인과 업체 정보, 분쟁 금액, 희망하는 해결 방안, 이전 연락 내역, 사건 경위, 최대 5개의 증빙 서류를 접수합니다. 민원을 이관하거나 피해 패턴 파악에 활용할 수 있지만, 개인의 변호사 역할을 하지는 않습니다.',
    },
  },
];

export const agencyById = new Map(agencies.map((a) => [a.id, a]));
