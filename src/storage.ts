import { Storage } from '@apps-in-toss/web-framework';
import { UserPlant } from './types';

const KEY = 'sprinkler_plants_v1';

export async function loadPlants(): Promise<UserPlant[] | null> {
  try {
    const raw = await Storage.getItem(KEY);
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
    await Storage.setItem(KEY, raw);
    return;
  } catch { /* Native storage failed, try localStorage */ }
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    throw new Error('저장에 실패했어요');
  }
}
