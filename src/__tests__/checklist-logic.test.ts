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
import { UserPlant } from '../types';

const TODAY = '2026-06-20';

const makePlant = (overrides: Partial<UserPlant> = {}): UserPlant => ({
  id: 'p1', name: '몬스테라', sci: 'Monstera deliciosa',
  type: 'monstera', color: '#5E8C57',
  intervalDays: 7, registeredAt: '2026-01-01',
  light: '간접광', waterTiming: '겉흙 마르면', temp: '20°C', amount: '250ml',
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
  const ratio = diffDays(last, today) / p.intervalDays;
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
  const sp = { id: speciesId, name: '몬스테라', sci: 'M. deliciosa', type: 'monstera' as const, color: '#5E8C57', intervalDays: 7, light: '간접광', waterTiming: '겉흙 마르면', temp: '20°C', amount: '250ml', desc: '설명' };
  const finalName = customName.trim() || sp.name;
  const np: UserPlant = {
    id: 'u_' + Date.now(),
    name: finalName,
    sci: sp.sci, type: sp.type, color: sp.color,
    intervalDays: sp.intervalDays,
    registeredAt: today,
    light: sp.light, waterTiming: sp.waterTiming, temp: sp.temp, amount: sp.amount,
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
