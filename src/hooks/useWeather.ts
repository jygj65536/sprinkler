import { useState, useEffect, useCallback } from 'react';
import { Storage, getCurrentLocation, Accuracy } from '@apps-in-toss/web-framework';

export type WeatherPermission = 'unknown' | 'loading' | 'granted' | 'denied';

export interface WeatherInfo {
  tempC: number;
  emoji: string;
  label: string;
}

const CACHE_KEY = 'weather_cache_v1';
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
  info: WeatherInfo;
  at: number;
}

export function wmoToWeather(code: number): { emoji: string; label: string } {
  if (code === 0)  return { emoji: '☀️',  label: '맑음' };
  if (code <= 3)   return { emoji: '⛅',  label: '구름' };
  if (code <= 48)  return { emoji: '🌫️', label: '안개' };
  if (code <= 67)  return { emoji: '🌧️', label: '비' };
  if (code <= 77)  return { emoji: '🌨️', label: '눈' };
  if (code <= 82)  return { emoji: '🌦️', label: '소나기' };
  if (code <= 86)  return { emoji: '🌨️', label: '눈' };
  return                  { emoji: '⛈️', label: '천둥번개' };
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherInfo> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weathercode` +
    `&timezone=Asia%2FSeoul`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('weather fetch failed');
  const data = await res.json();
  const code: number = data.current.weathercode;
  const tempC = Math.round(data.current.temperature_2m as number);
  return { tempC, ...wmoToWeather(code) };
}

async function loadCached(): Promise<WeatherInfo | null> {
  const raw = await Storage.getItem(CACHE_KEY);
  if (!raw) return null;
  const entry = JSON.parse(raw) as CacheEntry;
  if (Date.now() - entry.at < CACHE_TTL_MS) return entry.info;
  return null;
}

async function saveCache(info: WeatherInfo): Promise<void> {
  await Storage.setItem(CACHE_KEY, JSON.stringify({ info, at: Date.now() } satisfies CacheEntry));
}

export function useWeather() {
  const [permission, setPermission] = useState<WeatherPermission>('unknown');
  const [weather, setWeather] = useState<WeatherInfo | null>(null);

  const loadWeather = useCallback(async () => {
    try {
      const cached = await loadCached();
      if (cached) { setWeather(cached); setPermission('granted'); return; }
    } catch {}

    try {
      const pos = await getCurrentLocation({ accuracy: Accuracy.Balanced });
      const info = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
      setWeather(info);
      setPermission('granted');
      saveCache(info).catch(() => {});
    } catch {
      setPermission('denied');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPermission('loading');
      try {
        const status = await getCurrentLocation.getPermission();
        if (cancelled) return;
        if (status === 'allowed') {
          await loadWeather();
        } else {
          setPermission(status === 'notDetermined' ? 'unknown' : 'denied');
        }
      } catch {
        if (!cancelled) setPermission('denied');
      }
    })();
    return () => { cancelled = true; };
  }, [loadWeather]);

  const requestPermission = useCallback(async () => {
    setPermission('loading');
    try {
      const result = await getCurrentLocation.openPermissionDialog();
      if (result === 'allowed') {
        await loadWeather();
      } else {
        setPermission('denied');
      }
    } catch {
      setPermission('denied');
    }
  }, [loadWeather]);

  return { permission, weather, requestPermission };
}
