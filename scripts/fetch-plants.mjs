#!/usr/bin/env node
/**
 * 농촌진흥청 원예식물 정보 API → src/species-db.generated.ts 생성
 *
 * Usage: node scripts/fetch-plants.mjs
 * API key는 .env의 PLANT_API_KEY 에서 읽음
 */

import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env 로드
const envText = readFileSync(join(__dirname, '../.env'), 'utf8');
for (const line of envText.split('\n')) {
  const eq = line.indexOf('=');
  if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
}

const API_KEY = process.env.PLANT_API_KEY;
const BASE_URL = 'http://api.nongsaro.go.kr/service/garden';
const OUT_PATH = join(__dirname, '../src/species-db.generated.ts');

if (!API_KEY) { console.error('.env에 PLANT_API_KEY 없음'); process.exit(1); }

// ── XML 파싱 ──────────────────────────────────────────────────────────────

function xmlField(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))</${tag}>`);
  const m = xml.match(re);
  if (!m) return '';
  return (m[1] ?? m[2] ?? '').trim();
}

function xmlItems(xml) {
  const items = [];
  let rest = xml;
  while (true) {
    const s = rest.indexOf('<item>'), e = rest.indexOf('</item>');
    if (s === -1 || e === -1) break;
    items.push(rest.slice(s + 6, e));
    rest = rest.slice(e + 7);
  }
  return items;
}

// ── PlantType 분류 (docs/data-design.md §2-4 기준) ───────────────────────

const FMLNM_TYPE_MAP = {
  // 양치류
  '063002': 'fern', '063003': 'fern', '063004': 'fern',
  '063022': 'fern', '063036': 'fern', '063069': 'fern',
  // 난초류
  '063010': 'orchid',
  // 야자·소철·침엽류
  '063060': 'palm', '063041': 'palm', '063044': 'palm',
  '063009': 'palm', '063054': 'palm', '063083': 'palm',
  // 다육·선인장류
  '063016': 'succulent', '063062': 'succulent', '063056': 'succulent',
  // 구근·알뿌리류
  '063033': 'bulb', '063042': 'bulb', '063090': 'bulb', '063064': 'bulb',
  // 덩굴·포복성
  '063057': 'vine', '063025': 'vine', '063011': 'vine',
  // 열대 대엽 관엽
  '063053': 'tropical', '063019': 'tropical', '063040': 'tropical', '063082': 'tropical',
  // 소형 초본 관엽
  '063012': 'foliage', '063039': 'foliage', '063059': 'foliage',
  '063043': 'foliage', '063018': 'foliage', '063080': 'foliage',
  // 초본 꽃보기
  '063005': 'flowering', '063045': 'flowering', '063029': 'flowering',
  '063026': 'flowering', '063068': 'flowering', '063076': 'flowering',
  '063086': 'flowering', '063028': 'flowering', '063049': 'flowering',
  '063067': 'flowering', '063050': 'flowering', '063006': 'flowering',
  '063085': 'flowering', '063037': 'flowering', '063061': 'flowering',
  '063008': 'flowering', '063031': 'flowering', '063020': 'flowering',
  // 목본 꽃보기 관목
  '063048': 'shrub', '063051': 'shrub', '063014': 'shrub',
  '063046': 'shrub', '063052': 'shrub', '063007': 'shrub',
  '063013': 'shrub', '063058': 'shrub',
  // 목본 관엽 수목
  '063017': 'tree', '063024': 'tree', '063038': 'tree',
  '063055': 'tree', '063015': 'tree', '063047': 'tree',
  '063021': 'tree', '063088': 'tree', '063023': 'tree',
  // 허브·과실·채소류
  '063001': 'herb', '063063': 'herb',
};

// API에 grwhstleCode(코드값) 없음 → CodeNm 텍스트로 다육형/덩굴성 판별
// fmlNm 필드가 실제 과(科) 코드값 ("063051" 등)을 담고 있음
function resolveType(grwhstleCodeNm, fmlNm) {
  if (grwhstleCodeNm.includes('다육')) return 'succulent';
  if (grwhstleCodeNm.includes('덩굴')) return 'vine';
  return FMLNM_TYPE_MAP[fmlNm?.trim() ?? ''] ?? 'foliage';
}

// ── 물주기 파싱 (docs/data-design.md §2-2 코드 기반) ─────────────────────

// API에 watercycleSprngCode 등 코드값이 존재함
const WATER_CODE_DAYS = { '053001': 2, '053002': 5, '053003': 10, '053004': 21 };
const WATER_CODE_LABEL = {
  '053001': '항상 촉촉하게',
  '053002': '촉촉하게 유지',
  '053003': '겉흙 마르면',
  '053004': '흙 대부분 마르면',
};

function parseWaterDays(code) {
  return WATER_CODE_DAYS[code?.trim()] ?? 10;
}

function parseTimingLabel(code) {
  return WATER_CODE_LABEL[code?.trim()] ?? '겉흙 마르면';
}

// ── 온도 파싱 (docs/data-design.md §2-2 코드 기반) ──────────────────────

// API에 grwhTpCode 코드값이 존재함
const GRWH_TP_LABEL = {
  '082001': '10–15°C',
  '082002': '16–20°C',
  '082003': '21–25°C',
  '082004': '26–30°C',
};

function formatTemp(grwhTpCode) {
  return GRWH_TP_LABEL[grwhTpCode?.trim()] ?? '16–28°C';
}

// ── 빛 파싱 ──────────────────────────────────────────────────────────────

// 실제 API 값: "중간 광도(800~1,500 Lux),높은 광도(1,500~10,000 Lux)" 등
function formatLight(raw) {
  if (!raw) return '밝은 간접광';
  if (raw.includes('직사') || raw.includes('10,000'))   return '직사광 좋아함';
  if (raw.includes('낮은') && raw.includes('중간'))      return '반음지·음지 OK';
  if (raw.includes('낮은'))                              return '반음지·음지 OK';
  if (raw.includes('높은'))                              return '밝은 간접광';
  return '밝은 간접광';
}

// ── 설명 fallback ─────────────────────────────────────────────────────────

function buildDesc(fmlCode, growthStyle, light, temp) {
  const parts = [];
  if (fmlCode) parts.push(`${fmlCode}에 속하는 식물이에요.`);
  if (growthStyle) parts.push(`${growthStyle} 형태로 자라요.`);
  parts.push(`${light} 환경을 선호하며 생육 온도는 ${temp}예요.`);
  return parts.join(' ');
}

// ── API 호출 ─────────────────────────────────────────────────────────────

async function fetchXml(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchList(pageNo) {
  const xml = await fetchXml(`${BASE_URL}/gardenList?apiKey=${API_KEY}&numOfRows=100&pageNo=${pageNo}`);
  return { totalCount: +xmlField(xml, 'totalCount'), items: xmlItems(xml) };
}

async function fetchDetail(cntntsNo) {
  const xml = await fetchXml(`${BASE_URL}/gardenDtl?apiKey=${API_KEY}&cntntsNo=${cntntsNo}`);
  return xml;
}

// ── 메인 ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('1/3  목록 조회 중...');
  const { totalCount, items: first } = await fetchList(1);
  const totalPages = Math.ceil(totalCount / 100);
  console.log(`     총 ${totalCount}건 (${totalPages}페이지)`);

  const listItems = [...first];
  for (let p = 2; p <= totalPages; p++) {
    process.stdout.write(`\r     페이지 ${p}/${totalPages} ...`);
    const { items } = await fetchList(p);
    listItems.push(...items);
    await sleep(300);
  }
  console.log(`\n     목록 ${listItems.length}건`);

  console.log('2/3  상세 조회 중...');
  const species = [];
  const BATCH = 5;

  for (let i = 0; i < listItems.length; i += BATCH) {
    const batch = listItems.slice(i, i + BATCH);
    process.stdout.write(`\r     ${Math.min(i + BATCH, listItems.length)}/${listItems.length} ...`);

    const results = await Promise.all(batch.map(async item => {
      const cntntsNo = xmlField(item, 'cntntsNo');
      // 이름은 목록에만 있으므로 여기서 가져옴
      const listName = xmlField(item, 'cntntsSj');
      if (!cntntsNo) return null;
      try {
        const xml = await fetchDetail(cntntsNo);
        return { xml, listName, cntntsNo };
      } catch {
        return null;
      }
    }));

    for (const r of results) {
      if (!r) continue;
      const { xml, listName, cntntsNo } = r;

      const name           = listName;
      const sci            = xmlField(xml, 'plntbneNm') || xmlField(xml, 'distbNm') || name;
      const growthStyle    = xmlField(xml, 'grwhstleCodeNm'); // 텍스트 ("다육형" 등)
      const fmlNm          = xmlField(xml, 'fmlNm');           // 과 코드 ("063051" 등)
      const fmlCodeNm      = xmlField(xml, 'fmlCodeNm');       // 과명 텍스트 (desc fallback용)
      const type           = resolveType(growthStyle, fmlNm);
      const light          = formatLight(xmlField(xml, 'lighttdemanddoCodeNm'));
      const temp           = formatTemp(xmlField(xml, 'grwhTpCode'));  // 코드값 사용
      const fnclty         = xmlField(xml, 'fncltyInfo');
      const desc           = fnclty || buildDesc(fmlCodeNm, growthStyle, light, temp);

      const sprng  = xmlField(xml, 'watercycleSprngCode');   // 코드값 사용
      const summer = xmlField(xml, 'watercycleSummerCode');
      const autumn = xmlField(xml, 'watercycleAutumnCode');
      const winter = xmlField(xml, 'watercycleWinterCode');

      const waterIntervalDays = {
        spring: parseWaterDays(sprng),
        summer: parseWaterDays(summer),
        autumn: parseWaterDays(autumn),
        winter: parseWaterDays(winter),
      };
      const waterTiming = {
        spring: parseTimingLabel(sprng),
        summer: parseTimingLabel(summer),
        autumn: parseTimingLabel(autumn),
        winter: parseTimingLabel(winter),
      };

      if (!name) continue;
      species.push({ id: `sp_${cntntsNo}`, name, sci, type, waterIntervalDays, waterTiming, light, temp, desc });
    }

    await sleep(200);
  }

  console.log(`\n     ${species.length}건 파싱 완료`);
  console.log('3/3  파일 생성 중...');

  const lines = species.map(s => {
    const w = s.waterIntervalDays, t = s.waterTiming;
    return (
      `  { id: ${j(s.id)}, name: ${j(s.name)}, sci: ${j(s.sci)}, type: ${j(s.type)},\n` +
      `    waterIntervalDays: { spring: ${w.spring}, summer: ${w.summer}, autumn: ${w.autumn}, winter: ${w.winter} },\n` +
      `    waterTiming: { spring: ${j(t.spring)}, summer: ${j(t.summer)}, autumn: ${j(t.autumn)}, winter: ${j(t.winter)} },\n` +
      `    light: ${j(s.light)}, temp: ${j(s.temp)}, desc: ${j(s.desc)} }`
    );
  });

  writeFileSync(OUT_PATH,
    `// 자동 생성 — scripts/fetch-plants.mjs (농촌진흥청 원예식물 정보 API)\n` +
    `// 직접 수정하지 말 것. 재생성: node scripts/fetch-plants.mjs\n` +
    `import type { PlantSpecies } from './types';\n\n` +
    `export const SPECIES_DB: PlantSpecies[] = [\n${lines.join(',\n')}\n];\n`,
    'utf8',
  );

  console.log(`완료: ${OUT_PATH} (${species.length}건)`);
  console.log('\n다음 단계: src/data.ts 에서 SPECIES_DB 배열 제거 후 상단에 추가:');
  console.log("  import { SPECIES_DB } from './species-db.generated';");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function j(v) { return JSON.stringify(v); }

main().catch(e => { console.error(e); process.exit(1); });
