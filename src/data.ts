import { PlantSpecies, UserPlant } from './types';

export const SPECIES_DB: PlantSpecies[] = [
  { id: 'sp_mon',    name: '몬스테라',   sci: 'Monstera deliciosa',      type: 'monstera',  color: '#5E8C57', intervalDays: 7,  light: '밝은 간접광',    waterTiming: '겉흙 마르면',      temp: '18–27°C', amount: '한 컵 (250ml)',    desc: '잎의 갈라진 구멍이 매력적인 식집사 입문 1순위. 통풍을 좋아하고 과습에 약해요.' },
  { id: 'sp_stuki',  name: '스투키',     sci: 'Sansevieria cylindrica',  type: 'snake',     color: '#5B7F91', intervalDays: 14, light: '반양지·음지 OK',  waterTiming: '흙 완전히 마르면', temp: '16–30°C', amount: '반 컵 (120ml)',    desc: '물을 자주 안 줘도 잘 크는 게으른 식집사의 친구. 공기정화 능력도 좋아요.' },
  { id: 'sp_yaja',   name: '테이블야자', sci: 'Chamaedorea elegans',     type: 'palm',      color: '#C2873B', intervalDays: 5,  light: '밝은 간접광',    waterTiming: '겉흙 마르기 전',   temp: '18–24°C', amount: '한 컵 (250ml)',    desc: '잎이 부채처럼 퍼지는 작은 야자. 건조에 약해 흙이 촉촉한 걸 좋아해요.' },
  { id: 'sp_succ',   name: '다육이',     sci: 'Echeveria elegans',       type: 'succulent', color: '#A0698C', intervalDays: 21, light: '직사광·양지',    waterTiming: '흙 바싹 마르면',   temp: '10–28°C', amount: '조금 (60ml)',      desc: '통통한 잎에 물을 저장하는 작은 장미. 햇빛은 듬뿍, 물은 아주 가끔.' },
  { id: 'sp_olive',  name: '올리브나무', sci: 'Olea europaea',           type: 'olive',     color: '#87873F', intervalDays: 9,  light: '직사광 좋아함',  waterTiming: '겉흙 마르면',      temp: '15–28°C', amount: '한 컵 반 (350ml)', desc: '은빛 잎이 살랑이는 지중해 감성. 햇빛을 충분히 받아야 건강해요.' },
  { id: 'sp_san',    name: '산세베리아', sci: 'Dracaena trifasciata',    type: 'snake',     color: '#5B7F91', intervalDays: 14, light: '반양지·음지 OK',  waterTiming: '흙 완전히 마르면', temp: '16–30°C', amount: '반 컵 (120ml)',    desc: '세로로 길게 뻗는 단단한 잎. 초보자도 좀처럼 죽이기 어려운 효자예요.' },
  { id: 'sp_spathi', name: '스파티필름', sci: 'Spathiphyllum',           type: 'monstera',  color: '#5E8C57', intervalDays: 4,  light: '반음지',         waterTiming: '겉흙 마르면 바로', temp: '18–26°C', amount: '한 컵 (250ml)',    desc: '목마르면 잎을 축 늘어뜨려 신호를 보내는 솔직한 친구. 물을 좋아해요.' },
  { id: 'sp_haeng',  name: '행운목',     sci: 'Dracaena fragrans',       type: 'palm',      color: '#C2873B', intervalDays: 10, light: '밝은 간접광',    waterTiming: '겉흙 마르면',      temp: '18–25°C', amount: '한 컵 (250ml)',    desc: '곧게 자라는 굵은 줄기가 듬직한 행운의 나무. 관리가 수월해요.' },
  { id: 'sp_yulma',  name: '율마',       sci: 'Cupressus macrocarpa',    type: 'olive',     color: '#87873F', intervalDays: 4,  light: '직사광 좋아함',  waterTiming: '겉흙 마르기 전',   temp: '15–25°C', amount: '한 컵 (250ml)',    desc: '레몬향이 나는 보송한 침엽수. 건조에 약하니 물을 잘 챙겨주세요.' },
  { id: 'sp_gomu',   name: '고무나무',   sci: 'Ficus elastica',          type: 'monstera',  color: '#5E8C57', intervalDays: 8,  light: '밝은 간접광',    waterTiming: '겉흙 마르면',      temp: '16–28°C', amount: '한 컵 (250ml)',    desc: '두껍고 윤기나는 잎이 인테리어로 인기. 튼튼하고 키우기 쉬워요.' },
];

export const DEMO_PLANTS: UserPlant[] = [
  { id: 'demo_mon',   name: '몬스테라',   sci: 'Monstera deliciosa',     type: 'monstera',  color: '#5E8C57', intervalDays: 7,  registeredAt: '2025-03-12', light: '밝은 간접광',   waterTiming: '겉흙 마르면',      temp: '18–27°C', amount: '한 컵 (250ml)',    wateringLogs: ['2026-05-21','2026-05-28','2026-06-04','2026-06-11','2026-06-18'] },
  { id: 'demo_stuki', name: '스투키',     sci: 'Sansevieria cylindrica', type: 'snake',     color: '#5B7F91', intervalDays: 14, registeredAt: '2024-11-02', light: '반양지·음지 OK', waterTiming: '흙 완전히 마르면', temp: '16–30°C', amount: '반 컵 (120ml)',    wateringLogs: ['2026-05-11','2026-05-25','2026-06-08'] },
  { id: 'demo_yaja',  name: '테이블야자', sci: 'Chamaedorea elegans',    type: 'palm',      color: '#C2873B', intervalDays: 5,  registeredAt: '2025-09-30', light: '밝은 간접광',   waterTiming: '겉흙 마르기 전',   temp: '18–24°C', amount: '한 컵 (250ml)',    wateringLogs: ['2026-05-26','2026-06-01','2026-06-06','2026-06-13'] },
  { id: 'demo_succ',  name: '다육이',     sci: 'Echeveria elegans',      type: 'succulent', color: '#A0698C', intervalDays: 21, registeredAt: '2025-06-18', light: '직사광·양지',   waterTiming: '흙 바싹 마르면',   temp: '10–28°C', amount: '조금 (60ml)',      wateringLogs: ['2026-05-04','2026-05-25','2026-06-15'] },
  { id: 'demo_olive', name: '올리브나무', sci: 'Olea europaea',          type: 'olive',     color: '#87873F', intervalDays: 9,  registeredAt: '2025-04-21', light: '직사광 좋아함', waterTiming: '겉흙 마르면',      temp: '15–28°C', amount: '한 컵 반 (350ml)', wateringLogs: ['2026-05-16','2026-05-25','2026-06-03','2026-06-12'] },
];
