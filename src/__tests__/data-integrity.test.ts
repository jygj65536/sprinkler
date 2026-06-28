/**
 * 데이터 무결성 테스트
 * 체크리스트 대응: [서비스 이용 동작] 모든 UI 컴포넌트 의도대로 동작
 *               [서비스 이용 동작] 데이터 유지
 */
import { describe, it, expect } from 'vitest';
import { SPECIES_DB, DEMO_PLANTS } from '../data';

describe('SPECIES_DB 무결성', () => {
  it('10종 이상 등록됨', () => {
    expect(SPECIES_DB.length).toBeGreaterThanOrEqual(10);
  });

  it.each(SPECIES_DB)('$name: 필수 필드 모두 존재', (sp) => {
    expect(sp.id).toBeTruthy();
    expect(sp.name).toBeTruthy();
    expect(sp.sci).toBeTruthy();
    expect(sp.type).toMatch(/^(fern|orchid|palm|succulent|bulb|vine|tropical|foliage|flowering|shrub|tree|herb|stuckyi|cactus)$/);
    expect(sp.waterIntervalDays.spring).toBeGreaterThan(0);
    expect(sp.light).toBeTruthy();
    expect(sp.waterTiming.spring).toBeTruthy();
    expect(sp.temp).toBeTruthy();
    expect(sp.desc).toBeTruthy();
  });

  it('id 중복 없음', () => {
    const ids = SPECIES_DB.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('DEMO_PLANTS 무결성', () => {
  it('5개 데모 식물 존재', () => {
    expect(DEMO_PLANTS.length).toBe(5);
  });

  it.each(DEMO_PLANTS)('$name: 필수 필드 및 wateringLogs 유효', (p) => {
    expect(p.id).toBeTruthy();
    expect(p.waterIntervalDays.spring).toBeGreaterThan(0);
    expect(p.wateringLogs.length).toBeGreaterThan(0);
    // 날짜 형식 확인
    p.wateringLogs.forEach(log => {
      expect(log).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it.each(DEMO_PLANTS)('$name: wateringLogs 오름차순 정렬', (p) => {
    for (let i = 1; i < p.wateringLogs.length; i++) {
      expect(p.wateringLogs[i] >= p.wateringLogs[i - 1]).toBe(true);
    }
  });

  it('id 중복 없음', () => {
    const ids = DEMO_PLANTS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
