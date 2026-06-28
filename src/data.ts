import { PlantType, SeasonalNumbers, SeasonalLabels, UserPlant } from './types';
export { SPECIES_DB } from './species-db.generated';

export const COLOR_PALETTE = [
  '#4A7C59', // 포레스트 그린
  '#5E8C57', // 민트 그린
  '#6B8E5E', // 세이지
  '#5B7F91', // 스틸 블루
  '#9B59B6', // 퍼플
  '#A0698C', // 모브
  '#D4618A', // 로즈
  '#CC6B52', // 테라코타
  '#C0392B', // 레드
  '#C2873B', // 앰버
  '#E8A87C', // 피치
  '#87873F', // 올리브
];

// PoC 헬퍼: 계절 구분 없이 동일한 값 사용
const days = (n: number): SeasonalNumbers => ({ spring: n, summer: n, autumn: n, winter: n });
const lbl  = (s: string): SeasonalLabels  => ({ spring: s, summer: s, autumn: s, winter: s });


const init = (name: string, speciesName: string, sci: string, type: PlantType, color: string, w: SeasonalNumbers, wt: SeasonalLabels, light: string, temp: string) =>
  ({ name, speciesName, sci, type, color, waterIntervalDays: w, waterTiming: wt, light, temp });

export const DEMO_PLANTS: UserPlant[] = [
  { id: 'demo_mon',   speciesId: 'sp_mon',   speciesName: '몬스테라',   name: '몬스테라',   sci: 'Monstera deliciosa',     type: 'tropical',  color: '#4A7C59', waterIntervalDays: days(7),  waterTiming: lbl('겉흙 마르면'),    light: '밝은 간접광',   temp: '18–27°C', registeredAt: '2025-03-12', wateringLogs: ['2026-05-21','2026-05-28','2026-06-04','2026-06-11','2026-06-18'], initialData: init('몬스테라',   '몬스테라',   'Monstera deliciosa',     'tropical',  '#4A7C59', days(7),  lbl('겉흙 마르면'),    '밝은 간접광',   '18–27°C') },
  { id: 'demo_stuki', speciesId: 'sp_stuki', speciesName: '스투키',     name: '스투키',     sci: 'Sansevieria cylindrica', type: 'stuckyi',   color: '#5B7F91', waterIntervalDays: days(14), waterTiming: lbl('흙 대부분 마르면'), light: '반음지·음지 OK', temp: '16–30°C', registeredAt: '2024-11-02', wateringLogs: ['2026-05-11','2026-05-25','2026-06-08'],                           initialData: init('스투키',     '스투키',     'Sansevieria cylindrica', 'stuckyi',   '#5B7F91', days(14), lbl('흙 대부분 마르면'), '반음지·음지 OK', '16–30°C') },
  { id: 'demo_yaja',  speciesId: 'sp_yaja',  speciesName: '테이블야자', name: '테이블야자', sci: 'Chamaedorea elegans',    type: 'palm',      color: '#C2873B', waterIntervalDays: days(5),  waterTiming: lbl('촉촉하게 유지'),  light: '밝은 간접광',   temp: '18–24°C', registeredAt: '2025-09-30', wateringLogs: ['2026-05-26','2026-06-01','2026-06-06','2026-06-13'],             initialData: init('테이블야자', '테이블야자', 'Chamaedorea elegans',    'palm',      '#C2873B', days(5),  lbl('촉촉하게 유지'),  '밝은 간접광',   '18–24°C') },
  { id: 'demo_succ',  speciesId: 'sp_succ',  speciesName: '다육이',     name: '다육이',     sci: 'Echeveria elegans',      type: 'succulent', color: '#A0698C', waterIntervalDays: days(21), waterTiming: lbl('흙 대부분 마르면'), light: '직사광·양지',   temp: '10–28°C', registeredAt: '2025-06-18', wateringLogs: ['2026-05-04','2026-05-25','2026-06-15'],                           initialData: init('다육이',     '다육이',     'Echeveria elegans',      'succulent', '#A0698C', days(21), lbl('흙 대부분 마르면'), '직사광·양지',   '10–28°C') },
  { id: 'demo_olive', speciesId: 'sp_olive', speciesName: '올리브나무', name: '올리브나무', sci: 'Olea europaea',          type: 'tree',      color: '#87873F', waterIntervalDays: days(9),  waterTiming: lbl('겉흙 마르면'),    light: '직사광 좋아함', temp: '15–28°C', registeredAt: '2025-04-21', wateringLogs: ['2026-05-16','2026-05-25','2026-06-03','2026-06-12'],             initialData: init('올리브나무', '올리브나무', 'Olea europaea',          'tree',      '#87873F', days(9),  lbl('겉흙 마르면'),    '직사광 좋아함', '15–28°C') },
];
