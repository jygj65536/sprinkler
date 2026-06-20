import { PlantType } from './types';

const BASE = 'viewBox="0 0 120 120" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';

const POT = '<path d="M43 80 Q42 78 44 78 L76 78 Q78 78 77 80 L72 104 Q71 108 67 108 L53 108 Q49 108 48 104 Z"/><path d="M45 83 Q60 88 75 83"/>';

const FOLIAGE: Record<PlantType, string> = {
  monstera:
    '<path d="M59 80 C45 75 33 61 35 47 C36 40 44 37 51 43 C60 50 63 67 59 80 Z"/>' +
    '<path d="M56 76 C48 65 44 56 45 47"/><path d="M48 60 C44 60 41 58 39 55"/>' +
    '<path d="M61 80 C75 75 87 61 85 47 C84 40 76 37 69 43 C60 50 57 67 61 80 Z"/>' +
    '<path d="M64 76 C72 65 76 56 75 47"/><path d="M72 60 C76 60 79 58 81 55"/>',
  snake:
    '<path d="M55 80 C53 60 51 44 54 30 C55 26 57 26 58 30 C60 46 59 62 59 80"/>' +
    '<path d="M64 80 C64 58 66 42 71 31 C73 27 75 28 74 33 C71 49 68 64 68 80"/>' +
    '<path d="M47 80 C46 62 43 50 39 41 C37 37 39 36 41 39 C47 51 50 65 51 80"/>',
  succulent:
    '<path d="M60 78 C56 71 56 63 60 56 C64 63 64 71 60 78 Z"/>' +
    '<path d="M60 78 C53 75 49 69 49 62 C57 64 61 70 60 78 Z"/>' +
    '<path d="M60 78 C67 75 71 69 71 62 C63 64 59 70 60 78 Z"/>' +
    '<path d="M60 78 C52 78 46 74 44 68 C52 68 58 72 60 78 Z"/>' +
    '<path d="M60 78 C68 78 74 74 76 68 C68 68 62 72 60 78 Z"/>',
  palm:
    '<path d="M58 80 C56 60 54 47 50 35"/><path d="M50 35 C44 36 39 41 36 47"/>' +
    '<path d="M50 35 C56 35 62 37 67 41"/><path d="M52 46 C46 48 42 52 39 58"/>' +
    '<path d="M52 46 C58 47 63 49 67 53"/><path d="M55 57 C50 59 46 62 44 67"/>' +
    '<path d="M55 57 C60 58 64 60 67 64"/>',
  olive:
    '<path d="M58 80 C56 64 58 50 66 40 C71 34 78 32 84 33"/>' +
    '<path d="M62 52 C58 51 56 48 57 45 C61 46 63 49 62 52 Z"/>' +
    '<path d="M67 44 C65 40 66 36 69 34 C71 38 70 42 67 44 Z"/>' +
    '<path d="M74 38 C73 34 75 31 78 31 C79 35 77 38 74 38 Z"/>' +
    '<path d="M59 62 C55 62 52 60 52 56 C56 56 59 58 59 62 Z"/>' +
    '<path d="M65 58 C62 55 62 51 65 49 C67 52 67 56 65 58 Z"/>',
};

export function plantDoodle(type: PlantType): string {
  return `<svg ${BASE}>${FOLIAGE[type]}${POT}</svg>`;
}

export function shelfDoodle(type: PlantType, foliageColor: string): string {
  return `<svg viewBox="0 0 120 120" width="100%" height="100%" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><g stroke="${foliageColor}">${FOLIAGE[type]}</g><g stroke="#364A35">${POT}</g></svg>`;
}

export const DROP = `<svg ${BASE}><path d="M60 26 C60 26 38 52 38 72 a22 22 0 0 0 44 0 C82 52 60 26 60 26 Z"/><path d="M50 72 a10 10 0 0 0 10 10"/></svg>`;

export const DROP_LIGHT = `<svg viewBox="0 0 120 120" width="100%" height="100%" fill="none" stroke="#F8FFF5" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M60 26 C60 26 38 52 38 72 a22 22 0 0 0 44 0 C82 52 60 26 60 26 Z"/><path d="M50 72 a10 10 0 0 0 10 10"/></svg>`;

export const SEARCH = `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 L21 21"/></svg>`;

export const HOME_NAV = `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 L12 4.5 L20 11.5"/><path d="M6 10.5 V20 h12 V10.5"/><path d="M10 20 v-5 h4 v5"/></svg>`;

export const CAL_NAV = `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M4 9.5 h16 M8.5 3.5 v3 M15.5 3.5 v3"/><circle cx="9" cy="13.5" r="1"/><circle cx="14" cy="13.5" r="1"/></svg>`;

const CARE = 'viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
export const CARE_ICONS = {
  light:  `<svg ${CARE}><circle cx="12" cy="12" r="4.5"/><path d="M12 3.5v2.5M12 18v2.5M3.5 12h2.5M18 12h2.5M6 6l1.7 1.7M18 18l-1.7-1.7M18 6l-1.7 1.7M6 18l1.7-1.7"/></svg>`,
  water:  `<svg ${CARE}><path d="M12 4.5C12 4.5 6.5 11 6.5 15a5.5 5.5 0 0 0 11 0C17.5 11 12 4.5 12 4.5Z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/></svg>`,
  temp:   `<svg ${CARE}><path d="M13.5 13.6V6a1.8 1.8 0 0 0-3.6 0v7.6a3.3 3.3 0 1 0 3.6 0Z"/><path d="M11.7 14.5v-4"/></svg>`,
  cycle:  `<svg ${CARE}><path d="M19 12a7 7 0 1 1-2.4-5.3"/><path d="M17 3.5v3.5h-3.5"/></svg>`,
  amount: `<svg ${CARE}><path d="M7 9h10l-1.2 9a2 2 0 0 1-2 1.8h-3.6a2 2 0 0 1-2-1.8Z"/><path d="M9 9V6.5a3 3 0 0 1 6 0V9"/></svg>`,
};

export const SUMMARY_NEED = `<svg viewBox="0 0 120 120" width="100%" height="100%" fill="none" stroke="#F8FFF5" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M60 30C60 30 44 50 44 64a16 16 0 0 0 32 0C76 50 60 30 60 30Z"/><path d="M52 64a8 8 0 0 0 8 8"/></svg>`;

export const SUMMARY_OK = `<svg viewBox="0 0 120 120" width="100%" height="100%" fill="none" stroke="#F8FFF5" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M40 60l14 14 28-30"/><circle cx="60" cy="60" r="34"/></svg>`;
