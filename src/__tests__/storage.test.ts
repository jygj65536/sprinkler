import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import type { UserPlant } from '../types';

const FIXTURE: UserPlant[] = [
  { id: 'test_1', speciesId: 'sp_1', speciesName: '테스트', name: '테스트', sci: 'Testus plantus', type: 'foliage', color: '#5E8C57', waterIntervalDays: { spring: 7, summer: 7, autumn: 7, winter: 14 }, waterTiming: { spring: '겉흙 마르면', summer: '겉흙 마르면', autumn: '겉흙 마르면', winter: '흙 마르면' }, light: '밝은 간접광', temp: '18–27°C', registeredAt: '2025-01-01', wateringLogs: ['2025-01-08'], initialData: { name: '테스트', speciesName: '테스트', sci: 'Testus plantus', type: 'foliage', color: '#5E8C57', waterIntervalDays: { spring: 7, summer: 7, autumn: 7, winter: 14 }, waterTiming: { spring: '겉흙 마르면', summer: '겉흙 마르면', autumn: '겉흙 마르면', winter: '흙 마르면' }, light: '밝은 간접광', temp: '18–27°C' } },
];

// node 환경에 localStorage mock 주입
const makeLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear:      () => { store = {}; },
  };
};
const localStorageMock = makeLocalStorage();
beforeAll(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
});

vi.mock('@apps-in-toss/web-framework', () => ({
  Storage: { getItem: vi.fn(), setItem: vi.fn() },
}));

import { Storage } from '@apps-in-toss/web-framework';
import { savePlants, loadPlants } from '../storage';

afterEach(() => {
  vi.restoreAllMocks();
  localStorageMock.clear();
});

describe('savePlants', () => {
  it('Native Storage 성공: localStorage 미사용', async () => {
    vi.mocked(Storage.setItem).mockResolvedValue(undefined);
    const spy = vi.spyOn(localStorageMock, 'setItem');
    await savePlants(FIXTURE);
    expect(spy).not.toHaveBeenCalled();
  });

  it('Native Storage 실패 → localStorage 폴백 성공', async () => {
    vi.mocked(Storage.setItem).mockRejectedValue(new Error('SDK unavailable'));
    await savePlants(FIXTURE);
    expect(localStorageMock.getItem('sprinkler_plants_v1')).not.toBeNull();
  });

  it('두 저장소 모두 실패 → throw', async () => {
    vi.mocked(Storage.setItem).mockRejectedValue(new Error('SDK unavailable'));
    vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded'); });
    await expect(savePlants(FIXTURE)).rejects.toThrow('저장에 실패했어요');
  });
});

describe('loadPlants', () => {
  it('저장 데이터 없으면 null 반환', async () => {
    vi.mocked(Storage.getItem).mockResolvedValue(null);
    expect(await loadPlants()).toBeNull();
  });

  it('Native Storage에서 데이터 로드', async () => {
    vi.mocked(Storage.getItem).mockResolvedValue(JSON.stringify(FIXTURE));
    const result = await loadPlants();
    expect(result).toHaveLength(FIXTURE.length);
    expect(result![0].id).toBe(FIXTURE[0].id);
  });

  it('Native Storage 실패 → localStorage 폴백', async () => {
    vi.mocked(Storage.getItem).mockRejectedValue(new Error('SDK unavailable'));
    localStorageMock.setItem('sprinkler_plants_v1', JSON.stringify(FIXTURE));
    const result = await loadPlants();
    expect(result).toHaveLength(FIXTURE.length);
  });

  it('두 저장소 모두 비어있으면 null 반환', async () => {
    vi.mocked(Storage.getItem).mockRejectedValue(new Error('SDK unavailable'));
    expect(await loadPlants()).toBeNull();
  });
});
