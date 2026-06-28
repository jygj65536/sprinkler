/**
 * 핵심 비즈니스 로직 테스트
 * 체크리스트 대응: [서비스 이용 동작] UI 컴포넌트 의도대로 동작
 *               [서비스 이용 동작] 데이터 유지 (물주기 상태 계산)
 */
import { describe, it, expect } from 'vitest';
import {
  diffDays, addDays, fmtDate, parseDate, hexAlpha,
  getStatus, getDueInfo,
  buildCalendarWeeks, buildMiniCalendar,
} from '../utils';
import { UserPlant } from '../types';

// 테스트용 기본 식물 (물주기 7일 주기)
const makePlant = (overrides: Partial<UserPlant> = {}): UserPlant => ({
  id: 'test', name: '테스트', sci: 'Test plant',
  speciesId: 'sp_test',
  type: 'tropical', color: '#5E8C57',
  waterIntervalDays: { spring: 7, summer: 7, autumn: 7, winter: 7 },
  waterTiming: { spring: '겉흙 마르면', summer: '겉흙 마르면', autumn: '겉흙 마르면', winter: '겉흙 마르면' },
  registeredAt: '2026-01-01',
  light: '간접광', temp: '20°C',
  wateringLogs: ['2026-06-13'],
  ...overrides,
});

// ────────────────────────────────────────
describe('날짜 유틸', () => {
  it('diffDays: 같은 날은 0', () => {
    expect(diffDays('2026-06-01', '2026-06-01')).toBe(0);
  });

  it('diffDays: 7일 차이', () => {
    expect(diffDays('2026-06-01', '2026-06-08')).toBe(7);
  });

  it('diffDays: 음수 (과거가 두 번째)', () => {
    expect(diffDays('2026-06-08', '2026-06-01')).toBe(-7);
  });

  it('addDays: n일 더하기', () => {
    expect(addDays('2026-06-01', 7)).toBe('2026-06-08');
  });

  it('addDays: 월 경계 넘김', () => {
    expect(addDays('2026-05-30', 5)).toBe('2026-06-04');
  });

  it('addDays: 음수 (과거로)', () => {
    expect(addDays('2026-06-08', -7)).toBe('2026-06-01');
  });

  it('fmtDate: 형식 확인', () => {
    expect(fmtDate('2026-06-20')).toBe('6월 20일');
  });

  it('parseDate: ISO → Date 복원', () => {
    const d = parseDate('2026-06-20');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // 0-indexed
    expect(d.getDate()).toBe(20);
  });

  it('hexAlpha: 투명도 포함 rgba 변환', () => {
    expect(hexAlpha('#5E8C57', 0.5)).toBe('rgba(94,140,87,0.5)');
  });
});

// ────────────────────────────────────────
describe('getStatus — 물주기 건강 상태', () => {
  // 체크리스트: [서비스 이용 동작] 모든 UI 컴포넌트 의도대로 동작
  const TODAY = '2026-06-20';

  it('촉촉해요 (ratio < 0.7): 마지막 물주기 4일 전 (7일 주기)', () => {
    const p = makePlant({ wateringLogs: ['2026-06-16'] }); // 4일 전, ratio=0.57
    const s = getStatus(p, TODAY);
    expect(s.key).toBe('healthy');
    expect(s.label).toBe('촉촉해요');
    expect(s.daysSince).toBe(4);
  });

  it('곧 목말라요 (0.7 ≤ ratio < 1): 마지막 물주기 5일 전 (7일 주기)', () => {
    const p = makePlant({ wateringLogs: ['2026-06-15'] }); // 5일 전, ratio=0.71
    const s = getStatus(p, TODAY);
    expect(s.key).toBe('thirsty');
    expect(s.label).toBe('곧 목말라요');
  });

  it('물 주세요! (ratio ≥ 1): 마지막 물주기 7일 이상 전', () => {
    const p = makePlant({ wateringLogs: ['2026-06-13'] }); // 7일 전, ratio=1.0
    const s = getStatus(p, TODAY);
    expect(s.key).toBe('urgent');
    expect(s.label).toBe('물 주세요!');
  });

  it('과습 구간 (ratio 0.4 미만): 여전히 촉촉해요', () => {
    const p = makePlant({ wateringLogs: ['2026-06-19'] }); // 1일 전, ratio=0.14
    const s = getStatus(p, TODAY);
    expect(s.key).toBe('healthy');
  });
});

// ────────────────────────────────────────
describe('getDueInfo — 물주기 예정일', () => {
  const TODAY = '2026-06-20';

  it('미래 3일 이상: 색상은 회갈색', () => {
    const p = makePlant({ wateringLogs: ['2026-06-18'] }); // due: 06-25, 5일 뒤
    const d = getDueInfo(p, TODAY);
    expect(d.daysUntil).toBe(5);
    expect(d.text).toBe('5일 뒤');
    expect(d.color).toBe('#857B69');
  });

  it('2일 이내: 색상은 주황', () => {
    const p = makePlant({ wateringLogs: ['2026-06-13'] }); // due: 06-20, 0일
    const d = getDueInfo(p, TODAY);
    expect(d.daysUntil).toBe(0);
    expect(d.text).toBe('오늘이 그날!');
    expect(d.color).toBe('#CC6B52');
  });

  it('지난 경우: 음수 daysUntil, 빨간색', () => {
    const p = makePlant({ wateringLogs: ['2026-06-10'] }); // due: 06-17, 3일 지남
    const d = getDueInfo(p, TODAY);
    expect(d.daysUntil).toBe(-3);
    expect(d.text).toBe('3일 지났어요');
    expect(d.color).toBe('#CC6B52');
  });

  it('dueDate는 마지막 물주기 + waterIntervalDays', () => {
    const p = makePlant({ wateringLogs: ['2026-06-10'] });
    expect(getDueInfo(p, TODAY).dueDate).toBe('2026-06-17');
  });
});

// ────────────────────────────────────────
describe('buildCalendarWeeks — 달력 그리드', () => {
  const TODAY = '2026-06-20';

  it('총 셀 수는 7의 배수', () => {
    const weeks = buildCalendarWeeks(2026, 5, [], TODAY); // 6월
    const totalCells = weeks.flat().length;
    expect(totalCells % 7).toBe(0);
  });

  it('오늘 셀에 isToday=true', () => {
    const weeks = buildCalendarWeeks(2026, 5, [], TODAY);
    const todayCell = weeks.flat().find(c => c.iso === TODAY);
    expect(todayCell?.isToday).toBe(true);
  });

  it('물준 날에 pastDots 포함', () => {
    const p = makePlant({ wateringLogs: ['2026-06-10'], color: '#5E8C57' });
    const weeks = buildCalendarWeeks(2026, 5, [p], TODAY);
    const cell = weeks.flat().find(c => c.iso === '2026-06-10');
    expect(cell?.pastDots).toContain('#5E8C57');
  });

  it('단일 식물: 예정일 ±2일 구간에 bandBg 적용', () => {
    // 마지막 물주기 6-13, 7일 주기 → due 6-20, band 6-18~6-22
    const p = makePlant({ wateringLogs: ['2026-06-13'] });
    const weeks = buildCalendarWeeks(2026, 5, [p], '2026-06-19'); // today=6-19, due=6-20 미래
    const band = weeks.flat().find(c => c.iso === '2026-06-21');
    expect(band?.bandBg).not.toBe('transparent');
  });

  it('복수 식물: futureDots 사용 (band 없음)', () => {
    const p1 = makePlant({ id: 'a', wateringLogs: ['2026-06-13'], color: '#5E8C57' });
    const p2 = makePlant({ id: 'b', wateringLogs: ['2026-06-14'], color: '#C2873B' });
    const weeks = buildCalendarWeeks(2026, 5, [p1, p2], '2026-06-19');
    const dueCells = weeks.flat().filter(c => c.futureDots.length > 0);
    expect(dueCells.length).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────
describe('buildMiniCalendar — 상세 화면 달력', () => {
  it('총 셀 수는 7의 배수', () => {
    const p = makePlant({ wateringLogs: ['2026-06-10'] });
    const weeks = buildMiniCalendar(p, 2026, 5);
    expect(weeks.flat().length % 7).toBe(0);
  });

  it('물준 날은 dot=true', () => {
    const p = makePlant({ wateringLogs: ['2026-06-10'] });
    const weeks = buildMiniCalendar(p, 2026, 5);
    const cell = weeks.flat().find(c => c.day === 10 && c.dot);
    expect(cell).toBeTruthy();
  });

  it('제때 물주기: 초록색 dot', () => {
    const p = makePlant({ wateringLogs: ['2026-06-06', '2026-06-13'] }); // 7일 만에 줌
    const weeks = buildMiniCalendar(p, 2026, 5);
    const cell = weeks.flat().find(c => c.dot && c.dotCol === '#5E8C57');
    expect(cell).toBeTruthy();
  });

  it('늦은 물주기: 빨간색 dot', () => {
    const p = makePlant({ wateringLogs: ['2026-06-01', '2026-06-20'] }); // 19일 만에 줌
    const weeks = buildMiniCalendar(p, 2026, 5);
    const cell = weeks.flat().find(c => c.dot && c.dotCol === '#CC6B52');
    expect(cell).toBeTruthy();
  });
});
