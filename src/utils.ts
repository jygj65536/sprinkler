import { UserPlant, HealthStatus, DueInfo } from './types';

export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = parseDate(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
}

export function fmtDate(iso: string): string {
  const d = parseDate(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function hexAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function getStatus(plant: UserPlant, today: string): HealthStatus {
  const last = plant.wateringLogs[plant.wateringLogs.length - 1];
  const since = diffDays(last, today);
  const ratio = since / plant.intervalDays;
  if (ratio < 0.7) return { key: 'healthy', label: '촉촉해요',    color: '#5E8C57', daysSince: since, lastWatered: last };
  if (ratio < 1)   return { key: 'thirsty', label: '곧 목말라요', color: '#C99A3C', daysSince: since, lastWatered: last };
  return               { key: 'urgent',  label: '물 주세요!',  color: '#CC6B52', daysSince: since, lastWatered: last };
}

export function getDueInfo(plant: UserPlant, today: string): DueInfo {
  const last = plant.wateringLogs[plant.wateringLogs.length - 1];
  const dueDate = addDays(last, plant.intervalDays);
  const daysUntil = diffDays(today, dueDate);
  let text: string, color: string;
  if (daysUntil < 0)       { text = `${-daysUntil}일 지났어요`; color = '#CC6B52'; }
  else if (daysUntil === 0) { text = '오늘이 그날!';             color = '#CC6B52'; }
  else if (daysUntil <= 2)  { text = `${daysUntil}일 뒤`;        color = '#C99A3C'; }
  else                      { text = `${daysUntil}일 뒤`;        color = '#857B69'; }
  return { dueDate, daysUntil, text, color };
}

export type CalCell = {
  day: number; iso: string; isToday: boolean;
  pastDots: string[]; futureDots: string[];
  bandBg: string; isCenter: boolean; centerCol: string; numCol: string;
};

export function buildCalendarWeeks(
  year: number, month: number,
  selPlants: UserPlant[], today: string,
): CalCell[][] {
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const evMap: Record<string, string[]> = {};
  selPlants.forEach(p => p.wateringLogs.forEach(log => {
    if (!evMap[log]) evMap[log] = [];
    evMap[log].push(p.color);
  }));

  const buildCell = (d: Date, dim: boolean): CalCell => {
    const iso = toISO(d);
    const isToday = iso === today;
    const pastDots = (evMap[iso] || []).slice(0, 4);
    let bandBg = 'transparent', isCenter = false, centerCol = '';
    const futureDots: string[] = [];

    if (selPlants.length === 1) {
      const p = selPlants[0];
      const last = p.wateringLogs[p.wateringLogs.length - 1];
      const center = addDays(last, p.intervalDays);
      const lo = addDays(center, -2), hi = addDays(center, 2);
      if (diffDays(lo, iso) >= 0 && diffDays(iso, hi) >= 0 && diffDays(today, iso) > 0) {
        bandBg = hexAlpha(p.color, 0.16);
      }
      if (iso === center && diffDays(today, iso) > 0) { isCenter = true; centerCol = p.color; }
    } else {
      selPlants.forEach(p => {
        const last = p.wateringLogs[p.wateringLogs.length - 1];
        const center = addDays(last, p.intervalDays);
        if (iso === center && diffDays(today, iso) > 0) futureDots.push(p.color);
      });
    }

    const dow = d.getDay();
    let numCol = dim ? '#BCC9AE' : (dow === 0 ? '#CC6B52' : 'var(--ink)');
    if (isToday) numCol = 'var(--ink)';
    return { day: d.getDate(), iso, isToday, pastDots, futureDots: futureDots.slice(0, 4), bandBg, isCenter, centerCol, numCol };
  };

  const cells: CalCell[] = [];
  for (let i = 0; i < startDow; i++) cells.push(buildCell(new Date(year, month, 1 - (startDow - i)), true));
  for (let dn = 1; dn <= daysInMonth; dn++) cells.push(buildCell(new Date(year, month, dn), false));
  while (cells.length % 7 !== 0) {
    const prev = cells[cells.length - 1];
    const d = parseDate(prev.iso);
    d.setDate(d.getDate() + 1);
    cells.push(buildCell(d, true));
  }

  const weeks: CalCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export type MiniCell = { day: number; dot: boolean; dotCol: string; numCol: string };

export function buildMiniCalendar(plant: UserPlant, year: number, month: number): MiniCell[][] {
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const logSet: Record<string, string> = {};
  plant.wateringLogs.forEach((h, i) => {
    const prev = plant.wateringLogs[i - 1];
    let col = '#5E8C57';
    if (prev) {
      const gap = diffDays(prev, h);
      col = gap <= plant.intervalDays * 1.15 ? '#5E8C57'
          : gap <= plant.intervalDays * 1.5  ? '#C99A3C' : '#CC6B52';
    }
    logSet[h] = col;
  });

  const cells: MiniCell[] = [];
  const mk = (d: Date, dim: boolean): MiniCell => {
    const iso = toISO(d);
    const dot = !!logSet[iso];
    return { day: d.getDate(), dot, dotCol: logSet[iso] || 'transparent', numCol: dot ? '#F8FFF5' : (dim ? '#BCC9AE' : 'var(--ink)') };
  };

  for (let i = 0; i < startDow; i++) cells.push(mk(new Date(year, month, 1 - (startDow - i)), true));
  for (let dn = 1; dn <= daysInMonth; dn++) cells.push(mk(new Date(year, month, dn), false));
  let next = 1;
  while (cells.length % 7 !== 0) cells.push(mk(new Date(year, month + 1, next++), true));

  const weeks: MiniCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
