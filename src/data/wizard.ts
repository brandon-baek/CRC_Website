import type { Locale } from '../i18n';

/**
 * Guided-help decision tree.
 *
 * Kept as plain data so the future AI assistant can return the same
 * `WizardResult` shape from a Cloudflare Pages Function and plug into
 * the identical results UI.
 */

export interface WizardResult {
  /** Agency ids from agencies.ts; first id is the "start here" pick. */
  agencies: string[];
  note: Record<Locale, string>;
}

export interface WizardOption {
  label: Record<Locale, string>;
  /** Either advance to another question... */
  next?: string;
  /** ...or land on a result. */
  result?: WizardResult;
}

export interface WizardNode {
  id: string;
  question: Record<Locale, string>;
  options: WizardOption[];
}

export const wizardStart = 'start';

export const wizardNodes: WizardNode[] = [
  {
    id: 'start',
    question: {
      en: 'What do you need help with?',
      ko: '어떤 일로 도움이 필요하신가요?',
    },
    options: [
      {
        label: {
          en: 'Someone stole my identity or personal information',
          ko: '신분(개인정보)을 도용당했습니다',
        },
        result: {
          agencies: ['idtheft', 'ftc'],
          note: {
            en: 'Start at IdentityTheft.gov. It creates your official Identity Theft Report and a step-by-step recovery plan. Also place a fraud alert with a credit bureau as soon as you can.',
            ko: 'IdentityTheft.gov에서 시작하세요. 공식 신분 도용 신고서와 단계별 회복 계획을 만들어 줍니다. 가능한 한 빨리 신용평가사에 사기 경보(fraud alert)도 등록하세요.',
          },
        },
      },
      {
        label: {
          en: 'I lost money in a scam or fraud',
          ko: '사기로 금전 피해를 입었습니다',
        },
        next: 'how',
      },
      {
        label: {
          en: 'A problem with a bank, credit card, loan, or credit report',
          ko: '은행·카드·대출·신용 보고 관련 문제가 있습니다',
        },
        result: {
          agencies: ['cfpb', 'ftc'],
          note: {
            en: 'The CFPB complaint process is one of the few where you get status updates and see the company’s response, usually within 15 days.',
            ko: 'CFPB 민원은 진행 상황을 확인하고 회사의 답변(보통 15일 이내)까지 볼 수 있는 몇 안 되는 절차입니다.',
          },
        },
      },
      {
        label: {
          en: 'Suspicious calls, texts, or emails (no money lost yet)',
          ko: '의심스러운 전화·문자·이메일을 받았습니다 (아직 피해는 없음)',
        },
        next: 'impersonation',
      },
      {
        label: {
          en: 'I’m not sure where to start',
          ko: '어디서부터 시작해야 할지 모르겠습니다',
        },
        result: {
          agencies: ['usagov', 'ftc'],
          note: {
            en: 'The USA.gov tool asks a few questions and routes you to the right agency. When in doubt, filing with the FTC is always a safe first step. You can also contact us and we will help you figure it out.',
            ko: 'USA.gov 도구가 몇 가지 질문으로 알맞은 기관을 찾아줍니다. 잘 모르겠다면 FTC에 신고하는 것이 언제나 안전한 첫걸음입니다. 저희 센터에 연락 주셔도 함께 찾아드립니다.',
          },
        },
      },
    ],
  },
  {
    id: 'how',
    question: {
      en: 'How did the scam happen?',
      ko: '사기가 어떤 방식으로 일어났나요?',
    },
    options: [
      {
        label: {
          en: 'Online: email, website, social media, or payment app',
          ko: '온라인: 이메일, 웹사이트, SNS, 결제 앱',
        },
        result: {
          agencies: ['ic3', 'ftc'],
          note: {
            en: 'For any internet-enabled fraud, file with the FBI’s IC3. Analysts forward reports to the right investigators. Filing with the FTC too helps regulators spot patterns.',
            ko: '인터넷을 통한 사기는 FBI의 IC3에 신고하세요. 분석관이 신고를 담당 수사기관에 전달합니다. FTC에도 함께 신고하면 당국이 피해 패턴을 파악하는 데 도움이 됩니다.',
          },
        },
      },
      {
        label: {
          en: 'An investment, cryptocurrency, or "guaranteed return" opportunity',
          ko: '투자·암호화폐·"수익 보장" 제안',
        },
        result: {
          agencies: ['sec', 'ic3', 'ftc'],
          note: {
            en: 'Report securities and investment fraud to the SEC. If crypto or the internet was involved (it usually is), also file with IC3.',
            ko: '증권·투자 사기는 SEC에 신고하세요. 암호화폐나 인터넷이 관련되었다면(대부분 그렇습니다) IC3에도 함께 신고하세요.',
          },
        },
      },
      {
        label: {
          en: 'A phone call from someone pretending to be the government or a company',
          ko: '정부 기관이나 회사를 사칭하는 전화',
        },
        next: 'impersonation',
      },
      {
        label: {
          en: 'An urgent call about a family member in trouble',
          ko: '가족이 위급하다는 다급한 전화',
        },
        result: {
          agencies: ['ftc', 'ic3'],
          note: {
            en: 'Family-emergency calls are impersonation scams, sometimes using AI-cloned voices. Report to the FTC, and to IC3 if you paid online. Before anything else, call your family member directly on their real number.',
            ko: '가족 위급 전화는 사칭 사기이며, 요즘은 AI로 목소리까지 복제합니다. FTC에 신고하시고, 온라인으로 돈을 보냈다면 IC3에도 신고하세요. 무엇보다 먼저, 그 가족의 실제 번호로 직접 전화해 확인하세요.',
          },
        },
      },
      {
        label: {
          en: 'Through the mail: lottery, sweepstakes, or fake mailings',
          ko: '우편: 복권·경품 당첨, 사기성 우편물',
        },
        result: {
          agencies: ['uspis', 'ftc'],
          note: {
            en: 'Anything involving the U.S. mail belongs with the Postal Inspection Service. Keep the envelope and mailing. They are evidence.',
            ko: '우편이 관련된 사기는 우정 감찰국(USPIS) 소관입니다. 봉투와 우편물은 증거이니 버리지 말고 보관하세요.',
          },
        },
      },
      {
        label: {
          en: 'A romance or online relationship that asked for money',
          ko: '연애·온라인 만남 상대가 돈을 요구했습니다',
        },
        result: {
          agencies: ['ic3', 'ftc'],
          note: {
            en: 'Romance scams are internet crimes. File with IC3 and the FTC. Save all messages and payment records, and stop sending anything, even if they promise to pay it back.',
            ko: '로맨스 사기는 인터넷 범죄입니다. IC3와 FTC에 신고하세요. 대화와 송금 기록을 모두 보관하고, 갚겠다고 약속하더라도 더 이상 아무것도 보내지 마세요.',
          },
        },
      },
      {
        label: {
          en: 'A business overcharged, deceived, or ripped me off',
          ko: '업체가 바가지를 씌우거나 속였습니다',
        },
        result: {
          agencies: ['ftc', 'ca-ag'],
          note: {
            en: 'Report deceptive businesses to the FTC. If you are in California, also file with the Attorney General’s consumer complaint office.',
            ko: '기만적인 업체는 FTC에 신고하세요. 캘리포니아에 계시다면 캘리포니아 법무장관실 소비자 민원에도 함께 접수하세요.',
          },
        },
      },
    ],
  },
  {
    id: 'impersonation',
    question: {
      en: 'Who did they claim to be?',
      ko: '상대가 누구를 사칭했나요?',
    },
    options: [
      {
        label: {
          en: 'The IRS or a tax agency',
          ko: 'IRS(국세청) 또는 세무 기관',
        },
        result: {
          agencies: ['irs', 'ftc'],
          note: {
            en: 'The real IRS contacts you by mail first, never with threatening phone calls or gift card demands. Report impersonation through the IRS fraud page.',
            ko: '진짜 IRS는 항상 우편으로 먼저 연락하며, 협박 전화나 기프트카드 요구는 절대 하지 않습니다. IRS 사기 신고 페이지를 통해 사칭을 신고하세요.',
          },
        },
      },
      {
        label: {
          en: 'The Social Security Administration',
          ko: '사회보장국(SSA)',
        },
        result: {
          agencies: ['ssa-oig', 'ftc'],
          note: {
            en: 'The SSA will never threaten to suspend your SSN or demand payment by phone. Report impersonation to the SSA Inspector General.',
            ko: 'SSA는 SSN 정지 협박이나 전화 납부 요구를 절대 하지 않습니다. SSA 감찰관실(OIG)에 사칭을 신고하세요.',
          },
        },
      },
      {
        label: {
          en: 'Medicare or a health agency',
          ko: '메디케어 또는 보건 기관',
        },
        result: {
          agencies: ['hhs-oig', 'ftc'],
          note: {
            en: 'Report Medicare/Medicaid scams and billing fraud to the HHS Inspector General. Never share your Medicare number with unexpected callers.',
            ko: '메디케어·메디케이드 사기와 부정 청구는 HHS 감찰관실에 신고하세요. 예상치 못한 전화에 메디케어 번호를 절대 알려주지 마세요.',
          },
        },
      },
      {
        label: {
          en: 'A family member in an emergency',
          ko: '위급한 상황에 처한 가족',
        },
        result: {
          agencies: ['ftc', 'ic3'],
          note: {
            en: 'Hang up and call your family member directly on their real number. Scammers can fake caller ID and even clone voices with AI. Report the attempt to the FTC even if you did not pay.',
            ko: '전화를 끊고 그 가족의 실제 번호로 직접 전화해 확인하세요. 사기범은 발신 번호를 조작하고 AI로 목소리까지 복제할 수 있습니다. 돈을 보내지 않았더라도 FTC에 신고해 주세요.',
          },
        },
      },
      {
        label: {
          en: 'A bank, company, or tech support',
          ko: '은행, 회사, 기술지원(테크 서포트)',
        },
        result: {
          agencies: ['ftc', 'ic3'],
          note: {
            en: 'Hang up and call the company back at its official number. Report the impersonation to the FTC; if they reached you online or accessed your computer, also file with IC3.',
            ko: '전화를 끊고 회사의 공식 번호로 다시 확인하세요. 사칭은 FTC에 신고하고, 온라인으로 접근했거나 컴퓨터에 접속했다면 IC3에도 신고하세요.',
          },
        },
      },
      {
        label: {
          en: 'Another government office, or something else',
          ko: '다른 정부 기관 또는 기타',
        },
        result: {
          agencies: ['ftc', 'usagov', 'oversight'],
          note: {
            en: 'Report impersonation scams to the FTC. If the wrongdoing involves a federal agency or its contracts, Oversight.gov routes it to the right Inspector General.',
            ko: '사칭 사기는 FTC에 신고하세요. 연방 기관이나 그 계약과 관련된 비리라면 Oversight.gov가 알맞은 감찰관실로 연결해 줍니다.',
          },
        },
      },
    ],
  },
];
