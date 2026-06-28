import { describe, it, expect } from 'vitest';
import { wmoToWeather } from '../hooks/useWeather';

describe('wmoToWeather', () => {
  it('0 → 맑음', () => {
    expect(wmoToWeather(0).label).toBe('맑음');
  });
  it('1-3 → 구름', () => {
    expect(wmoToWeather(1).label).toBe('구름');
    expect(wmoToWeather(3).label).toBe('구름');
  });
  it('51 → 비', () => {
    expect(wmoToWeather(51).label).toBe('비');
  });
  it('71 → 눈', () => {
    expect(wmoToWeather(71).label).toBe('눈');
  });
  it('80 → 소나기', () => {
    expect(wmoToWeather(80).label).toBe('소나기');
  });
  it('95 → 천둥번개', () => {
    expect(wmoToWeather(95).label).toBe('천둥번개');
  });
  it('모든 케이스가 emoji를 반환', () => {
    [0, 1, 45, 51, 71, 80, 85, 95].forEach(code => {
      expect(wmoToWeather(code).emoji.length).toBeGreaterThan(0);
    });
  });
});
