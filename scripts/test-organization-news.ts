import assert from 'node:assert/strict';
import { isOrganizationNews } from '../src/data/organizationNews';
for(const title of [
 '광복회 미서남부지회 명칭 변경…해외 독립 유공자 미주총회로',
 '해외 독립유공자 미주총회 출범',
 '한인 재단 장학금 전달 행사',
 '자랑스러운 한국어 장학생들…미주한국어교육장학재단 주최',
 '미주한인이민사박물관 이사진, 총영사 관저 모임',
 '지역 봉사단체 정기총회 개최',
 '한미협회 신임 회장 취임',
 'Community foundation fundraising gala',
]) assert(isOrganizationNews({title}),title);
for(const title of ['LA 공공요금 인상 안내','가주 소비자 사기 피해 주의','재단 연구팀, 당뇨 치료 연구 결과 발표']) assert(!isOrganizationNews({title}),title);
console.log('PASS: organization and foundation announcements excluded; public-interest information retained.');
