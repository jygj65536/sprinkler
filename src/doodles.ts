import { PlantType } from './types';

const BASE = 'viewBox="0 0 120 120" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';

const POT = '<path d="M43 80 Q42 78 44 78 L76 78 Q78 78 77 80 L72 104 Q71 108 67 108 L53 108 Q49 108 48 104 Z"/><path d="M45 83 Q60 88 75 83"/>';

const FOLIAGE: Partial<Record<PlantType, string>> = {
  fern:
    '<path d="M60 80 L60 30"/>' +
    '<path d="M60 70 L53 66"/><path d="M60 70 L67 66"/>' +
    '<path d="M60 61 L52 58"/><path d="M60 61 L68 58"/>' +
    '<path d="M60 52 L54 49"/><path d="M60 52 L66 49"/>' +
    '<path d="M60 43 L55 41"/><path d="M60 43 L65 41"/>' +
    '<path d="M60 79 C51 67 43 60 34 56"/>' +
    '<path d="M60 79 C69 67 77 60 86 56"/>' +
    '<path d="M48 70 L44 66"/><path d="M44 65 L40 62"/>' +
    '<path d="M72 70 L76 66"/><path d="M76 65 L80 62"/>',
  orchid:
    '<path d="M54 80 C50 70 49 61 52 52"/>' +
    '<path d="M66 80 C70 70 71 61 68 52"/>' +
    '<path d="M60 79 C61 64 68 52 82 47"/>' +
    '<path d="M82 47 C79 44 79 40 82 39 C85 40 85 44 82 47 Z"/>' +
    '<path d="M82 47 C85 44 89 44 90 47 C89 50 85 50 82 47 Z"/>' +
    '<path d="M82 47 C84 50 84 54 81 55 C79 53 79 49 82 47 Z"/>' +
    '<path d="M70 53 C68 51 68 48 70 47 C72 48 72 51 70 53 Z"/>' +
    '<path d="M70 53 C72 51 75 51 76 53 C75 55 72 55 70 53 Z"/>',
  palm:
    '<path d="M58 80 C56 60 54 47 50 35"/>' +
    '<path d="M50 35 C44 36 39 41 36 47"/>' +
    '<path d="M50 35 C56 35 62 37 67 41"/>' +
    '<path d="M52 46 C46 48 42 52 39 58"/>' +
    '<path d="M52 46 C58 47 63 49 67 53"/>' +
    '<path d="M55 57 C50 59 46 62 44 67"/>' +
    '<path d="M55 57 C60 58 64 60 67 64"/>',
  succulent:
    '<path d="M60 78 C56 71 56 63 60 56 C64 63 64 71 60 78 Z"/>' +
    '<path d="M60 78 C53 75 49 69 49 62 C57 64 61 70 60 78 Z"/>' +
    '<path d="M60 78 C67 75 71 69 71 62 C63 64 59 70 60 78 Z"/>' +
    '<path d="M60 78 C52 78 46 74 44 68 C52 68 58 72 60 78 Z"/>' +
    '<path d="M60 78 C68 78 74 74 76 68 C68 68 62 72 60 78 Z"/>',
  bulb:
    '<path d="M60 80 L60 48"/>' +
    '<path d="M60 78 C51 69 48 59 49 49"/>' +
    '<path d="M60 78 C69 69 72 59 71 49"/>' +
    '<path d="M53 47 C53 39 56 33 60 30 C64 33 67 39 67 47 C63 49 57 49 53 47 Z"/>' +
    '<path d="M60 30 L60 47"/>' +
    '<path d="M57 32 L56 46"/>' +
    '<path d="M63 32 L64 46"/>',
  vine:
    '<path d="M52 80 C42 84 37 92 40 100"/>' +
    '<path d="M60 80 C60 90 57 98 60 106"/>' +
    '<path d="M68 80 C78 84 83 92 80 100"/>' +
    '<path d="M40 92 C36 90 34 92 35 95 C36 98 40 99 40 99 C40 99 44 97 44 94 C44 91 42 90 40 92 Z"/>' +
    '<path d="M60 96 C56 94 54 96 55 99 C56 102 60 103 60 103 C60 103 64 101 64 98 C64 95 62 94 60 96 Z"/>' +
    '<path d="M80 92 C76 90 74 92 75 95 C76 98 80 99 80 99 C80 99 84 97 84 94 C84 91 82 90 80 92 Z"/>',
  tropical:
    '<path d="M59 80 C45 75 33 61 35 47 C36 40 44 37 51 43 C60 50 63 67 59 80 Z"/>' +
    '<path d="M56 76 C48 65 44 56 45 47"/>' +
    '<path d="M48 60 C44 60 41 58 39 55"/>' +
    '<path d="M61 80 C75 75 87 61 85 47 C84 40 76 37 69 43 C60 50 57 67 61 80 Z"/>' +
    '<path d="M64 76 C72 65 76 56 75 47"/>' +
    '<path d="M72 60 C76 60 79 58 81 55"/>',
  foliage:
    '<path d="M60 80 L60 52"/>' +
    '<circle cx="60" cy="48" r="6"/>' +
    '<path d="M60 74 L52 64"/><circle cx="49" cy="61" r="5.5"/>' +
    '<path d="M60 74 L68 64"/><circle cx="71" cy="61" r="5.5"/>' +
    '<path d="M60 70 L46 70"/><circle cx="42" cy="69" r="5"/>' +
    '<path d="M60 70 L74 70"/><circle cx="78" cy="69" r="5"/>',
  flowering:
    '<path d="M60 80 L56 54"/>' +
    '<path d="M60 80 L60 50"/>' +
    '<path d="M60 80 L66 56"/>' +
    '<circle cx="55" cy="50" r="3"/>' +
    '<path d="M55 50 L55 44 M55 50 L55 56 M55 50 L49 50 M55 50 L61 50 M55 50 L51 46 M55 50 L59 46 M55 50 L51 54 M55 50 L59 54"/>' +
    '<circle cx="60" cy="46" r="3"/>' +
    '<path d="M60 46 L60 40 M60 46 L60 52 M60 46 L54 46 M60 46 L66 46 M60 46 L56 42 M60 46 L64 42 M60 46 L56 50 M60 46 L64 50"/>' +
    '<circle cx="66" cy="52" r="3"/>' +
    '<path d="M66 52 L66 46 M66 52 L66 58 M66 52 L60 52 M66 52 L72 52 M66 52 L62 48 M66 52 L70 48 M66 52 L62 56 M66 52 L70 56"/>',
  shrub:
    '<path d="M40 80 C31 72 33 55 46 51 C49 39 71 39 74 51 C87 55 89 72 80 80 Z"/>' +
    '<path d="M56 80 L56 88"/>' +
    '<path d="M64 80 L64 88"/>' +
    '<circle cx="50" cy="58" r="2.5"/>' +
    '<circle cx="62" cy="52" r="2.5"/>' +
    '<circle cx="71" cy="62" r="2.5"/>' +
    '<circle cx="58" cy="66" r="2.5"/>',
  tree:
    '<path d="M58 80 C56 64 58 50 66 40 C71 34 78 32 84 33"/>' +
    '<path d="M62 52 C58 51 56 48 57 45 C61 46 63 49 62 52 Z"/>' +
    '<path d="M67 44 C65 40 66 36 69 34 C71 38 70 42 67 44 Z"/>' +
    '<path d="M74 38 C73 34 75 31 78 31 C79 35 77 38 74 38 Z"/>' +
    '<path d="M59 62 C55 62 52 60 52 56 C56 56 59 58 59 62 Z"/>' +
    '<path d="M65 58 C62 55 62 51 65 49 C67 52 67 56 65 58 Z"/>',
  herb:
    '<path d="M60 80 L60 38"/>' +
    '<path d="M60 66 C52 64 47 58 46 51 C54 51 60 57 60 66 Z"/>' +
    '<path d="M60 66 C68 64 73 58 74 51 C66 51 60 57 60 66 Z"/>' +
    '<path d="M60 55 C53 53 49 48 48 42 C55 42 60 47 60 55 Z"/>' +
    '<path d="M60 55 C67 53 71 48 72 42 C65 42 60 47 60 55 Z"/>' +
    '<path d="M60 45 C55 43 52 39 51 34 C56 34 60 38 60 45 Z"/>' +
    '<path d="M60 45 C65 43 68 39 69 34 C64 34 60 38 60 45 Z"/>',
  stuckyi:
    '<path d="M55 80 C53 60 51 44 54 30 C55 26 57 26 58 30 C60 46 59 62 59 80"/>' +
    '<path d="M64 80 C64 58 66 42 71 31 C73 27 75 28 74 33 C71 49 68 64 68 80"/>' +
    '<path d="M47 80 C46 62 43 50 39 41 C37 37 39 36 41 39 C47 51 50 65 51 80"/>',
  cactus:
    '<path d="M53 79 C50 67 46 58 46 47 C46 35 52 26 60 26 C68 26 74 35 74 47 C74 58 70 67 67 79 Z"/>' +
    '<path d="M48 62 C40 62 35 58 35 50 C35 46 38 45 40 48 C42 51 44 56 48 58"/>' +
    '<path d="M72 53 C81 53 86 47 86 39 C86 35 83 34 81 37 C79 40 76 46 72 49"/>' +
    '<path d="M60 30 L60 76"/>' +
    '<path d="M52 42 C52 56 53 67 55 76"/>' +
    '<path d="M68 42 C68 56 67 67 65 76"/>' +
    '<path d="M60 26 L60 21"/><path d="M54 28 L51 24"/><path d="M66 28 L69 24"/>' +
    '<path d="M47 44 L43 42"/><path d="M46 53 L42 53"/><path d="M48 63 L44 65"/>' +
    '<path d="M73 44 L77 42"/><path d="M74 52 L78 52"/><path d="M67 62 L71 64"/>' +
    '<path d="M35 50 L31 48"/><path d="M86 39 L90 37"/>',
};

export function plantDoodle(type: PlantType): string {
  return `<svg ${BASE}>${FOLIAGE[type] ?? ''}${POT}</svg>`;
}

export function shelfDoodle(type: PlantType, foliageColor: string): string {
  const f = FOLIAGE[type] ?? '';
  const all = f + POT;
  return `<svg viewBox="0 0 120 120" width="100%" height="100%" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><g fill="#fff" stroke="#fff" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">${all}</g><g stroke="${foliageColor}">${f}</g><g stroke="#364A35">${POT}</g></svg>`;
}

export const EMPTY_POT = `<svg ${BASE}>${POT}</svg>`;

export const DROP =`<svg ${BASE}><path d="M60 26 C60 26 38 52 38 72 a22 22 0 0 0 44 0 C82 52 60 26 60 26 Z"/><path d="M50 72 a10 10 0 0 0 10 10"/></svg>`;

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

export const WATERING_CAN = `<svg viewBox="4 40 88 62" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M48 64 Q47 61 50 61 L82 61 Q85 61 84 64 L79 92 Q78 96 74 96 L56 96 Q52 96 51 92 Z"/><path d="M50 66 Q66 71 82 66"/><path d="M56 61 C57 46 77 46 78 61"/><path d="M50 70 C40 67 30 62 22 53 L17 58 C26 67 37 73 49 77"/><path d="M13 64 c-2 3 -2 6 0 7 c2 -1 2 -4 0 -7 Z"/><path d="M19 69 c-1.5 2.5 -1.5 5 0 6 c1.5 -1 1.5 -3.5 0 -6 Z"/><path d="M9 70 c-1.5 2.5 -1.5 5 0 6 c1.5 -1 1.5 -3.5 0 -6 Z"/></svg>`;
