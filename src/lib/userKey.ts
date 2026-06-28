import { Storage, getAnonymousKey } from '@apps-in-toss/web-framework';

const KEY = 'sprinkler_user_key_v1';
const TIMEOUT_MS = 800;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
}

async function readCached(): Promise<string | null> {
  try {
    const v = await withTimeout(Storage.getItem(KEY), TIMEOUT_MS);
    return v ?? null;
  } catch {
    return localStorage.getItem(KEY);
  }
}

async function writeCached(hash: string): Promise<void> {
  try {
    await withTimeout(Storage.setItem(KEY, hash), TIMEOUT_MS);
  } catch {
    localStorage.setItem(KEY, hash);
  }
}

export async function getOrCreateUserKey(): Promise<string | null> {
  const cached = await readCached();
  if (cached) return cached;

  const result = await getAnonymousKey();
  if (!result || result === 'ERROR' || result === 'INVALID_CATEGORY') return null;

  await writeCached(result.hash);
  return result.hash;
}
