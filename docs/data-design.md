# sprinkler 데이터 설계 문서

> 농촌진흥청 농사로 Open API → `PlantSpecies` 매핑 분석과 설계 결정 사항

관련 파일: `src/types.ts` · `src/data.ts` · `docs/api.md`

---

## 0. 핵심 설계 원칙: 사용자 오버라이드

`PlantSpecies`에서 가져오는 모든 속성 값은 **기본값(default)** 이다. 사용자는 자신의 식물(`UserPlant`)에서 이 값들을 개별적으로 변경할 수 있고, 언제든 기본값으로 복구할 수 있다.

### 요구사항

- 사용자가 `intervalDays`, `waterTiming`, `light`, `temp`, `amount` 등을 개별 수정 가능
- 수정 후 "기본값으로 되돌리기" 가능
- 기본값 복구를 위해 **어떤 종인지(speciesId)를 항상 알 수 있어야 함**

### 핵심 변경: UserPlant에 `speciesId` 필드 추가 필요

현재 `UserPlant`는 `speciesId`를 저장하지 않아 기본값 복구가 불가능하다.

```ts
// 현재 (복구 불가)
interface UserPlant {
  id: string;
  name: string;
  sci: string;
  // ... PlantSpecies 필드를 등록 시점에 복사 — 원본 종 참조 없음
}

// 변경 필요
interface UserPlant {
  id: string;
  speciesId: string;  // ← 추가. SPECIES_DB 참조용
  name: string;
  sci: string;
  // ... 나머지 필드는 사용자가 편집한 현재 값
}
```

**기본값 복구 로직:**
```ts
function resetToDefault(plant: UserPlant): UserPlant {
  const species = SPECIES_DB.find(s => s.id === plant.speciesId);
  if (!species) return plant;
  return {
    ...plant,                    // id, speciesId, registeredAt, wateringLogs 보존
    name: plant.name,            // 이름은 사용자가 붙인 것이므로 유지
    intervalDays: species.intervalDays,
    waterTiming: species.waterTiming,
    light: species.light,
    temp: species.temp,
    amount: species.amount,
  };
}
```

> 이름(`name`)은 사용자가 직접 붙여준 것이므로 복구 대상에서 제외한다.  
> 학명(`sci`), 타입(`type`), 색상(`color`)은 종의 고유 속성이라 사용자가 변경하지 않는다고 가정한다.

---

## 1. 현재 PlantSpecies 스키마

```ts
interface PlantSpecies {
  id: string;           // 식물 고유 ID
  name: string;         // 한국 통용명
  sci: string;          // 학명
  type: PlantType;      // 시각 타입 ('monstera'|'snake'|'palm'|'succulent'|'olive')
  color: string;        // 대표 색상 hex
  intervalDays: number; // 권장 물주기 주기(일)
  light: string;        // 빛 조건 텍스트
  waterTiming: string;  // 물 주는 시점 텍스트 (짧게)
  temp: string;         // 적정 온도 텍스트
  amount: string;       // 1회 물 양 텍스트
  desc: string;         // 종 설명
}
```

---

## 2. API → 스키마 매핑 분석

### 2-1. 직접 매핑 가능 (변환 없음)

| PlantSpecies 필드 | API 필드 | 비고 |
|------------------|---------|------|
| `id` | `cntntsNo` | 그대로 사용 |
| `name` | `distbNm` → 없으면 `cntntsSj` | 유통명 우선 |
| `sci` | `plntbneNm` | 식물학명 |

---

### 2-2. 코드 → 값 변환 필요

#### `intervalDays` ← `watercycle*Code`

API는 수치가 아닌 조건 코드를 4계절별로 제공한다.

| 코드 | 조건 설명 | 매핑 intervalDays |
|------|-----------|:----------------:|
| `053001` | 항상 흙을 축축하게 유지함 (물에 잠김) | **2일** |
| `053002` | 흙을 촉촉하게 유지함 (물에 잠기지 않도록 주의) | **5일** |
| `053003` | 토양 표면이 말랐을때 충분히 관수함 | **10일** |
| `053004` | 화분 흙 대부분 말랐을때 충분히 관수함 | **21일** |

**계절 선택 전략**: 봄·가을 코드를 기준으로 한다. 봄(`watercycleSprngCode`)과 가을(`watercycleAutumnCode`)이 다르면 두 값의 평균을 취한다. 여름·겨울은 극단값이라 UX상 적합하지 않다.

```ts
const WATER_CODE_DAYS: Record<string, number> = {
  '053001': 2,
  '053002': 5,
  '053003': 10,
  '053004': 21,
};

function resolveIntervalDays(sprng: string, autumn: string): number {
  const a = WATER_CODE_DAYS[sprng] ?? 10;
  const b = WATER_CODE_DAYS[autumn] ?? 10;
  return Math.round((a + b) / 2);
}
```

---

#### `waterTiming` ← `watercycleSprngCodeNm`

API의 코드명은 길다 (25자 이상). 앱 UI는 짧은 텍스트가 필요하다.

| 코드 | API 코드명 (원문) | waterTiming (앱 표시) |
|------|-----------------|----------------------|
| `053001` | 항상 흙을 축축하게 유지함 (물에 잠김) | **항상 촉촉하게** |
| `053002` | 흙을 촉촉하게 유지함 (물에 잠기지 않도록 주의) | **촉촉하게 유지** |
| `053003` | 토양 표면이 말랐을때 충분히 관수함 | **겉흙 마르면** |
| `053004` | 화분 흙 대부분 말랐을때 충분히 관수함 | **흙 대부분 마르면** |

```ts
const WATER_CODE_LABEL: Record<string, string> = {
  '053001': '항상 촉촉하게',
  '053002': '촉촉하게 유지',
  '053003': '겉흙 마르면',
  '053004': '흙 대부분 마르면',
};
```

---

#### `light` ← `lighttdemanddoCode`

API는 Lux 수치 범위 코드로 제공한다. 앱은 한국어 서술형이 필요하다.

| 코드 | API 코드명 | light (앱 표시) |
|------|-----------|----------------|
| `055001` | 낮은 광도 (300~800 Lux) | **반음지·음지 OK** |
| `055002` | 중간 광도 (800~1,500 Lux) | **밝은 간접광** |
| `055003` | 높은 광도 (1,500~10,000 Lux) | **직사광·양지** |

코드가 복수(콤마 구분)인 경우 가장 높은 값을 기준으로 한다.

```ts
const LIGHT_CODE_LABEL: Record<string, string> = {
  '055001': '반음지·음지 OK',
  '055002': '밝은 간접광',
  '055003': '직사광·양지',
};
```

---

#### `temp` ← `grwhTpCode` + `winterLwetTpCode`

두 코드를 조합해 온도 범위를 만든다.

| grwhTpCode | 의미 |
|-----------|------|
| `082001` | 10~15℃ |
| `082002` | 16~20℃ |
| `082003` | 21~25℃ |
| `082004` | 26~30℃ |

| winterLwetTpCode | 의미 |
|-----------------|------|
| `057001` | 0℃ 이하 |
| `057002` | 5℃ |
| `057003` | 7℃ |
| `057004` | 10℃ |
| `057005` | 13℃ 이상 |

**변환 전략**: `"최저온도 – 생육온도상한"` 형식으로 조합.

```ts
// 예) grwhTpCode='082002'(16~20℃), winterLwetTpCode='057002'(5℃) → "5–20°C"
const GRWH_TP_MAX: Record<string, number> = {
  '082001': 15, '082002': 20, '082003': 25, '082004': 30,
};
const WINTER_MIN: Record<string, string> = {
  '057001': '0', '057002': '5', '057003': '7',
  '057004': '10', '057005': '13',
};
function resolveTemp(grwh: string, winter: string): string {
  const max = GRWH_TP_MAX[grwh];
  const min = WINTER_MIN[winter];
  if (!max || !min) return '정보 없음';
  return `${min}–${max}°C`;
}
```

---

### 2-3. 부분 매핑 (품질 차이 있음)

#### `desc` ← `fncltyInfo` 또는 `adviseInfo`

| 현재 desc | API 대안 |
|-----------|---------|
| "잎의 갈라진 구멍이 매력적인 식집사 입문 1순위. 통풍을 좋아하고 과습에 약해요." | `fncltyInfo`: 공기정화 기능 등 기능성 나열 / `adviseInfo`: 관리 팁 서술 |

**문제**: API 텍스트는 길고 나열식이라 앱 UI 친화적이지 않다. 큐레이션 품질이 떨어진다.  
**결정**: 1차 릴리즈에는 `adviseInfo`를 사용하되, 100자 이하로 자른다. 장기적으로 편집 레이어를 별도로 관리한다.

---

### 2-4. 매핑 불가 — 별도 설계 필요

#### `type` (PlantType) — API에 대응 필드 없음

`PlantType`은 순수하게 시각적 목적의 분류다. 농촌진흥청 API에는 이를 대응하는 단일 코드가 없다.

현재 타입과 가장 근접한 API 코드:

| PlantType | 특성 | 최근접 API 조건 |
|-----------|------|----------------|
| `succulent` | 다육·선인장 | `clCode=072005` (선인장다육식물) 또는 `grwhstleCode=054006` (다육형) |
| `snake` | 직립·원통형 잎 | `grwhstleCode=054001` (직립형) + 건조 내성 → 규칙 조합 필요 |
| `palm` | 야자형·방사형 | `fmlCodeNm` 포함 "야자" or `grwhstleCode=054002` (관목형) → 부정확 |
| `monstera` | 넓은 잎·관엽 | `clCode=072001` (잎보기식물) + 중간광도 → 가장 불명확 |
| `olive` | 수목형·침엽 | `clCode=072001` + 높은광도 → 역시 불명확 |

**결론**: `succulent`만 코드로 자동 분류 가능. 나머지 4개는 자동 분류 규칙이 신뢰도가 낮다.

**설계 결정**: 빌드 타임 데이터 생성 스크립트(`scripts/fetch-plants.ts`)에서 `cntntsNo` → `type` 수동 오버라이드 맵을 별도 파일로 관리한다.

```ts
// scripts/type-overrides.ts
export const TYPE_OVERRIDES: Record<string, PlantType> = {
  // cntntsNo: type
  '5555': 'monstera',   // 몬스테라
  '5556': 'snake',      // 산세베리아
  // ...
};
```

자동 분류 폴백 (오버라이드 없을 때):

```ts
function guessType(item: ApiItem): PlantType {
  const cl = item.clCode?.split(',') ?? [];
  const gs = item.grwhstleCode?.split(',') ?? [];
  if (cl.includes('072005') || gs.includes('054006')) return 'succulent';
  return 'monstera'; // 기본값
}
```

---

#### `color` — API에 없음, `type`에서 파생

`type`이 결정되면 고정 매핑으로 해결.

```ts
const TYPE_COLORS: Record<PlantType, string> = {
  monstera:  '#5E8C57',
  snake:     '#5B7F91',
  palm:      '#C2873B',
  succulent: '#A0698C',
  olive:     '#87873F',
};
```

---

#### `amount` — API에 완전히 없음

1회 물 양(`amount`)에 대응하는 API 필드가 존재하지 않는다.

**현재 값**: "한 컵 (250ml)", "반 컵 (120ml)", "조금 (60ml)", "한 컵 반 (350ml)"

**대안 1 (채택)**: `intervalDays`(물주기 코드)로 추론. 자주 줘야 하는 식물일수록 양이 많다는 가정.

```ts
const AMOUNT_BY_WATER_CODE: Record<string, string> = {
  '053001': '충분히 (물에 잠길 만큼)',
  '053002': '한 컵 반 (350ml)',
  '053003': '한 컵 (250ml)',
  '053004': '조금 (60ml)',
};
```

**대안 2**: 필드 제거. 물 양은 화분 크기에 따라 달라지므로 고정값이 무의미하다는 관점.

현재는 대안 1을 선택. 향후 UX 검토 후 제거 가능.

---

## 3. 빌드 타임 변환 파이프라인 설계

```
농사로 API (gardenList → gardenDtl)
    ↓
scripts/fetch-plants.ts
    ├─ 전체 식물 목록 페이징 조회 (gardenList)
    ├─ 각 cntntsNo에 대해 상세 조회 (gardenDtl)
    ├─ 필드 변환 (코드 → 값, 텍스트 정규화)
    ├─ type 결정 (TYPE_OVERRIDES 우선, 없으면 guessType)
    └─ SPECIES_DB 배열 생성 → src/data.ts 덮어쓰기
```

**실행**: 릴리즈 전 수동으로 `npx ts-node scripts/fetch-plants.ts --api-key {KEY}` 실행.  
**결과**: `src/data.ts`의 `SPECIES_DB`가 API 데이터로 교체됨.

---

## 4. 필드별 매핑 난이도 요약

| 필드 | API 대응 | 난이도 | 방법 |
|------|---------|:------:|------|
| `id` | `cntntsNo` | 쉬움 | 직접 사용 |
| `name` | `distbNm` / `cntntsSj` | 쉬움 | 직접 사용 |
| `sci` | `plntbneNm` | 쉬움 | 직접 사용 |
| `intervalDays` | `watercycle*Code` | 보통 | 코드→일수 고정 매핑 |
| `waterTiming` | `watercycleSprngCode` | 보통 | 코드→짧은 레이블 매핑 |
| `light` | `lighttdemanddoCode` | 보통 | 코드→서술형 매핑 |
| `temp` | `grwhTpCode` + `winterLwetTpCode` | 보통 | 두 코드 조합 포맷 |
| `desc` | `adviseInfo` / `fncltyInfo` | 어려움 | API 텍스트 자르기 (품질↓) |
| `type` | 없음 | 어려움 | 수동 오버라이드 맵 필수 |
| `color` | 없음 | 쉬움 | `type`에서 고정 파생 |
| `amount` | 없음 | 보통 | 물주기 코드로 추론 |
