import { Storage } from '@apps-in-toss/web-framework';
import { UserPlant } from './types';

const KEY = 'sprinkler_plants_v1';
const NATIVE_TIMEOUT_MS = 800;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export async function loadPlants(): Promise<UserPlant[] | null> {
  try {
    const raw = await withTimeout(Storage.getItem(KEY), NATIVE_TIMEOUT_MS);
    if (raw) return JSON.parse(raw) as UserPlant[];
  } catch {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as UserPlant[];
  }
  return null;
}

export async function savePlants(plants: UserPlant[]): Promise<void> {
  const raw = JSON.stringify(plants);
  try {
    await withTimeout(Storage.setItem(KEY, raw), NATIVE_TIMEOUT_MS);
    return;
  } catch { /* Native storage failed, try localStorage */ }
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    throw new Error('저장에 실패했어요');
  }
}
