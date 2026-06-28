# sprinkler 데이터 설계 문서

> 농촌진흥청 농사로 Open API → `PlantSpecies` 매핑 분석과 설계 결정 사항

관련 파일: `src/types.ts` · `src/data.ts` · `docs/api.md`

---

## 0. 핵심 설계 원칙: 사용자 오버라이드

`PlantSpecies`에서 가져오는 모든 속성 값은 **기본값(default)** 이다. 사용자는 자신의 식물(`UserPlant`)에서 이 값들을 개별적으로 변경할 수 있고, 언제든 기본값으로 복구할 수 있다.

### 요구사항

- 사용자가 `waterIntervalDays`, `waterTiming`, `light`, `temp`, 등을 개별 수정 가능
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
    waterIntervalDays: species.waterIntervalDays,
    waterTiming: species.waterTiming,
    light: species.light,
    temp: species.temp,
  };
}
```

> 이름(`name`)은 사용자가 직접 붙여준 것이므로 복구 대상에서 제외한다.  
> 학명(`sci`), 타입(`type`), 색상(`color`)은 종의 고유 속성이라 사용자가 변경하지 않는다고 가정한다.

---

## 1. 현재 PlantSpecies 스키마

```ts
interface SeasonalNumbers {
  spring: number;
  summer: number;
  autumn: number;
  winter: number;
}

interface SeasonalLabels {
  spring: string;
  summer: string;
  autumn: string;
  winter: string;
}

interface PlantSpecies {
  id: string;                  // 식물 고유 ID
  name: string;                // 한국 통용명
  sci: string;                 // 학명
  type: PlantType;             // 시각 타입 (12종)
  color: string;               // 대표 색상 hex
  waterIntervalDays: SeasonalNumbers;  // 계절별 권장 물주기 주기(일)
  light: string;               // 빛 조건 텍스트
  waterTiming: SeasonalLabels; // 계절별 물 주는 시점 레이블
  temp: string;                // 생육 적정 온도 텍스트
  desc: string;                // 종 설명
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

#### `waterIntervalDays` + `waterTiming` ← `watercycle*Code` (4계절 각각)

API의 4계절 물주기 코드를 그대로 계절별로 보존한다. 두 필드 모두 같은 코드 테이블을 참조한다.

| 코드 | 조건 설명 | `waterIntervalDays` | `waterTiming` (앱 표시) |
|------|-----------|:--------------:|------------------------|
| `053001` | 항상 흙을 축축하게 유지함 (물에 잠김) | **2일** | 항상 촉촉하게 |
| `053002` | 흙을 촉촉하게 유지함 (물에 잠기지 않도록 주의) | **5일** | 촉촉하게 유지 |
| `053003` | 토양 표면이 말랐을때 충분히 관수함 | **10일** | 겉흙 마르면 |
| `053004` | 화분 흙 대부분 말랐을때 충분히 관수함 | **21일** | 흙 대부분 마르면 |

```ts
const WATER_CODE_DAYS: Record<string, number> = {
  '053001': 2,
  '053002': 5,
  '053003': 10,
  '053004': 21,
};

const WATER_CODE_LABEL: Record<string, string> = {
  '053001': '항상 촉촉하게',
  '053002': '촉촉하게 유지',
  '053003': '겉흙 마르면',
  '053004': '흙 대부분 마르면',
};

function resolveWatering(item: ApiItem) {
  const codes = {
    spring: item.watercycleSprngCode,
    summer: item.watercycleSummerCode,
    autumn: item.watercycleAutumnCode,
    winter: item.watercycleWinterCode,
  };
  const waterIntervalDays: SeasonalNumbers = {
    spring: WATER_CODE_DAYS[codes.spring] ?? 10,
    summer: WATER_CODE_DAYS[codes.summer] ?? 10,
    autumn: WATER_CODE_DAYS[codes.autumn] ?? 10,
    winter: WATER_CODE_DAYS[codes.winter] ?? 10,
  };
  const waterTiming: SeasonalLabels = {
    spring: WATER_CODE_LABEL[codes.spring] ?? '겉흙 마르면',
    summer: WATER_CODE_LABEL[codes.summer] ?? '겉흙 마르면',
    autumn: WATER_CODE_LABEL[codes.autumn] ?? '겉흙 마르면',
    winter: WATER_CODE_LABEL[codes.winter] ?? '겉흙 마르면',
  };
  return { waterIntervalDays, waterTiming };
}
```

**현재 계절 판별**: 앱 런타임에서 `new Date().getMonth()`로 현재 계절을 구해 해당 계절의 값을 사용한다.

```ts
function getCurrentSeason(): keyof SeasonalNumbers {
  const month = new Date().getMonth() + 1; // 1~12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}
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

#### `temp` ← `grwhTpCode`

생육 적정 온도 범위를 그대로 표시한다.

| 코드 | 의미 | temp (앱 표시) |
|------|------|--------------|
| `082001` | 10~15℃ | **10–15°C** |
| `082002` | 16~20℃ | **16–20°C** |
| `082003` | 21~25℃ | **21–25°C** |
| `082004` | 26~30℃ | **26–30°C** |

```ts
const GRWH_TP_LABEL: Record<string, string> = {
  '082001': '10–15°C',
  '082002': '16–20°C',
  '082003': '21–25°C',
  '082004': '26–30°C',
};
```

---

### 2-3. 가공 필요

#### `desc` ← `fncltyInfo` + `adviseInfo`

두 필드를 조합해 하나의 설명 텍스트를 만든다.

| API 필드 | 내용 성격 |
|---------|---------|
| `fncltyInfo` | 공기정화·인테리어 효과 등 기능성 서술 |
| `adviseInfo` | 관리 팁·주의사항 서술 |

**가공 전략**: `fncltyInfo`를 앞에, `adviseInfo`를 뒤에 붙여 합산 150자 이내로 자른다. 둘 중 하나만 있으면 그 값만 사용한다.

---

### 2-4. 파생 필드

#### `type` (PlantType) — `fmlNm` + `grwhstleCode` 조합으로 자동 분류

`PlantType`은 순수하게 **외관** 기준 분류다. `fmlNm`(과명)과 `grwhstleCode`(생육형태) 두 필드를 조합해 12개 type으로 자동 결정한다.

**판별 우선순위**: `grwhstleCode`가 외관을 지배하는 두 케이스는 `fmlNm`보다 먼저 적용.

1. `grwhstleCode`에 `054006`(다육형) 포함 → `succulent`
2. `grwhstleCode`에 `054003`(덩굴성) 포함 → `vine`
3. 나머지는 `fmlNm` 코드로 결정

| `type` | 한국어명 | 해당 `fmlNm` 과(科) 코드 |
|--------|---------|------------------------|
| `fern` | 양치류 | `063002` `063003` `063004` `063022` `063036` `063069` |
| `orchid` | 난초류 | `063010` |
| `palm` | 야자·소철·침엽류 | `063060` `063041` `063044` `063009` `063054` `063083` |
| `succulent` | 다육·선인장류 | `063016` `063062` `063056` + grwhstleCode `054006` 전체 |
| `bulb` | 구근·알뿌리류 | `063033` `063042` `063090` `063064` |
| `vine` | 덩굴·포복성 | `063057` `063025` `063011` + grwhstleCode `054003` 전체 |
| `tropical` | 열대 대엽 관엽 | `063053` `063019` `063040` `063082` |
| `foliage` | 소형 초본 관엽 | `063012` `063039` `063059` `063043` `063018` `063080` |
| `flowering` | 초본 꽃보기 | `063005` `063045` `063029` `063026` `063068` `063076` `063086` `063028` `063049` `063067` `063050` `063006` `063085` `063037` `063061` `063008` `063031` `063020` |
| `shrub` | 목본 꽃보기 관목 | `063048` `063051` `063014` `063046` `063052` `063007` `063013` `063058` |
| `tree` | 목본 관엽 수목 | `063017` `063024` `063038` `063055` `063015` `063047` `063021` `063088` `063023` |
| `herb` | 허브·과실·채소류 | `063001` `063063` |

```ts
const FMLNM_TYPE_MAP: Record<string, PlantType> = {
  '063002': 'fern', '063003': 'fern', '063004': 'fern',
  '063022': 'fern', '063036': 'fern', '063069': 'fern',
  '063010': 'orchid',
  '063060': 'palm', '063041': 'palm', '063044': 'palm',
  '063009': 'palm', '063054': 'palm', '063083': 'palm',
  '063016': 'succulent', '063062': 'succulent', '063056': 'succulent',
  '063033': 'bulb', '063042': 'bulb', '063090': 'bulb', '063064': 'bulb',
  '063057': 'vine', '063025': 'vine', '063011': 'vine',
  '063053': 'tropical', '063019': 'tropical', '063040': 'tropical', '063082': 'tropical',
  '063012': 'foliage', '063039': 'foliage', '063059': 'foliage',
  '063043': 'foliage', '063018': 'foliage', '063080': 'foliage',
  '063005': 'flowering', '063045': 'flowering', '063029': 'flowering',
  '063026': 'flowering', '063068': 'flowering', '063076': 'flowering',
  '063086': 'flowering', '063028': 'flowering', '063049': 'flowering',
  '063067': 'flowering', '063050': 'flowering', '063006': 'flowering',
  '063085': 'flowering', '063037': 'flowering', '063061': 'flowering',
  '063008': 'flowering', '063031': 'flowering', '063020': 'flowering',
  '063048': 'shrub', '063051': 'shrub', '063014': 'shrub',
  '063046': 'shrub', '063052': 'shrub', '063007': 'shrub',
  '063013': 'shrub', '063058': 'shrub',
  '063017': 'tree', '063024': 'tree', '063038': 'tree',
  '063055': 'tree', '063015': 'tree', '063047': 'tree',
  '063021': 'tree', '063088': 'tree', '063023': 'tree',
  '063001': 'herb', '063063': 'herb',
};

function resolveType(item: ApiItem): PlantType {
  const grwhCodes = item.grwhstleCode?.split(',').map(s => s.trim()) ?? [];
  if (grwhCodes.includes('054006')) return 'succulent';
  if (grwhCodes.includes('054003')) return 'vine';
  const fmlCode = item.fmlCode?.trim();
  return FMLNM_TYPE_MAP[fmlCode ?? ''] ?? 'foliage'; // 미분류 기본값
}
```

---

#### `color` — API에 없음, `type`에서 파생

`type`이 결정되면 고정 매핑으로 해결.

```ts
const TYPE_COLORS: Record<PlantType, string> = {
  fern:      '#4A7C59',
  orchid:    '#9B59B6',
  palm:      '#C2873B',
  succulent: '#A0698C',
  bulb:      '#E8A87C',
  vine:      '#6B8E5E',
  tropical:  '#2E7D52',
  foliage:   '#5E8C57',
  flowering: '#D4618A',
  shrub:     '#C0392B',
  tree:      '#87873F',
  herb:      '#8FBC8F',
};
```

---

## 3. 빌드 타임 변환 파이프라인 설계

```
농사로 API (gardenList → gardenDtl)
    ↓
scripts/fetch-plants.ts
    ├─ 전체 식물 목록 페이징 조회 (gardenList)
    ├─ 각 cntntsNo에 대해 상세 조회 (gardenDtl)
    ├─ 필드 변환: resolveWatering / LIGHT_CODE_LABEL / GRWH_TP_LABEL
    ├─ type 결정: resolveType (grwhstleCode 우선 → fmlNm 매핑)
    ├─ color 결정: TYPE_COLORS[type]
    ├─ desc 생성: fncltyInfo + adviseInfo 조합 후 150자 truncate
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
| `waterIntervalDays` | `watercycle*Code` × 4계절 | 보통 | 코드→일수 계절별 매핑 |
| `waterTiming` | `watercycle*Code` × 4계절 | 보통 | 코드→짧은 레이블 계절별 매핑 |
| `light` | `lighttdemanddoCode` | 보통 | 코드→서술형 매핑 |
| `temp` | `grwhTpCode` | 쉬움 | 코드→범위 텍스트 매핑 |
| `desc` | `fncltyInfo` + `adviseInfo` | 보통 | 두 필드 합산 후 150자 truncate |
| `type` | `fmlNm` + `grwhstleCode` | 보통 | 코드 조합 자동 분류 (12종) |
| `color` | 없음 | 쉬움 | `type`에서 고정 파생 |
