#!/usr/bin/env node
// Usage: node scripts/debug-api.mjs   (.env의 PLANT_API_KEY 자동 사용)
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env 직접 파싱
const env = readFileSync(join(__dirname, '../.env'), 'utf8');
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
}

const API_KEY = process.env.PLANT_API_KEY;
const BASE = 'http://api.nongsaro.go.kr/service/garden';
if (!API_KEY) { console.error('.env에 PLANT_API_KEY 없음'); process.exit(1); }

function cdata(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))</${tag}>`);
  const m = xml.match(re); if (!m) return '(없음)';
  return (m[1] ?? m[2] ?? '').trim() || '(빈값)';
}

// 1. 목록 첫 아이템
const listXml = await fetch(`${BASE}/gardenList?apiKey=${API_KEY}&numOfRows=2&pageNo=1`).then(r => r.text());
console.log('=== 목록 첫 아이템 ===');
const itemStart = listXml.indexOf('<item>');
const itemEnd   = listXml.indexOf('</item>');
const firstItem = listXml.slice(itemStart + 6, itemEnd);
console.log(firstItem.slice(0, 800));

const cntntsNo = cdata(firstItem, 'cntntsNo');
console.log('\n추출된 cntntsNo:', cntntsNo);

// 2. 상세 API 응답
console.log('\n=== gardenDtl 응답 ===');
const dtlXml = await fetch(`${BASE}/gardenDtl?apiKey=${API_KEY}&cntntsNo=${cntntsNo}`).then(r => r.text());
console.log(dtlXml.slice(0, 4000));

// 3. 핵심 필드 추출 확인
console.log('\n=== 주요 필드 파싱 결과 ===');
for (const f of ['cntntsSj','distbNm','plntbdyStleCodeNm','lighttdemanddoCodeNm',
                  'grwthmxTpVal','grwthmnTpVal','watercycleSprngInfo','watercycleSummerInfo',
                  'watercycleAutumnInfo','watercycleWinterInfo','adviseInfo']) {
  console.log(`  ${f}: ${cdata(dtlXml, f)}`);
}
