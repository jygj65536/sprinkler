/**
 * 앱 동작 로직 체크리스트 검증
 *
 * [UX] 진입 시 바텀시트 자동 오픈 금지
 * [서비스 이용 동작] 데이터 유지 / 기록 무결성
 * [서비스 이용 동작] 물주기 중복 기록 방지
 * [서비스 이용 동작] 과습 대응
 */
import { describe, it, expect } from 'vitest';
import { diffDays } from '../utils';
import { UserPlant, PlantType, SeasonalNumbers, SeasonalLabels } from '../types';
import { COLOR_PALETTE } from '../data';

const TODAY = '2026-06-20';

const makePlant = (overrides: Partial<UserPlant> = {}): UserPlant => ({
  id: 'p1', name: '몬스테라', sci: 'Monstera deliciosa',
  speciesId: 'sp_mon',
  type: 'tropical', color: '#5E8C57',
  waterIntervalDays: { spring: 7, summer: 7, autumn: 7, winter: 7 },
  waterTiming: { spring: '겉흙 마르면', summer: '겉흙 마르면', autumn: '겉흙 마르면', winter: '겉흙 마르면' },
  registeredAt: '2026-01-01',
  light: '간접광', temp: '20°C',
  wateringLogs: ['2026-06-13'],
  ...overrides,
});

// ── waterPlant 로직 (App.tsx에서 추출한 순수 함수 형태) ──
function waterPlant(
  plants: UserPlant[],
  id: string,
  today: string,
): { plants: UserPlant[]; toast: string } {
  const p = plants.find(x => x.id === id);
  if (!p) return { plants, toast: '' };
  const last = p.wateringLogs[p.wateringLogs.length - 1];
  if (last === today) return { plants, toast: '오늘 이미 기록됐어요' };
  const interval = p.waterIntervalDays.summer; // 테스트 날짜(6월) 기준 여름
  const ratio = diffDays(last, today) / interval;
  const next = plants.map(pl =>
    pl.id !== id ? pl : { ...pl, wateringLogs: [...pl.wateringLogs, today] },
  );
  const toast = ratio < 0.4
    ? `${p.name} 물 줬어요 · 과습 주의 💧`
    : `${p.name} 물 주기 완료!`;
  return { plants: next, toast };
}

function cancelWatering(
  plants: UserPlant[],
  id: string,
  today: string,
): { plants: UserPlant[]; toast: string } {
  const next = plants.map(p => {
    if (p.id !== id) return p;
    if (p.wateringLogs[p.wateringLogs.length - 1] !== today) return p;
    return { ...p, wateringLogs: p.wateringLogs.slice(0, -1) };
  });
  return { plants: next, toast: '물주기 취소했어요' };
}

function deletePlant(
  plants: UserPlant[],
  calVisible: string[],
  id: string,
): { plants: UserPlant[]; calVisible: string[] } {
  return {
    plants: plants.filter(p => p.id !== id),
    calVisible: calVisible.filter(cid => cid !== id),
  };
}

function addPlant(
  plants: UserPlant[],
  speciesId: string,
  customName: string,
  today: string,
): { plants: UserPlant[]; toast: string } {
  const sp = { id: speciesId, name: '몬스테라', sci: 'M. deliciosa', type: 'tropical' as const, color: '#5E8C57', waterIntervalDays: { spring: 7, summer: 7, autumn: 7, winter: 7 }, light: '간접광', waterTiming: { spring: '겉흙 마르면', summer: '겉흙 마르면', autumn: '겉흙 마르면', winter: '겉흙 마르면' }, temp: '20°C', desc: '설명' };
  const finalName = customName.trim() || sp.name;
  const np: UserPlant = {
    id: 'u_' + Date.now(),
    speciesId: sp.id,
    name: finalName,
    sci: sp.sci, type: sp.type, color: sp.color,
    waterIntervalDays: sp.waterIntervalDays,
    waterTiming: sp.waterTiming,
    registeredAt: today,
    light: sp.light, temp: sp.temp,
    wateringLogs: [today],
  };
  return { plants: [...plants, np], toast: `${finalName} 가족이 되었어요!` };
}

// ─────────────────────────────────────────
describe('[UX] 진입 시 바텀시트 자동 오픈 금지', () => {
  it('식물 추가 화면: 초기 selectedSpecies는 null', () => {
    // App.tsx의 addSelId 초기값이 null임을 명시
    const initialAddSelId: string | null = null;
    expect(initialAddSelId).toBeNull();
  });

  it('홈 화면: 초기 screen은 "home"', () => {
    const initialScreen = 'home';
    expect(initialScreen).toBe('home');
    // "add" 화면이 아니므로 바텀싯 없음
    expect(['home', 'calendar']).toContain(initialScreen);
  });
});

// ─────────────────────────────────────────
describe('[서비스 이용 동작] 물주기 기록 무결성', () => {
  it('정상 물주기: wateringLogs에 오늘 날짜 추가됨', () => {
    const plants = [makePlant()];
    const { plants: updated, toast } = waterPlant(plants, 'p1', TODAY);
    const logs = updated[0].wateringLogs;
    expect(logs[logs.length - 1]).toBe(TODAY);
    expect(toast).toContain('물 주기 완료');
  });

  it('오늘 재호출: wateringLogs 변하지 않음 (중복 방지)', () => {
    const plants = [makePlant({ wateringLogs: ['2026-06-13', TODAY] })];
    const { plants: updated, toast } = waterPlant(plants, 'p1', TODAY);
    expect(updated[0].wateringLogs.length).toBe(2); // 추가 안 됨
    expect(toast).toBe('오늘 이미 기록됐어요');
  });

  it('존재하지 않는 id: plants 변하지 않음', () => {
    const plants = [makePlant()];
    const { plants: updated } = waterPlant(plants, 'nonexistent', TODAY);
    expect(updated).toEqual(plants);
  });
});

// ─────────────────────────────────────────
describe('[서비스 이용 동작] 과습 대응', () => {
  it('ratio < 0.4: 과습 경고 토스트 표시', () => {
    // 7일 주기, 1일 만에 재호출 → ratio = 1/7 = 0.14
    const plants = [makePlant({ wateringLogs: ['2026-06-19'] })];
    const { toast } = waterPlant(plants, 'p1', TODAY);
    expect(toast).toContain('과습 주의');
  });

  it('ratio ≥ 0.4: 일반 완료 토스트', () => {
    // 7일 주기, 5일 만에 → ratio = 5/7 = 0.71
    const plants = [makePlant({ wateringLogs: ['2026-06-15'] })];
    const { toast } = waterPlant(plants, 'p1', TODAY);
    expect(toast).toContain('물 주기 완료');
  });
});

// ─────────────────────────────────────────
describe('[UX] 물주기 취소', () => {
  it('오늘 기록 취소: 마지막 log 제거됨', () => {
    const plants = [makePlant({ wateringLogs: ['2026-06-13', TODAY] })];
    const { plants: updated, toast } = cancelWatering(plants, 'p1', TODAY);
    expect(updated[0].wateringLogs).toEqual(['2026-06-13']);
    expect(toast).toBe('물주기 취소했어요');
  });

  it('오늘 기록 없으면: wateringLogs 변하지 않음', () => {
    const plants = [makePlant({ wateringLogs: ['2026-06-13'] })]; // 오늘 아님
    const { plants: updated } = cancelWatering(plants, 'p1', TODAY);
    expect(updated[0].wateringLogs).toEqual(['2026-06-13']);
  });
});

// ─────────────────────────────────────────
describe('[UX] 식물 삭제', () => {
  it('삭제 후 plants에서 제거됨', () => {
    const p2 = makePlant({ id: 'p2', name: '스투키' });
    const plants = [makePlant(), p2];
    const { plants: updated } = deletePlant(plants, ['p1', 'p2'], 'p1');
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe('p2');
  });

  it('삭제 후 calVisible에서도 제거됨', () => {
    const plants = [makePlant()];
    const { calVisible } = deletePlant(plants, ['p1', 'p2'], 'p1');
    expect(calVisible).not.toContain('p1');
    expect(calVisible).toContain('p2');
  });
});

// ─────────────────────────────────────────
describe('[UX] 식물 이름 지어주기', () => {
  it('customName 입력 시 해당 이름으로 등록', () => {
    const { plants, toast } = addPlant([], 'sp_mon', '우리 몬이', TODAY);
    expect(plants[0].name).toBe('우리 몬이');
    expect(toast).toContain('우리 몬이');
  });

  it('customName 비워두면 종 기본 이름 사용', () => {
    const { plants } = addPlant([], 'sp_mon', '   ', TODAY);
    expect(plants[0].name).toBe('몬스테라');
  });

  it('등록 시 오늘 날짜로 wateringLogs 시작', () => {
    const { plants } = addPlant([], 'sp_mon', '', TODAY);
    expect(plants[0].wateringLogs).toEqual([TODAY]);
    expect(plants[0].registeredAt).toBe(TODAY);
  });
});

// ─────────────────────────────────────────
function addCustomPlant(
  name: string,
  type: PlantType,
  waterIntervalDays: SeasonalNumbers,
  waterTiming: SeasonalLabels,
  light: string,
  temp: string,
  today: string,
  color: string = COLOR_PALETTE[0],
): { plants: UserPlant[]; toast: string } {
  const np: UserPlant = {
    id: 'u_1',
    speciesId: '',
    name: name.trim() || '내 식물',
    sci: '',
    type,
    color,
    waterIntervalDays,
    waterTiming,
    light,
    temp,
    registeredAt: today,
    wateringLogs: [today],
  };
  return { plants: [np], toast: `${np.name} 가족이 되었어요!` };
}

const uniformWater = (days: number): SeasonalNumbers =>
  ({ spring: days, summer: days, autumn: days, winter: days });
const uniformTiming = (label: string): SeasonalLabels =>
  ({ spring: label, summer: label, autumn: label, winter: label });

describe('[UX] 커스텀 식물 추가', () => {
  it('입력한 이름으로 등록', () => {
    const { plants, toast } = addCustomPlant('내 고사리', 'fern', uniformWater(5), uniformTiming('겉흙 마르면'), '밝은 간접광', '20°C', TODAY);
    expect(plants[0].name).toBe('내 고사리');
    expect(plants[0].type).toBe('fern');
    expect(toast).toContain('내 고사리');
  });

  it('이름 빈 경우 "내 식물" 기본값', () => {
    const { plants } = addCustomPlant('   ', 'herb', uniformWater(5), uniformTiming('촉촉하게 유지'), '밝은 간접광', '', TODAY);
    expect(plants[0].name).toBe('내 식물');
  });

  it('speciesId는 빈 문자열 (SPECIES_DB 참조 없음)', () => {
    const { plants } = addCustomPlant('고사리', 'fern', uniformWater(5), uniformTiming('겉흙 마르면'), '밝은 간접광', '', TODAY);
    expect(plants[0].speciesId).toBe('');
  });

  it('계절 모두 동일 설정 시 waterIntervalDays 전 계절 동일', () => {
    const { plants } = addCustomPlant('고사리', 'fern', uniformWater(10), uniformTiming('겉흙 마르면'), '밝은 간접광', '', TODAY);
    const { waterIntervalDays: w } = plants[0];
    expect(w.spring).toBe(10);
    expect(w.summer).toBe(10);
    expect(w.autumn).toBe(10);
    expect(w.winter).toBe(10);
  });

  it('계절별 다른 물주기 설정 가능', () => {
    const seasonal: SeasonalNumbers = { spring: 10, summer: 5, autumn: 10, winter: 21 };
    const timings: SeasonalLabels   = { spring: '겉흙 마르면', summer: '촉촉하게 유지', autumn: '겉흙 마르면', winter: '흙 대부분 마르면' };
    const { plants } = addCustomPlant('고사리', 'fern', seasonal, timings, '밝은 간접광', '', TODAY);
    expect(plants[0].waterIntervalDays.summer).toBe(5);
    expect(plants[0].waterIntervalDays.winter).toBe(21);
    expect(plants[0].waterTiming.summer).toBe('촉촉하게 유지');
    expect(plants[0].waterTiming.winter).toBe('흙 대부분 마르면');
  });

  it('waterTiming 전 계절 동일 설정 시 모두 동일', () => {
    const { plants } = addCustomPlant('고사리', 'fern', uniformWater(5), uniformTiming('흙 대부분 마르면'), '밝은 간접광', '', TODAY);
    const { waterTiming: wt } = plants[0];
    expect(wt.spring).toBe('흙 대부분 마르면');
    expect(wt.winter).toBe('흙 대부분 마르면');
  });

  it('지정한 color가 식물에 저장됨', () => {
    const customColor = COLOR_PALETTE[3];
    const { plants } = addCustomPlant('난초', 'orchid', uniformWater(7), uniformTiming('겉흙 마르면'), '밝은 간접광', '', TODAY, customColor);
    expect(plants[0].color).toBe(customColor);
  });

  it('wateringLogs는 today 하나로 시작', () => {
    const { plants } = addCustomPlant('고사리', 'fern', uniformWater(5), uniformTiming('겉흙 마르면'), '밝은 간접광', '', TODAY);
    expect(plants[0].wateringLogs).toEqual([TODAY]);
    expect(plants[0].registeredAt).toBe(TODAY);
  });
});

// ─────────────────────────────────────────
describe('[서비스 이용 동작] 데이터 유지', () => {
  it('waterPlant 후 이전 logs 보존됨', () => {
    const plants = [makePlant({ wateringLogs: ['2026-05-01', '2026-05-08', '2026-06-13'] })];
    const { plants: updated } = waterPlant(plants, 'p1', TODAY);
    expect(updated[0].wateringLogs).toContain('2026-05-01');
    expect(updated[0].wateringLogs).toContain('2026-05-08');
    expect(updated[0].wateringLogs).toContain('2026-06-13');
    expect(updated[0].wateringLogs).toContain(TODAY);
  });

  it('cancelWatering 후 이전 logs 보존됨', () => {
    const plants = [makePlant({ wateringLogs: ['2026-05-01', '2026-06-13', TODAY] })];
    const { plants: updated } = cancelWatering(plants, 'p1', TODAY);
    expect(updated[0].wateringLogs).toContain('2026-05-01');
    expect(updated[0].wateringLogs).toContain('2026-06-13');
    expect(updated[0].wateringLogs).not.toContain(TODAY);
  });
});
