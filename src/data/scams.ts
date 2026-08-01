import type { Locale } from '../i18n';

/**
 * A public-service video for a guide.
 *
 * Rules for anything added here:
 *  - either an original CRC production, or published by a government agency or
 *    recognised consumer-protection body (FTC, USPIS, FBI, AARP);
 *  - at least 45 seconds and actually about the scam, not a 30-second slogan;
 *  - embeddable off the publisher's own domain. Check before adding:
 *    Vimeo  → `https://player.vimeo.com/video/<id>` must return HTTP 200
 *             (many FTC videos are privacy-locked to ftc.gov and will 401);
 *    YouTube→ the watch page must report `"playableInEmbed":true`.
 */
export type VideoProvider = 'youtube' | 'vimeo' | 'local';

export interface VideoRef {
  provider: VideoProvider;
  /** YouTube id, numeric Vimeo id, or root-relative local video path. */
  id: string;
  /** Public page for the video, used as the fallback link. */
  page: string;
  /** Runtime in seconds; shown next to the publisher's name. */
  seconds: number;
  /** Publisher, per language. */
  source: Record<Locale, string>;
}

export interface ScamVideo {
  en: VideoRef;
  /** Only set when a Korean-language version of a video actually exists. */
  ko?: VideoRef;
}

const FTC: Record<Locale, string> = {
  en: 'the U.S. Federal Trade Commission',
  ko: '미국 연방거래위원회(FTC)',
};
const USPIS: Record<Locale, string> = {
  en: 'the U.S. Postal Inspection Service',
  ko: '미국 우정 감찰국(USPIS)',
};
const FBI: Record<Locale, string> = {
  en: 'the FBI',
  ko: '미국 연방수사국(FBI)',
};
const AARP: Record<Locale, string> = {
  en: 'AARP',
  ko: 'AARP(미국 은퇴자협회)',
};
const CRC: Record<Locale, string> = {
  en: 'the Consumer Resource Center',
  ko: '한인 시민센터',
};

export interface ScamGuide {
  slug: string;
  /** Icon name from src/components/Icon.astro. */
  icon: string;
  /** Optional official video shown on the guide page. */
  video?: ScamVideo;
  title: Record<Locale, string>;
  tagline: Record<Locale, string>;      // one-sentence hook
  what: Record<Locale, string>;         // 2-4 sentence plain-language explanation of how the scam works
  warningSigns: Record<Locale, string[]>;   // 5-6 bullets
  protect: Record<Locale, string[]>;        // 4-5 bullets
  ifHappened: Record<Locale, string[]>;     // 3-4 bullets, concrete first steps
  reportTo: string[];                   // agency ids from agencies.ts, first = primary
}

/**
 * Plain-language scam education guides, in English and Korean.
 * `reportTo` references agency ids from agencies.ts (first entry = primary).
 */
export const scamGuides: ScamGuide[] = [
  {
    slug: 'phishing',
    icon: 'smartphone',
    video: {
      en: {
        provider: 'youtube',
        id: 'dmjfdHquxyQ',
        page: 'https://www.youtube.com/watch?v=dmjfdHquxyQ',
        seconds: 79,
        source: USPIS,
      },
      ko: {
        provider: 'local',
        id: '/videos/ko/phishing.mp4',
        page: '/videos/ko/phishing.mp4',
        seconds: 183,
        source: CRC,
      },
    },
    title: {
      en: 'Phishing Emails & Fake Texts',
      ko: '피싱 이메일과 가짜 문자 (스미싱)',
    },
    tagline: {
      en: 'That "bank alert" or "package delivery" message may be a trap designed to steal your information.',
      ko: '"은행 경고"나 "택배 배송" 문자가 사실은 내 정보를 훔치려는 덫일 수 있습니다.',
    },
    what: {
      en: 'Phishing is when scammers send fake emails or text messages that look like they come from a real company: your bank, the post office, Amazon, or a delivery service. The message says something urgent happened: a package could not be delivered, your account is locked, or a payment failed. It asks you to click a link and "verify" your information. The link leads to a fake website that steals your passwords, card numbers, or personal information.',
      ko: '피싱은 사기범이 은행, 우체국, Amazon(아마존), 택배 회사 같은 실제 회사를 흉내 낸 가짜 이메일이나 문자를 보내는 수법입니다. "택배가 배송되지 않았습니다", "계좌가 잠겼습니다", "결제가 실패했습니다"처럼 급한 일이 생긴 것처럼 꾸며서, 링크를 눌러 정보를 "확인"하라고 합니다. 그 링크는 비밀번호, 카드번호, 개인정보를 훔치는 가짜 웹사이트로 연결됩니다.',
    },
    warningSigns: {
      en: [
        'A text about a package you were not expecting, with a link to "reschedule delivery" or pay a small fee.',
        'The message creates urgency: "Your account will be closed in 24 hours" or "Suspicious activity detected. Act now."',
        'The sender\'s email address or phone number does not match the real company. Look closely: "amaz0n" or a random Gmail address.',
        'The link looks almost right but slightly wrong, like "bankofamerica-secure.com" instead of the real site.',
        'It asks you to enter your password, Social Security number, or card number after clicking a link.',
        'Greetings are generic ("Dear Customer") or the message has odd spelling and grammar.',
      ],
      ko: [
        '주문한 적 없는 택배에 대해 "배송 일정 변경" 링크나 소액 결제를 요구하는 문자가 옵니다.',
        '"24시간 안에 계좌가 정지됩니다", "의심스러운 거래 발견, 지금 확인하세요"처럼 급하게 몰아붙입니다.',
        '보낸 사람의 이메일 주소나 전화번호가 실제 회사와 다릅니다. 자세히 보면 "amaz0n"처럼 철자가 다르거나 일반 Gmail 주소입니다.',
        '링크 주소가 진짜와 비슷하지만 조금 다릅니다. 예: 진짜 사이트 대신 "bankofamerica-secure.com".',
        '링크를 누른 뒤 비밀번호, 소셜시큐리티 번호, 카드번호를 입력하라고 합니다.',
        '"고객님께(Dear Customer)"처럼 이름 없이 부르거나, 문장이 어색하고 오타가 있습니다.',
      ],
    },
    protect: {
      en: [
        'Never click links in unexpected texts or emails. If you think it might be real, go to the company\'s website yourself by typing the address, or call the number on the back of your card.',
        'Your bank and the government will never ask for your password or full Social Security number by text or email.',
        'Slow down. Scammers create urgency on purpose. A real company gives you time.',
        'Turn on two-step verification (a code sent to your phone) for your email and bank accounts.',
        'Delete suspicious texts without replying. Even replying "STOP" tells scammers your number is active.',
      ],
      ko: [
        '예상하지 못한 문자나 이메일의 링크는 절대 누르지 마세요. 진짜인지 궁금하면 회사 웹사이트 주소를 직접 입력해서 들어가거나, 카드 뒷면의 전화번호로 확인하세요.',
        '은행이나 정부 기관은 문자나 이메일로 비밀번호나 소셜시큐리티 번호를 묻지 않습니다.',
        '서두르지 마세요. 사기범은 일부러 급하게 만듭니다. 진짜 회사는 생각할 시간을 줍니다.',
        '이메일과 은행 계정에 2단계 인증(휴대폰으로 확인 코드 받기)을 설정하세요.',
        '의심스러운 문자는 답장하지 말고 삭제하세요. "STOP"이라고 답하는 것만으로도 내 번호가 사용 중이라는 사실을 알려주게 됩니다.',
      ],
    },
    ifHappened: {
      en: [
        'If you entered a password, change it right away on the real website, and on any other account that uses the same password.',
        'If you entered card or bank information, call your bank immediately to freeze the card and dispute charges.',
        'Save the message. Take a screenshot before deleting. It is useful evidence when you report.',
        'Do not be embarrassed. These messages fool millions of people. Reporting helps stop the scammers.',
      ],
      ko: [
        '비밀번호를 입력했다면 지금 바로 진짜 웹사이트에서 비밀번호를 바꾸세요. 같은 비밀번호를 쓰는 다른 계정도 함께 바꾸세요.',
        '카드나 은행 정보를 입력했다면 즉시 은행에 전화해 카드를 정지하고 부정 결제를 신고하세요.',
        '문자를 지우기 전에 스크린샷을 찍어 두세요. 신고할 때 중요한 증거가 됩니다.',
        '부끄러워하지 마세요. 이런 문자에 수백만 명이 속습니다. 신고가 사기범을 막는 첫걸음입니다.',
      ],
    },
    reportTo: ['ic3', 'ftc'],
  },
  {
    slug: 'government-impersonation',
    icon: 'landmark',
    video: {
      en: {
        provider: 'youtube',
        id: 'Exf4iUD7gRo',
        page: 'https://www.youtube.com/watch?v=Exf4iUD7gRo',
        seconds: 94,
        source: FTC,
      },
      ko: {
        provider: 'local',
        id: '/videos/ko/government-impersonation.mp4',
        page: '/videos/ko/government-impersonation.mp4',
        seconds: 206,
        source: CRC,
      },
    },
    title: {
      en: 'Government Impersonation Calls',
      ko: '정부 기관 사칭 전화 (보이스피싱)',
    },
    tagline: {
      en: 'Real government agencies never call to threaten you with arrest or demand payment by gift card.',
      ko: '진짜 정부 기관은 전화로 체포하겠다고 협박하거나 기프트카드로 돈을 내라고 하지 않습니다.',
    },
    what: {
      en: 'A caller claims to be from the IRS, Social Security, the police, or immigration. They say you owe taxes, your Social Security number was used in a crime, or there is a warrant for your arrest, and that you must pay right now to avoid arrest or deportation. Scammers often speak Korean and may even claim to be from the Korean consulate or Korean police, because they know how frightening these threats feel to immigrants. Real agencies send letters first, never threaten you on the phone, and never ask for gift cards or wire transfers.',
      ko: '전화를 건 사람이 IRS(국세청), 소셜시큐리티국(SSA), 경찰, 이민국 직원이라고 주장합니다. 세금이 밀렸다, 소셜시큐리티 번호가 범죄에 사용됐다, 체포 영장이 발부됐다면서 지금 당장 돈을 내지 않으면 체포되거나 추방된다고 협박합니다. 사기범이 한국어로 전화하는 경우도 많고, 한국 영사관이나 한국 경찰청을 사칭하기도 합니다. 이런 협박이 이민자에게 얼마나 무섭게 들리는지 잘 알기 때문입니다. 진짜 기관은 먼저 우편으로 연락하고, 전화로 협박하지 않으며, 기프트카드나 송금을 요구하지 않습니다.',
    },
    warningSigns: {
      en: [
        'The caller threatens arrest, deportation, or losing your Social Security benefits unless you pay today.',
        'They demand payment by gift cards (Google Play, Apple, Target), wire transfer, cryptocurrency, or cash in the mail. Real agencies never do this.',
        'They tell you to keep the call secret and not talk to family, your bank, or a lawyer.',
        'They already know some of your information (name, address) and use it to sound official.',
        'The caller ID shows a real agency name or Washington DC number. Caller ID can be faked.',
        'A Korean-speaking caller claims to be the Korean consulate, Korean police, or prosecutors saying you are involved in a crime.',
      ],
      ko: [
        '오늘 안에 돈을 내지 않으면 체포된다, 추방된다, 소셜시큐리티 연금이 끊긴다고 협박합니다.',
        '기프트카드(Google Play, Apple, Target), 송금, 암호화폐, 현금 우편 발송으로 내라고 합니다. 진짜 기관은 절대 이런 방법을 쓰지 않습니다.',
        '이 전화를 비밀로 하라며 가족, 은행, 변호사에게 말하지 못하게 합니다.',
        '이름, 주소 같은 내 정보를 이미 알고 있어서 진짜처럼 들립니다.',
        '발신자 표시에 실제 기관 이름이나 워싱턴 DC 번호가 뜹니다. 발신자 번호는 조작할 수 있습니다.',
        '한국어로 전화해서 한국 영사관, 경찰청, 검찰청이라며 내가 범죄에 연루됐다고 말합니다.',
      ],
    },
    protect: {
      en: [
        'Hang up. It is not rude. It is safe. A real agency will not punish you for hanging up.',
        'If you are worried the call might be real, look up the agency\'s official phone number yourself and call back. Never use a number the caller gives you.',
        'Remember: the IRS and SSA start with a letter in the mail, not a threatening phone call.',
        'No government agency accepts gift cards. The moment you hear "gift card," it is a scam.',
        'Talk to someone you trust before sending any money. Scammers isolate you on purpose.',
      ],
      ko: [
        '그냥 끊으세요. 무례한 것이 아니라 안전한 행동입니다. 진짜 기관은 전화를 끊었다고 불이익을 주지 않습니다.',
        '혹시 진짜일까 걱정되면, 그 기관의 공식 전화번호를 직접 찾아서 걸어 확인하세요. 전화 건 사람이 알려준 번호는 절대 쓰지 마세요.',
        'IRS와 소셜시큐리티국은 협박 전화가 아니라 우편으로 먼저 연락한다는 것을 기억하세요.',
        '어떤 정부 기관도 기프트카드를 받지 않습니다. "기프트카드"라는 말이 나오는 순간 사기입니다.',
        '돈을 보내기 전에 반드시 믿을 수 있는 사람과 상의하세요. 사기범은 일부러 주변과 차단시킵니다.',
      ],
    },
    ifHappened: {
      en: [
        'If you paid by gift card, call the gift card company right away. Some cards can be frozen if you act quickly. Keep the card and receipt.',
        'If you wired money or paid from your bank, call your bank immediately and ask them to try to reverse or stop the transfer.',
        'Write down everything you remember: the phone number, what they said, how you paid, and when.',
        'You did nothing wrong. You were threatened by professionals. Report it, and tell family and friends so they are warned too.',
      ],
      ko: [
        '기프트카드로 돈을 냈다면 즉시 해당 카드 회사에 전화하세요. 빨리 조치하면 카드를 정지할 수 있는 경우도 있습니다. 카드와 영수증은 버리지 말고 보관하세요.',
        '송금했거나 은행 계좌에서 돈이 나갔다면 즉시 은행에 전화해 송금 취소나 정지를 요청하세요.',
        '기억나는 것을 모두 적어 두세요. 전화번호, 상대가 한 말, 결제 방법, 날짜와 시간까지.',
        '잘못하신 것이 없습니다. 전문 사기범에게 협박을 당한 것입니다. 꼭 신고하시고, 가족과 지인에게도 알려서 같은 피해를 막아 주세요.',
      ],
    },
    reportTo: ['ftc', 'ssa-oig', 'irs'],
  },
  {
    slug: 'family-emergency',
    icon: 'users',
    video: {
      en: {
        provider: 'vimeo',
        id: '352058971',
        page: 'https://consumer.ftc.gov/media/79939',
        seconds: 135,
        source: FTC,
      },
      ko: {
        provider: 'local',
        id: '/videos/ko/family-emergency.mp4',
        page: '/videos/ko/family-emergency.mp4',
        seconds: 181,
        source: CRC,
      },
    },
    title: {
      en: 'Family Emergency & AI Voice Scams',
      ko: '가족 사칭 전화 (AI 목소리 복제)',
    },
    tagline: {
      en: 'A panicked call from a "grandchild in trouble" can now use an AI copy of their real voice.',
      ko: '"손주가 큰일 났다"는 다급한 전화, 이제는 AI가 진짜 목소리까지 흉내 냅니다.',
    },
    what: {
      en: 'You get a call, often late at night. A voice that sounds exactly like your grandchild, child, or relative says they are in trouble: a car accident, an arrest, a hospital in another country. Then a "lawyer" or "officer" takes the phone and demands bail or hospital money immediately, by wire, gift card, cryptocurrency, or even a courier sent to your door to pick up cash. The voice can sound real because scammers can clone a voice with AI from a few seconds of video posted on social media. The pressure and secrecy ("do not tell Mom, she will be upset") are part of the script.',
      ko: '주로 늦은 밤에 전화가 옵니다. 손주, 자녀, 친척과 똑같은 목소리가 사고가 났다, 체포됐다, 외국 병원에 있다며 울먹입니다. 곧이어 "변호사"나 "경찰"이 전화를 넘겨받아 보석금이나 병원비를 지금 당장 내라고 합니다. 송금, 기프트카드, 암호화폐를 요구하거나, 심지어 현금을 받으러 집 앞으로 사람을 보내겠다고도 합니다. 사기범은 소셜미디어에 올라온 몇 초짜리 영상만으로도 AI로 목소리를 복제할 수 있어서 진짜처럼 들립니다. "엄마한테는 말하지 마세요, 걱정하시니까요"라며 비밀을 요구하는 것까지 모두 짜인 각본입니다.',
    },
    warningSigns: {
      en: [
        'A call about a family emergency demands money right now, before you can check with anyone.',
        'You are told to keep it secret from the rest of the family.',
        'A "lawyer," "police officer," or "doctor" quickly takes over the call and handles the payment.',
        'Payment must be untraceable: wire transfer, gift cards, cryptocurrency, or cash handed to a courier.',
        'The caller cannot answer simple personal questions, or discourages you from asking any.',
        'The voice sounds right but the phone number is unfamiliar, or they say "my phone broke, I am borrowing one."',
      ],
      ko: [
        '가족이 위급하다면서, 누구에게 확인할 틈도 주지 않고 지금 당장 돈을 요구합니다.',
        '다른 가족에게는 비밀로 하라고 합니다.',
        '"변호사", "경찰", "의사"가 금방 전화를 넘겨받아 결제 방법을 안내합니다.',
        '추적할 수 없는 방법만 요구합니다. 송금, 기프트카드, 암호화폐, 심부름꾼에게 현금 전달 등입니다.',
        '간단한 개인적인 질문에 답하지 못하거나, 질문 자체를 못 하게 막습니다.',
        '목소리는 비슷한데 전화번호가 낯설거나, "휴대폰이 고장 나서 빌린 전화"라고 둘러댑니다.',
      ],
    },
    protect: {
      en: [
        'Hang up and call your family member directly on the number you already have for them. This one habit defeats the scam.',
        'Agree on a family code word in advance. A real relative in trouble will know it.',
        'Ask a question only the real person could answer (the name of their first pet, what you ate together last week).',
        'Never hand cash to a courier or send gift cards or wire transfers for any "emergency."',
        'Think about limiting how much family video and voice content is public on social media.',
      ],
      ko: [
        '전화를 끊고, 원래 알고 있는 그 가족의 번호로 직접 전화하세요. 이 습관 하나면 이 사기를 막을 수 있습니다.',
        '가족끼리 미리 암호(코드워드)를 정해 두세요. 진짜 가족이라면 알고 있을 것입니다.',
        '진짜 본인만 알 수 있는 질문을 해 보세요. 처음 키운 반려동물 이름, 지난주에 함께 먹은 음식 같은 것들입니다.',
        '어떤 "위급 상황"이라도 심부름꾼에게 현금을 건네거나 기프트카드, 송금으로 돈을 보내지 마세요.',
        '가족의 목소리와 영상이 소셜미디어에 공개로 올라가 있지 않은지 한번 살펴보세요.',
      ],
    },
    ifHappened: {
      en: [
        'Call your bank or the wire service immediately and ask them to stop or recall the transfer.',
        'If you gave cash to a courier, call your local police right away with a description.',
        'Check on the real family member so you know they are safe, and warn the rest of the family.',
        'Report it even if you did not pay. Attempt reports help investigators connect these crews.',
      ],
      ko: [
        '즉시 은행이나 송금 회사에 전화해 송금 정지나 회수를 요청하세요.',
        '심부름꾼에게 현금을 건넸다면 즉시 지역 경찰에 신고하고 인상착의를 알려주세요.',
        '실제 가족에게 연락해 안전을 확인하고, 다른 가족에게도 알려 주세요.',
        '돈을 보내지 않았더라도 신고해 주세요. 시도 신고도 수사기관이 조직을 추적하는 데 큰 도움이 됩니다.',
      ],
    },
    reportTo: ['ftc', 'ic3'],
  },
  {
    slug: 'investment-crypto',
    icon: 'chart',
    video: {
      en: {
        provider: 'youtube',
        id: 'vUE03dqE0Zw',
        page: 'https://www.youtube.com/watch?v=vUE03dqE0Zw',
        seconds: 153,
        source: AARP,
      },
      ko: {
        provider: 'local',
        id: '/videos/ko/investment-crypto.mp4',
        page: '/videos/ko/investment-crypto.mp4',
        seconds: 195,
        source: CRC,
      },
    },
    title: {
      en: 'Investment & Crypto Scams',
      ko: '투자·암호화폐 사기',
    },
    tagline: {
      en: '"Guaranteed high returns" is not an opportunity. It is the oldest lie in fraud.',
      ko: '"원금 보장, 고수익"은 투자 기회가 아니라 사기의 가장 오래된 거짓말입니다.',
    },
    what: {
      en: 'A stranger, or an online "friend" or romantic interest, introduces you to an investment platform, usually cryptocurrency or foreign exchange. The website looks professional and your account balance seems to grow quickly, so you invest more. This is called "pig butchering": the scammer fattens your trust before taking everything. The numbers on the screen were never real, and when you try to withdraw, they demand fees and taxes, or simply disappear. These scams also spread through Korean-language KakaoTalk investment groups, fake celebrity endorsements, and "reading rooms" with paid stock tips.',
      ko: '모르는 사람, 혹은 온라인에서 사귄 "친구"나 연인이 투자 플랫폼을 소개합니다. 주로 암호화폐(코인)나 외환 투자입니다. 웹사이트가 그럴듯하고 계좌 잔고가 빠르게 불어나는 것처럼 보여서 점점 더 큰돈을 넣게 됩니다. 이것을 "돼지 도살(pig butchering)" 사기라고 부릅니다. 돼지를 살찌우듯 신뢰를 키운 뒤 한꺼번에 전 재산을 가져가기 때문입니다. 화면의 숫자는 처음부터 가짜였고, 출금하려고 하면 수수료와 세금을 내라고 하다가 결국 사라집니다. 이런 사기는 한국어 카카오톡 투자 단체방, 유명인 사칭 광고, 유료 주식 "리딩방"을 통해서도 퍼집니다.',
    },
    warningSigns: {
      en: [
        'Someone you met online (dating app, wrong-number text, social media) steers the conversation to investing.',
        'They promise guaranteed returns, "no risk," or profits like 10-20% per month. Real investments can never guarantee returns.',
        'You are told to download a special app or use a website you have never heard of, instead of a well-known brokerage.',
        'Your balance grows fast on screen, and small early withdrawals work. That is bait to get you to invest more.',
        'When you try to withdraw larger amounts, they demand "taxes" or "unlock fees" first.',
        'A Korean-language KakaoTalk group or a famous Korean celebrity\'s ad urges you to join an exclusive investment opportunity.',
      ],
      ko: [
        '온라인에서 알게 된 사람(데이팅 앱, 잘못 온 문자, 소셜미디어)이 슬며시 투자 이야기를 꺼냅니다.',
        '원금 보장, "위험 없음", 월 10~20% 수익을 약속합니다. 진짜 투자는 절대 수익을 보장할 수 없습니다.',
        '유명 증권사 대신 처음 듣는 앱이나 웹사이트를 설치하라고 합니다.',
        '화면에서 잔고가 빨리 불어나고 처음 소액 출금은 잘 됩니다. 더 큰돈을 넣게 하려는 미끼입니다.',
        '큰 금액을 출금하려고 하면 먼저 "세금"이나 "출금 수수료"를 내라고 합니다.',
        '한국어 카카오톡 단체방이나 한국 유명인을 사칭한 광고가 특별한 투자 기회에 초대한다고 합니다.',
      ],
    },
    protect: {
      en: [
        'Never invest through a link, app, or website sent by someone you met online.',
        'Check any investment professional or platform at Investor.gov (run by the SEC) before sending a dollar.',
        'Treat "guaranteed returns" as proof of a scam. All real investments carry risk.',
        'Be skeptical of celebrity endorsements. Scammers fake famous faces and names, including well-known Koreans, in ads and videos.',
        'Discuss any large investment with family or a licensed advisor you found yourself, not one who found you.',
      ],
      ko: [
        '온라인에서 만난 사람이 보내 준 링크, 앱, 웹사이트로는 절대 투자하지 마세요.',
        '돈을 보내기 전에 SEC가 운영하는 Investor.gov에서 해당 업체나 투자 전문가가 등록되어 있는지 확인하세요.',
        '"원금 보장"이라는 말 자체가 사기의 증거라고 생각하세요. 진짜 투자에는 항상 위험이 따릅니다.',
        '유명인 광고를 조심하세요. 사기범은 한국 유명인을 포함해 유명한 얼굴과 이름을 광고와 영상에 도용합니다.',
        '큰돈을 투자하기 전에는 가족이나, 내가 직접 찾은 공인 자문가와 상의하세요. 먼저 나에게 접근해 온 사람은 안 됩니다.',
      ],
    },
    ifHappened: {
      en: [
        'Stop all payments immediately, especially any "fees" or "taxes" they say will release your money. That money is gone the moment you send it.',
        'Contact your bank or crypto exchange right away and tell them the transfers were fraud.',
        'Save everything: the platform website address, chat logs, wallet addresses, transaction records, and screenshots of your "account."',
        'Report even if the amount feels small or you feel foolish. These are organized criminal networks, and your report helps investigators track them.',
      ],
      ko: [
        '모든 송금을 즉시 멈추세요. 특히 돈을 찾게 해 주겠다며 요구하는 "수수료"나 "세금"은 보내는 순간 사라지는 돈입니다.',
        '즉시 은행이나 암호화폐 거래소에 연락해 사기 송금이었다고 알리세요.',
        '모든 것을 저장하세요. 플랫폼 주소, 대화 내용, 지갑 주소, 거래 기록, "내 계좌" 화면 스크린샷까지.',
        '피해 금액이 적어도, 창피하게 느껴져도 꼭 신고하세요. 이들은 조직적인 범죄 집단이며, 신고 하나하나가 수사에 큰 도움이 됩니다.',
      ],
    },
    reportTo: ['sec', 'ic3', 'ftc'],
  },
  {
    slug: 'romance-scams',
    icon: 'heart',
    video: {
      en: {
        provider: 'youtube',
        id: 'lxReHY2SBrw',
        page: 'https://www.youtube.com/watch?v=lxReHY2SBrw',
        seconds: 157,
        source: FBI,
      },
      ko: {
        provider: 'local',
        id: '/videos/ko/romance-scams.mp4',
        page: '/videos/ko/romance-scams.mp4',
        seconds: 184,
        source: CRC,
      },
    },
    title: {
      en: 'Romance Scams',
      ko: '로맨스 스캠 (연애 빙자 사기)',
    },
    tagline: {
      en: 'Someone you met online says they love you. Then the requests for money begin.',
      ko: '온라인에서 만난 사람이 사랑한다고 말한 뒤, 곧 돈 이야기가 시작됩니다.',
    },
    what: {
      en: 'A scammer creates an attractive profile on a dating app, social media, or even a game or church group chat. They message you every day, share their "life," and build real emotional closeness over weeks or months. Then a crisis appears: a medical emergency, a customs fee, a business problem, or a can\'t-miss investment. They ask for money, gift cards, or cryptocurrency, and there is always a reason they cannot meet in person or video chat.',
      ko: '사기범이 데이팅 앱, 소셜미디어, 심지어 게임이나 교회 단체 채팅방에서 매력적인 프로필로 접근합니다. 매일 연락하며 자기 "인생 이야기"를 들려주고, 몇 주 몇 달에 걸쳐 진짜 같은 정을 쌓습니다. 그러다 갑자기 위기가 찾아옵니다. 병원비, 통관 수수료, 사업 문제, 놓치면 안 되는 투자 기회 등입니다. 돈이나 기프트카드, 암호화폐를 보내 달라고 하는데, 이상하게도 직접 만나거나 영상통화를 할 수 없는 이유가 항상 있습니다.',
    },
    warningSigns: {
      en: [
        'They fall in love very fast and message constantly, but always have an excuse to avoid video calls or meeting.',
        'They claim to work far away: military deployment, an oil rig, an overseas hospital, international business.',
        'After weeks of warmth, a sudden emergency requires money, and only you can help.',
        'They ask for payment in ways that cannot be reversed: wire transfer, gift cards, or cryptocurrency.',
        'They ask you to keep the relationship secret from your family and friends.',
        'Their profile photos look like a model, or the same photos appear elsewhere online under a different name.',
      ],
      ko: [
        '아주 빨리 사랑에 빠졌다며 하루 종일 연락하지만, 영상통화나 만남은 늘 핑계를 대며 피합니다.',
        '군대 파병, 해상 석유 시추선, 해외 병원, 국제 사업 등 멀리 떨어진 곳에서 일한다고 합니다.',
        '몇 주간 다정하게 지내다가 갑자기 급한 일이 생겼다며, 도와줄 사람은 나뿐이라고 합니다.',
        '되돌릴 수 없는 방법으로 돈을 요구합니다. 송금, 기프트카드, 암호화폐 등입니다.',
        '이 관계를 가족과 친구에게 비밀로 해 달라고 합니다.',
        '프로필 사진이 모델처럼 완벽하거나, 같은 사진이 다른 이름으로 인터넷에 돌아다닙니다.',
      ],
    },
    protect: {
      en: [
        'Never send money, gift cards, or cryptocurrency to someone you have not met in person, no matter how long you have talked.',
        'Try a reverse image search of their photos (ask a family member to help). Stolen photos are a common sign.',
        'Talk to a trusted friend or family member about a new online relationship. Scammers count on secrecy.',
        'Be extra careful if they quickly move the conversation off the dating app to KakaoTalk, WhatsApp, or text.',
        'If they mention investing or cryptocurrency, stop. That is a well-known scam pattern, not romance.',
      ],
      ko: [
        '직접 만나 본 적 없는 사람에게는 아무리 오래 연락했어도 절대 돈, 기프트카드, 암호화폐를 보내지 마세요.',
        '상대방 사진을 이미지 검색(구글 이미지 검색)으로 확인해 보세요. 가족에게 도움을 청하셔도 좋습니다. 도용된 사진이면 사기입니다.',
        '새로 생긴 온라인 인연에 대해 믿을 수 있는 가족이나 친구에게 이야기하세요. 사기범은 비밀을 좋아합니다.',
        '만나자마자 데이팅 앱을 벗어나 카카오톡, WhatsApp, 문자로 옮기자고 하면 더욱 조심하세요.',
        '상대가 투자나 암호화폐 이야기를 꺼내면 바로 멈추세요. 연애가 아니라 잘 알려진 사기 수법입니다.',
      ],
    },
    ifHappened: {
      en: [
        'Stop sending money now, even if they promise to pay you back or beg. Cut off contact.',
        'Call your bank right away if you sent money recently. Some transfers can be stopped or disputed.',
        'Save everything before blocking them: chat history, profile, photos, payment receipts. It is all evidence.',
        'Please do not suffer in silence out of shame. These criminals are professionals who fool smart, kind people every day. Reporting protects you and others.',
      ],
      ko: [
        '갚겠다고 약속하거나 애원해도 지금 당장 송금을 멈추고 연락을 끊으세요.',
        '최근에 돈을 보냈다면 즉시 은행에 전화하세요. 송금을 정지하거나 이의를 제기할 수 있는 경우도 있습니다.',
        '차단하기 전에 대화 내용, 프로필, 사진, 송금 영수증을 모두 저장해 두세요. 전부 증거가 됩니다.',
        '부끄러워서 혼자 끙끙 앓지 마세요. 이들은 똑똑하고 따뜻한 사람들을 매일 속이는 전문 범죄자입니다. 신고가 나와 다른 사람을 지킵니다.',
      ],
    },
    reportTo: ['ic3', 'ftc'],
  },
  {
    slug: 'tech-support',
    icon: 'monitor',
    video: {
      en: {
        provider: 'youtube',
        id: 'wuj5tvnbJwg',
        page: 'https://www.youtube.com/watch?v=wuj5tvnbJwg',
        seconds: 186,
        source: FTC,
      },
      ko: {
        provider: 'local',
        id: '/videos/ko/tech-support.mp4',
        page: '/videos/ko/tech-support.mp4',
        seconds: 198,
        source: CRC,
      },
    },
    title: {
      en: 'Tech Support Scams',
      ko: '기술지원 사기 (컴퓨터 수리 사칭)',
    },
    tagline: {
      en: 'A scary pop-up says your computer is infected, but the only real danger is the phone number on the screen.',
      ko: '컴퓨터가 바이러스에 감염됐다는 무서운 경고창, 사실 진짜 위험한 것은 화면에 적힌 그 전화번호입니다.',
    },
    what: {
      en: 'A loud pop-up appears on your screen, sometimes with alarm sounds, saying your computer is infected and you must call "Microsoft" or "Apple" right away. Or someone calls you claiming to be tech support. If you call, they ask to connect to your computer remotely, "find" fake problems, and charge hundreds of dollars to fix nothing. In the refund version, they claim they owe you money, "accidentally" refund too much, and pressure you to send back the difference, often in gift cards. Real tech companies never contact you this way.',
      ko: '갑자기 화면에 요란한 경고창이 뜹니다. 경고음까지 나면서 컴퓨터가 감염됐으니 지금 당장 "Microsoft"나 "Apple"에 전화하라고 합니다. 반대로 기술지원 직원이라며 먼저 전화가 오기도 합니다. 전화를 걸면 원격으로 컴퓨터에 접속하게 해 달라고 한 뒤, 있지도 않은 문제를 "발견"하고 수백 달러의 수리비를 청구합니다. 환불 사기 수법도 있습니다. 환불해 줄 돈이 있다며 "실수로" 돈을 더 보냈다고 하고, 차액을 기프트카드로 돌려보내라고 압박합니다. 진짜 기술 회사는 절대 이런 식으로 먼저 연락하지 않습니다.',
    },
    warningSigns: {
      en: [
        'A pop-up with a phone number tells you to call immediately. Real virus warnings never include a phone number.',
        'Someone calls out of the blue claiming to be Microsoft, Apple, or your internet company, saying they detected a problem.',
        'They ask to install remote-access software like AnyDesk or TeamViewer so they can "fix" your computer.',
        'They ask for payment in gift cards, wire transfer, or cryptocurrency.',
        'They say you are owed a refund, then claim they sent too much and you must return the difference.',
        'While connected, they ask you to log in to your bank "to verify the refund."',
      ],
      ko: [
        '경고창에 전화번호가 적혀 있고 즉시 전화하라고 합니다. 진짜 바이러스 경고에는 전화번호가 없습니다.',
        'Microsoft, Apple, 인터넷 회사라며 갑자기 전화해서 내 컴퓨터에 문제가 발견됐다고 합니다.',
        '컴퓨터를 "고쳐 주겠다"며 AnyDesk, TeamViewer 같은 원격 접속 프로그램을 설치하라고 합니다.',
        '수리비를 기프트카드, 송금, 암호화폐로 내라고 합니다.',
        '환불해 줄 돈이 있다더니, 실수로 너무 많이 보냈다며 차액을 돌려보내라고 합니다.',
        '원격 접속 중에 "환불 확인을 위해" 은행 계정에 로그인하라고 합니다.',
      ],
    },
    protect: {
      en: [
        'If a scary pop-up appears, do not call the number. Close the browser. If it will not close, restart the computer. Nothing bad will happen.',
        'Never let a stranger connect to your computer remotely, no matter who they claim to be.',
        'Microsoft, Apple, and other tech companies do not call you about viruses. Ever.',
        'Never log in to your bank while someone is connected to your computer or on the phone directing you.',
        'If you need computer help, ask a family member or take it to a store you chose yourself.',
      ],
      ko: [
        '무서운 경고창이 떠도 그 번호로 전화하지 마세요. 브라우저를 닫으세요. 안 닫히면 컴퓨터를 껐다 켜면 됩니다. 아무 일도 일어나지 않습니다.',
        '누구라고 주장하든, 모르는 사람이 내 컴퓨터에 원격으로 접속하게 하지 마세요.',
        'Microsoft, Apple 같은 회사는 바이러스 문제로 먼저 전화하지 않습니다. 절대로요.',
        '누군가 내 컴퓨터에 접속해 있거나 전화로 지시하는 동안에는 절대 은행 계정에 로그인하지 마세요.',
        '컴퓨터에 도움이 필요하면 가족에게 부탁하거나, 직접 찾은 동네 수리점에 가져가세요.',
      ],
    },
    ifHappened: {
      en: [
        'If they connected to your computer, disconnect it from the internet, then have a trusted person or repair shop remove the remote-access software.',
        'Call your bank right away if you paid or logged in to your bank during the call. Ask to reverse charges and watch for new activity.',
        'Change your passwords from a different device (your phone or another computer), starting with email and banking.',
        'Do not blame yourself. These pop-ups are engineered to frighten anyone. Report it so others get warned.',
      ],
      ko: [
        '원격 접속을 허용했다면 먼저 인터넷 연결을 끊고, 믿을 수 있는 사람이나 수리점에서 원격 접속 프로그램을 삭제하세요.',
        '통화 중에 결제했거나 은행에 로그인했다면 즉시 은행에 전화해 결제 취소를 요청하고, 계좌에 이상한 거래가 없는지 지켜보세요.',
        '다른 기기(휴대폰이나 다른 컴퓨터)에서 비밀번호를 바꾸세요. 이메일과 은행 계정부터 먼저 바꾸세요.',
        '자책하지 마세요. 이 경고창은 누구라도 겁먹도록 정교하게 만들어진 것입니다. 신고해서 다른 분들도 지켜 주세요.',
      ],
    },
    reportTo: ['ftc', 'ic3'],
  },
  {
    slug: 'identity-theft',
    icon: 'id-card',
    video: {
      en: {
        provider: 'youtube',
        id: 'k3yh9hjnE44',
        page: 'https://www.youtube.com/watch?v=k3yh9hjnE44',
        seconds: 77,
        source: FTC,
      },
      ko: {
        provider: 'local',
        id: '/videos/ko/identity-theft.mp4',
        page: '/videos/ko/identity-theft.mp4',
        seconds: 195,
        source: CRC,
      },
    },
    title: {
      en: 'Identity Theft',
      ko: '신분 도용',
    },
    tagline: {
      en: 'Someone is using your name, Social Security number, or accounts. Here is how to catch it early and take your identity back.',
      ko: '누군가 내 이름과 소셜시큐리티 번호, 계좌를 몰래 쓰고 있다면, 빨리 알아채고 되찾는 방법이 있습니다.',
    },
    what: {
      en: 'Identity theft happens when someone gets your personal information (Social Security number, date of birth, or account numbers) and uses it to pretend to be you. They may open credit cards, take out loans, file a tax return to steal your refund, or use your medical insurance. Your information can leak through data breaches, stolen mail, phishing messages, or scam phone calls. Often the first sign is a bill, collection call, or credit alert for something you never did.',
      ko: '신분 도용은 누군가 내 개인정보, 즉 소셜시큐리티 번호, 생년월일, 계좌번호를 손에 넣어 나인 척 사용하는 것입니다. 내 이름으로 크레딧카드를 만들고, 대출을 받고, 세금 환급을 가로채려고 허위 세금 신고를 하고, 의료보험을 몰래 쓰기도 합니다. 개인정보는 기업 정보 유출 사고, 우편물 절도, 피싱 문자, 사기 전화를 통해 새어 나갑니다. 내가 하지도 않은 일로 청구서가 오거나, 빚 독촉 전화가 오거나, 크레딧 알림이 뜨는 것이 첫 신호인 경우가 많습니다.',
    },
    warningSigns: {
      en: [
        'Bills, credit cards, or collection letters arrive for accounts you never opened.',
        'You are denied credit unexpectedly, or your credit score drops without explanation.',
        'The IRS says a tax return was already filed in your name, or you get tax forms from an employer you never worked for.',
        'Your bank statement shows withdrawals or charges you did not make.',
        'Expected mail stops arriving. Someone may have changed your mailing address.',
        'A company notifies you that your information was exposed in a data breach.',
      ],
      ko: [
        '만든 적 없는 계좌나 카드의 청구서, 크레딧카드, 빚 독촉장이 날아옵니다.',
        '이유 없이 크레딧(신용) 심사에서 거절되거나 크레딧 점수가 갑자기 떨어집니다.',
        'IRS에서 내 이름으로 이미 세금 신고가 됐다고 하거나, 일한 적 없는 회사에서 세금 서류가 옵니다.',
        '은행 명세서에 내가 하지 않은 출금이나 결제가 찍혀 있습니다.',
        '오던 우편물이 갑자기 안 옵니다. 누군가 내 주소를 바꿨을 수 있습니다.',
        '회사에서 내 정보가 유출 사고(데이터 유출)에 포함됐다는 통지를 보냅니다.',
      ],
    },
    protect: {
      en: [
        'Freeze your credit at all three bureaus (Equifax, Experian, TransUnion). It is free, and it blocks new accounts in your name. You can unfreeze anytime.',
        'Check your free credit reports at AnnualCreditReport.com, the only official free site.',
        'Never carry your Social Security card in your wallet, and shred documents with personal information before throwing them away.',
        'Give out your Social Security number only when truly required. It is okay to ask "do you really need it?"',
        'Review bank and card statements every month, and sign up for transaction alerts on your phone.',
      ],
      ko: [
        '3대 신용평가사(Equifax, Experian, TransUnion) 모두에 크레딧 동결(credit freeze)을 신청하세요. 무료이고, 내 이름으로 새 계좌를 만드는 것을 막아 줍니다. 필요하면 언제든 해제할 수 있습니다.',
        '공식 무료 사이트인 AnnualCreditReport.com에서 내 크레딧 리포트를 확인하세요.',
        '소셜시큐리티 카드를 지갑에 넣고 다니지 마시고, 개인정보가 적힌 서류는 꼭 파쇄한 뒤 버리세요.',
        '소셜시큐리티 번호는 정말 필요한 곳에만 알려 주세요. "꼭 필요한가요?"라고 물어보셔도 됩니다.',
        '매달 은행·카드 명세서를 확인하고, 휴대폰으로 거래 알림을 받도록 설정하세요.',
      ],
    },
    ifHappened: {
      en: [
        'Go to IdentityTheft.gov first. It creates your official report and a step-by-step recovery plan, all in one place.',
        'Call the companies where fraud happened, close or freeze those accounts, and place a fraud alert or freeze on your credit.',
        'Keep a folder with dates, names of people you spoke to, and copies of every letter. Recovery takes time and records matter.',
        'This crime can happen to anyone whose data was leaked. It is not your fault, and the recovery system exists for exactly this reason.',
      ],
      ko: [
        '가장 먼저 IdentityTheft.gov로 가세요. 공식 신분 도용 신고서와 단계별 회복 계획을 한곳에서 만들어 줍니다.',
        '피해가 발생한 회사에 전화해 해당 계좌를 닫거나 정지시키고, 크레딧에 사기 경보(fraud alert)나 동결을 걸어 두세요.',
        '날짜, 통화한 담당자 이름, 주고받은 서류 사본을 폴더 하나에 모아 두세요. 회복에는 시간이 걸리고 기록이 매우 중요합니다.',
        '정보가 유출되면 누구에게나 일어날 수 있는 범죄입니다. 여러분의 잘못이 아니며, 바로 이런 상황을 위해 회복 절차가 마련되어 있습니다.',
      ],
    },
    reportTo: ['idtheft', 'ftc'],
  },
  {
    slug: 'online-shopping',
    icon: 'cart',
    video: {
      en: {
        provider: 'vimeo',
        id: '352069005',
        page: 'https://consumer.ftc.gov/media/79929',
        seconds: 208,
        source: FTC,
      },
      ko: {
        provider: 'local',
        id: '/videos/ko/online-shopping.mp4',
        page: '/videos/ko/online-shopping.mp4',
        seconds: 197,
        source: CRC,
      },
    },
    title: {
      en: 'Fake Online Stores',
      ko: '가짜 온라인 쇼핑몰',
    },
    tagline: {
      en: 'That amazing deal in a social media ad may be a store that takes your money and never ships a thing.',
      ko: '소셜미디어 광고 속 파격 할인, 알고 보면 돈만 받고 물건은 보내지 않는 가짜 쇼핑몰일 수 있습니다.',
    },
    what: {
      en: 'Scammers build convincing online stores and advertise them on Facebook, Instagram, YouTube, and KakaoTalk, often with huge discounts on brand-name goods. After you pay, one of three things happens: nothing arrives, a cheap counterfeit arrives, or something worthless (like a random trinket) arrives so the tracking shows "delivered." The store then stops answering messages, and the website may vanish entirely. Fake sellers also appear inside real marketplaces like Facebook Marketplace, asking for payment by Zelle or wire before you ever see the item.',
      ko: '사기범은 그럴듯한 온라인 쇼핑몰을 만들어 Facebook(페이스북), Instagram(인스타그램), YouTube(유튜브), 카카오톡에 광고합니다. 유명 브랜드 상품을 파격 할인한다는 광고가 많습니다. 돈을 내면 세 가지 중 하나가 일어납니다. 물건이 아예 안 오거나, 싸구려 짝퉁이 오거나, 배송 추적에 "배송 완료"가 뜨도록 엉뚱한 싸구려 물건이 옵니다. 그 후 쇼핑몰은 연락이 끊기고 웹사이트가 통째로 사라지기도 합니다. Facebook Marketplace 같은 진짜 장터 안에서도 가짜 판매자가 활동하며, 물건을 보기도 전에 Zelle(젤)이나 송금으로 돈을 요구합니다.',
    },
    warningSigns: {
      en: [
        'Prices are far below what everyone else charges. 70-90% off brand names is a classic bait.',
        'The store only appeared recently, has no phone number or physical address, and its "About Us" page is vague.',
        'The seller insists on payment by Zelle, Venmo, wire transfer, gift card, or crypto, methods with no buyer protection.',
        'The website address is odd: a misspelled brand name or a strange ending instead of the brand\'s real site.',
        'Reviews are all five stars posted around the same date, or you find complaints when you search the store name plus "scam."',
        'A countdown timer pressures you: "Only 3 left! Sale ends in 10 minutes!"',
      ],
      ko: [
        '다른 곳보다 터무니없이 쌉니다. 유명 브랜드 70~90% 할인은 전형적인 미끼입니다.',
        '최근에 생긴 쇼핑몰인데 전화번호와 실제 주소가 없고, 회사 소개가 두루뭉술합니다.',
        'Zelle, Venmo, 송금, 기프트카드, 암호화폐로만 결제하라고 합니다. 모두 구매자 보호가 없는 결제 방법입니다.',
        '웹사이트 주소가 이상합니다. 브랜드 이름의 철자가 틀렸거나 공식 사이트와 주소 끝부분이 다릅니다.',
        '후기가 전부 비슷한 날짜에 올라온 별 다섯 개뿐이거나, 쇼핑몰 이름과 "scam"을 함께 검색하면 피해 사례가 나옵니다.',
        '"재고 3개 남음! 10분 후 할인 종료!" 같은 타이머로 조급하게 만듭니다.',
      ],
    },
    protect: {
      en: [
        'Before buying from an unfamiliar store, search its name plus the word "scam" or "reviews."',
        'Pay with a credit card whenever possible. Credit cards let you dispute charges and get your money back. Zelle and wire transfers do not.',
        'If a deal looks too good to be true, it is. Check the price on the brand\'s official site.',
        'Be careful with ads on social media and in KakaoTalk group chats. Anyone can buy an ad.',
        'For local marketplace purchases, meet in a public place and never pay in advance for an item you have not seen.',
      ],
      ko: [
        '처음 보는 쇼핑몰이라면 구매 전에 쇼핑몰 이름과 "scam" 또는 "후기"를 함께 검색해 보세요.',
        '가능하면 크레딧카드로 결제하세요. 크레딧카드는 이의 제기를 해서 돈을 돌려받을 수 있지만, Zelle이나 송금은 그럴 수 없습니다.',
        '너무 좋아 보이는 할인은 사기입니다. 브랜드 공식 사이트에서 실제 가격을 확인해 보세요.',
        '소셜미디어와 카카오톡 단체방의 광고를 조심하세요. 광고는 누구나 돈만 내면 낼 수 있습니다.',
        '중고 직거래는 공공장소에서 만나고, 물건을 보기 전에는 절대 먼저 돈을 보내지 마세요.',
      ],
    },
    ifHappened: {
      en: [
        'Contact your credit card company or bank right away and dispute the charge, even if the seller promises a refund "soon."',
        'Save everything: the ad, the website address, order confirmation, receipts, and all messages with the seller.',
        'If you paid through PayPal or another payment service, open a dispute there too.',
        'Report the store. Your report can get the ads taken down and warn other shoppers.',
      ],
      ko: [
        '즉시 크레딧카드 회사나 은행에 연락해 결제 이의 신청(dispute)을 하세요. 판매자가 "곧" 환불해 주겠다고 해도 기다리지 말고 신청하세요.',
        '광고, 웹사이트 주소, 주문 확인서, 영수증, 판매자와 주고받은 메시지를 모두 저장하세요.',
        'PayPal 등 결제 서비스를 통해 결제했다면 그곳에도 이의 신청을 접수하세요.',
        '쇼핑몰을 꼭 신고하세요. 신고가 쌓이면 광고가 내려가고 다른 소비자의 피해를 막을 수 있습니다.',
      ],
    },
    reportTo: ['ftc', 'ic3'],
  },
  {
    slug: 'job-scams',
    icon: 'briefcase',
    video: {
      en: {
        provider: 'vimeo',
        id: '352603068',
        page: 'https://consumer.ftc.gov/media/video-0184-avoid-work-home-scams',
        seconds: 180,
        source: FTC,
      },
      ko: {
        provider: 'local',
        id: '/videos/ko/job-scams.mp4',
        page: '/videos/ko/job-scams.mp4',
        seconds: 192,
        source: CRC,
      },
    },
    title: {
      en: 'Fake Job & Check Scams',
      ko: '가짜 구인·수표 사기',
    },
    tagline: {
      en: 'A "job" that sends you a check before you have done any work is reaching for your bank account.',
      ko: '일을 시작하기도 전에 수표부터 보내는 "회사"는 사실 내 은행 계좌를 노리고 있습니다.',
    },
    what: {
      en: 'A recruiter contacts you by text, WhatsApp, KakaoTalk, or through a real job site, offering easy remote work with good pay: data entry, product reviews, "task" apps, or package reshipping. Some send a realistic check to buy "equipment" and tell you to wire the leftover money to a "vendor." The check later bounces, and the money you sent came out of your own account. Others make you complete small paid tasks, then require "deposits" to unlock bigger earnings. Some are only after the personal information on your "employment forms," like your SSN and bank details.',
      ko: '문자, WhatsApp, 카카오톡, 혹은 실제 구직 사이트를 통해 리크루터가 연락해 옵니다. 재택 데이터 입력, 상품 리뷰, "미션 수행" 앱, 택배 재발송처럼 쉬운데 보수가 좋은 일자리를 제안합니다. 어떤 곳은 "장비 구입비"라며 진짜 같은 수표를 보내 주고, 남은 돈을 "거래처"에 송금하라고 합니다. 그 수표는 나중에 부도 처리되고, 이미 보낸 돈은 내 계좌에서 빠져나간 것입니다. 소액 보수를 주며 작은 미션을 시키다가, 더 큰 수익을 "해제"하려면 보증금을 내라는 수법도 있습니다. 처음부터 "입사 서류"에 적는 소셜시큐리티 번호(SSN)와 은행 정보만 노리는 경우도 있습니다.',
    },
    warningSigns: {
      en: [
        'You are offered a job, or even hired, without a real interview.',
        'The "employer" sends a check and tells you to buy equipment from their vendor and wire back the rest.',
        'You must pay first: training fees, deposits, or "task upgrades" to unlock your earnings.',
        'They ask for your SSN, driver\'s license, or bank login early, before any real hiring process.',
        'All communication happens in chat apps, and the company\'s email is a free Gmail-style address.',
        'The pay is far above normal for very simple work, like hundreds of dollars a day for clicking "like."',
      ],
      ko: [
        '제대로 된 면접도 없이 일자리를 제안하거나 바로 채용됐다고 합니다.',
        '"회사"가 수표를 보내며 지정 업체에서 장비를 사고 남은 돈은 송금해 돌려달라고 합니다.',
        '수익을 받으려면 먼저 돈을 내야 합니다. 교육비, 보증금, "미션 업그레이드" 비용 등입니다.',
        '정식 채용 절차도 없이 SSN, 운전면허증, 은행 로그인 정보부터 요구합니다.',
        '모든 연락이 채팅 앱으로만 이루어지고, 회사 이메일이 Gmail 같은 무료 주소입니다.',
        '"좋아요" 누르기 같은 아주 단순한 일에 하루 수백 달러처럼 비정상적으로 높은 보수를 약속합니다.',
      ],
    },
    protect: {
      en: [
        'A real employer never sends money before you work, and never asks you to send money back. Both are proof of a scam.',
        'Never deposit a check from a company you have not verified, and never wire "leftover" money from any check.',
        'Look up the company yourself: official website, phone number, and reviews. Then call the company directly to confirm the job posting is real.',
        'Give your SSN and bank details only after a verified offer, for payroll, from a company you confirmed.',
        'Be suspicious of jobs offered by text out of nowhere. Real recruiters do not hire strangers by chat.',
      ],
      ko: [
        '진짜 회사는 일하기 전에 돈을 보내지 않고, 돈을 돌려보내라고 하지도 않습니다. 둘 다 사기의 증거입니다.',
        '확인되지 않은 회사가 보낸 수표는 입금하지 마시고, 어떤 수표든 "남은 돈"을 송금하는 일은 절대 하지 마세요.',
        '회사를 직접 검색해 공식 웹사이트, 전화번호, 후기를 확인하고, 회사에 직접 전화해 채용 공고가 진짜인지 확인하세요.',
        'SSN과 은행 정보는 채용이 확정된 뒤, 급여 지급 목적으로, 직접 확인한 회사에만 제공하세요.',
        '난데없이 문자로 오는 일자리 제안을 의심하세요. 진짜 리크루터는 채팅으로 모르는 사람을 채용하지 않습니다.',
      ],
    },
    ifHappened: {
      en: [
        'If you deposited their check, call your bank immediately. Do not spend or send any of that money.',
        'If you sent money, ask your bank or the wire service to stop or recall the transfer right away.',
        'If you shared your SSN or bank login, change your bank passwords and start at IdentityTheft.gov.',
        'Save the job posting, chat logs, and payment records, then report. Your report helps take the fake postings down.',
      ],
      ko: [
        '받은 수표를 입금했다면 즉시 은행에 전화하세요. 그 돈은 쓰지도, 보내지도 마세요.',
        '이미 돈을 보냈다면 즉시 은행이나 송금 회사에 정지·회수를 요청하세요.',
        'SSN이나 은행 로그인 정보를 알려줬다면 은행 비밀번호를 바꾸고 IdentityTheft.gov에서 절차를 시작하세요.',
        '채용 공고, 대화 내용, 송금 기록을 저장한 뒤 신고하세요. 신고가 가짜 공고를 내리는 데 도움이 됩니다.',
      ],
    },
    reportTo: ['ftc', 'ic3'],
  },
  {
    slug: 'mail-lottery',
    icon: 'gift',
    video: {
      en: {
        provider: 'youtube',
        id: 'ZYHYcZJIBjY',
        page: 'https://www.youtube.com/watch?v=ZYHYcZJIBjY',
        seconds: 114,
        source: USPIS,
      },
      ko: {
        provider: 'local',
        id: '/videos/ko/mail-lottery.mp4',
        page: '/videos/ko/mail-lottery.mp4',
        seconds: 204,
        source: CRC,
      },
    },
    title: {
      en: 'Lottery & Sweepstakes Mail Scams',
      ko: '복권·경품 당첨 우편 사기',
    },
    tagline: {
      en: 'If you have to pay to collect a "prize," there is no prize.',
      ko: '"당첨금"을 받으려면 먼저 돈을 내야 한다면, 당첨금은 없습니다.',
    },
    what: {
      en: 'A letter arrives saying you won a lottery, a sweepstakes, or a foreign inheritance, often with official-looking seals and stamps. To collect, you just need to pay a "processing fee," "taxes," or "customs charges" first. Some letters even include a real-looking check: you deposit it, send back a portion of the money, and days later the bank tells you the check was fake, and the money you sent came out of your own account. Remember: you cannot win a lottery you never entered, and legitimate prizes never require payment up front.',
      ko: '복권이나 경품에 당첨됐다, 해외에서 유산을 상속받게 됐다는 편지가 옵니다. 공식 문서처럼 보이는 도장과 직인이 찍혀 있는 경우도 많습니다. 당첨금을 받으려면 "수속비", "세금", "통관 수수료"를 먼저 내라고 합니다. 진짜처럼 보이는 수표가 동봉된 경우도 있습니다. 수표를 입금하고 일부 금액을 돌려보내면, 며칠 뒤 은행에서 수표가 위조였다고 알려 옵니다. 이미 보낸 돈은 내 계좌에서 빠져나간 것입니다. 기억하세요. 응모한 적 없는 복권에 당첨될 수는 없고, 진짜 당첨금은 절대 먼저 돈을 요구하지 않습니다.',
    },
    warningSigns: {
      en: [
        'You "won" a lottery or sweepstakes you never entered, often a foreign one (Spanish, Canadian, Australian lottery).',
        'You must pay a fee, taxes, or shipping before receiving the prize.',
        'The letter includes a check and instructions to deposit it and send part of the money back.',
        'You are told to keep the winnings confidential until the money is "processed."',
        'They ask you to respond quickly and pay by gift card, wire transfer, or money order.',
        'The letter claims a distant relative or a dying stranger overseas left you a large inheritance.',
      ],
      ko: [
        '응모한 적도 없는 복권이나 경품에 "당첨"됐다고 합니다. 스페인, 캐나다, 호주 등 외국 복권인 경우가 많습니다.',
        '당첨금을 받기 전에 수수료, 세금, 배송비를 먼저 내라고 합니다.',
        '수표가 동봉되어 있고, 입금한 뒤 일부 금액을 돌려보내라는 안내가 있습니다.',
        '돈이 "처리"될 때까지 당첨 사실을 비밀로 하라고 합니다.',
        '빨리 답하라고 재촉하며 기프트카드, 송금, 우편환(머니오더)으로 돈을 내라고 합니다.',
        '먼 친척이나 해외의 낯선 사람이 죽으면서 큰 유산을 남겼다고 합니다.',
      ],
    },
    protect: {
      en: [
        'Real lotteries and sweepstakes never ask winners to pay anything. Taxes on real winnings are handled after you receive the money, through the IRS, not by wiring cash to a stranger.',
        'Never deposit a check from someone you do not know, and never send money back from a deposited check. Banks can take weeks to discover a fake.',
        'If you did not enter, you did not win. Throw the letter away, or better, keep it and report it.',
        'Do not call the phone number in the letter, even out of curiosity. Responding marks you as a target for more scam mail.',
        'Check on older family members\' mail. These letters heavily target seniors, and one response brings many more letters.',
      ],
      ko: [
        '진짜 복권과 경품은 당첨자에게 어떤 돈도 요구하지 않습니다. 진짜 당첨금의 세금은 돈을 받은 뒤 IRS를 통해 처리하는 것이지, 모르는 사람에게 송금하는 것이 아닙니다.',
        '모르는 사람이 보낸 수표는 입금하지 마시고, 입금한 수표에서 돈을 돌려보내는 일은 절대 하지 마세요. 은행이 위조 수표를 발견하기까지 몇 주가 걸릴 수 있습니다.',
        '응모하지 않았다면 당첨도 없습니다. 편지는 버리세요. 더 좋은 방법은 보관했다가 신고하는 것입니다.',
        '호기심에라도 편지에 적힌 번호로 전화하지 마세요. 반응을 보이면 사기 우편의 표적 명단에 오릅니다.',
        '연세 드신 가족의 우편물을 함께 살펴봐 주세요. 이런 편지는 어르신을 집중적으로 노리며, 한 번 답하면 훨씬 많은 편지가 쏟아집니다.',
      ],
    },
    ifHappened: {
      en: [
        'If you deposited a check, call your bank immediately. Do not spend or send any of that money, and ask the bank what to do next.',
        'If you already sent money, contact your bank or the wire service (Western Union, MoneyGram) right away to try to stop or recall the payment.',
        'Keep the letter, envelope, and check. The envelope\'s postmark helps postal inspectors track the senders.',
        'Report it even if you only lost a little or nothing at all. Every report helps investigators shut these mailings down.',
      ],
      ko: [
        '수표를 입금했다면 즉시 은행에 전화하세요. 그 돈은 쓰거나 보내지 마시고, 은행에 다음 절차를 문의하세요.',
        '이미 돈을 보냈다면 즉시 은행이나 송금 회사(Western Union, MoneyGram)에 연락해 송금 정지나 회수를 요청하세요.',
        '편지, 봉투, 수표를 버리지 말고 보관하세요. 봉투의 소인은 우정 감찰국이 발신자를 추적하는 데 도움이 됩니다.',
        '피해 금액이 적거나 없어도 신고해 주세요. 신고 하나하나가 이런 사기 우편을 차단하는 데 힘이 됩니다.',
      ],
    },
    reportTo: ['uspis', 'ftc'],
  },
];

export const scamBySlug = new Map(scamGuides.map((s) => [s.slug, s]));
