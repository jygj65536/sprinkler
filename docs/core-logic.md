# sprinkler 핵심 로직

이 문서는 sprinkler 미니앱의 핵심 도메인 로직을 설명한다.  
관련 소스: `src/types.ts` · `src/data.ts` · `src/storage.ts` · `src/utils.ts` · `src/App.tsx`

---

## 1. 데이터 모델

### 1-1. PlantSpecies — 종(種) 정보 (정적)

`src/data.ts`의 `SPECIES_DB`에 10종이 하드코딩되어 있다. 유저가 추가하거나 변경할 수 없다.

```ts
interface PlantSpecies {
  id: string;          // 예) 'sp_mon'
  name: string;        // 예) '몬스테라'
  sci: string;         // 학명. 예) 'Monstera deliciosa'
  type: PlantType;     // 시각 컴포넌트 구분자 ('monstera' | 'snake' | 'palm' | 'succulent' | 'olive')
  color: string;       // 이 종을 대표하는 hex 색상. 달력 dot·chip에 사용
  intervalDays: number; // 권장 물주기 주기(일). 건강 상태 계산의 기준값
  light: string;       // 빛 조건 텍스트
  waterTiming: string; // 물 주는 시점 텍스트
  temp: string;        // 적정 온도 텍스트
  amount: string;      // 1회 물 양 텍스트
  desc: string;        // 종 설명 (식물 추가 화면 바텀싯)
}
```

현재 등록된 10종과 주기:

| 종 | `intervalDays` | `type` |
|----|--------------|--------|
| 몬스테라 | 7일 | monstera |
| 스투키 | 14일 | snake |
| 테이블야자 | 5일 | palm |
| 다육이 | 21일 | succulent |
| 올리브나무 | 9일 | olive |
| 산세베리아 | 14일 | snake |
| 스파티필름 | 4일 | monstera |
| 행운목 | 10일 | palm |
| 율마 | 4일 | olive |
| 고무나무 | 8일 | monstera |

### 1-2. UserPlant — 유저의 식물 (동적)

유저가 "내 식물로 들이기"를 하면 `PlantSpecies`에서 필드를 복사해 `UserPlant`를 생성한다. `PlantSpecies`와 다른 점은 세 가지다.

```ts
interface UserPlant extends Omit<PlantSpecies, 'desc'> {
  id: string;              // 고유 식별자. 'u_' + Date.now() 형식
  name: string;            // 유저가 직접 지어준 이름 (기본값: 종 이름)
  registeredAt: string;    // 들인 날짜. ISO 8601 ('YYYY-MM-DD')
  wateringLogs: string[];  // 물 준 날짜 배열. ISO 8601, 오름차순 정렬
}
```

`wateringLogs`는 이 앱의 핵심 데이터다. 모든 건강 상태 계산과 달력 표시가 이 배열로부터 파생된다.

**불변 규칙:**
- 날짜 문자열은 항상 `'YYYY-MM-DD'` 형식
- `wateringLogs`는 항상 오름차순 정렬 (최신이 마지막)
- 하루에 한 번만 기록 가능 (같은 날 재호출 시 무시)

---

## 2. 데이터 저장

### 2-1. 저장소 선택

AIT 네이티브 스토리지(`@apps-in-toss/web-framework`의 `Storage`)를 우선 사용하고, 실패하면 `localStorage`로 폴백한다. 이 덕분에 토스 앱 환경과 브라우저 개발 환경 모두에서 동작한다.

```
읽기/쓰기 시도
  └─ Storage.getItem / Storage.setItem   ← 토스 앱 (네이티브)
       └─ 실패 시 폴백
           └─ localStorage               ← 브라우저 개발 환경
```

### 2-2. 저장 키와 포맷

```
키: 'sprinkler_plants_v1'
값: JSON.stringify(UserPlant[])
```

`_v1` suffix는 향후 스키마 변경 시 마이그레이션을 위한 버전 표시다.

### 2-3. 읽기/쓰기 시점

| 시점 | 동작 |
|------|------|
| 앱 마운트 | `loadPlants()` → 저장된 데이터 있으면 DEMO_PLANTS 대신 로드 |
| `plants` state 변경 시 | `savePlants(plants)` → 자동 저장 (`loaded === true` 조건부) |

`loaded` 플래그는 마운트 직후 초기 state 설정(`DEMO_PLANTS`)이 저장소를 덮어쓰는 것을 막는다.

---

## 3. 건강 상태 (HealthStatus)

### 3-1. 핵심 개념: ratio

건강 상태의 기준은 **권장 주기 대비 마지막 물주기 경과 비율(ratio)** 이다.

```
ratio = 마지막 물주기로부터 경과한 일수 / intervalDays
```

예) 몬스테라(7일 주기), 마지막 물주기 5일 전 → ratio = 5/7 ≈ 0.71

### 3-2. 상태 분류

| ratio | `key` | `label` | 색상 |
|-------|-------|---------|------|
| < 0.7 | `'healthy'` | 촉촉해요 | `#5E8C57` (초록) |
| 0.7 ≤ ratio < 1 | `'thirsty'` | 곧 목말라요 | `#C99A3C` (황토) |
| ≥ 1 | `'urgent'` | 물 주세요! | `#CC6B52` (붉은 주황) |

```
ratio 0          0.7          1.0
      |────────────|────────────|──────────▶
      촉촉해요      곧 목말라요   물 주세요!
```

**구현 (`src/utils.ts:getStatus`):**

```ts
function getStatus(plant: UserPlant, today: string): HealthStatus {
  const last = plant.wateringLogs[plant.wateringLogs.length - 1];
  const since = diffDays(last, today);
  const ratio = since / plant.intervalDays;

  if (ratio < 0.7) return { key: 'healthy', label: '촉촉해요',    color: '#5E8C57', ... };
  if (ratio < 1)   return { key: 'thirsty', label: '곧 목말라요', color: '#C99A3C', ... };
  return               { key: 'urgent',  label: '물 주세요!',  color: '#CC6B52', ... };
}
```

### 3-3. 과습 경고

물을 준 직후(ratio < 0.4)에 또 물을 주려 할 때는 상태가 `'healthy'`로 계산되지만, `waterPlant()` 호출 시 토스트 메시지에 "과습 주의 💧"를 함께 표시한다. 상태 분류 자체는 바뀌지 않는다.

---

## 4. 물주기 예정일 (DueInfo)

### 4-1. 예정일 계산

```
dueDate = 마지막 물주기 날짜 + intervalDays
daysUntil = dueDate - 오늘
```

예) 마지막 물주기 6월 13일, intervalDays=7 → dueDate=6월 20일

### 4-2. 표시 텍스트와 색상

| daysUntil | `text` | 색상 |
|-----------|--------|------|
| < 0 | `N일 지났어요` | `#CC6B52` (빨강) |
| = 0 | `오늘이 그날!` | `#CC6B52` (빨강) |
| 1–2 | `N일 뒤` | `#C99A3C` (황토) |
| ≥ 3 | `N일 뒤` | `#857B69` (회갈색) |

### 4-3. 권장 구간

달력에서는 예정일 ±2일을 "물주기 구간"으로 표시한다. 정확히 `dueDate` 하루만을 강요하지 않고 여유를 두기 위함이다.

```
권장 구간 = [dueDate - 2, dueDate + 2]
```

---

## 5. 물주기 기록 조작

### 5-1. 물 주기 (waterPlant)

```
1. 오늘 이미 기록됐으면 → 토스트 "오늘 이미 기록됐어요", 종료
2. ratio < 0.4 이면     → wateringLogs에 TODAY 추가 + "과습 주의 💧" 토스트
3. 그 외                → wateringLogs에 TODAY 추가 + "물 주기 완료!" 토스트
```

### 5-2. 물주기 취소 (cancelWatering)

오늘 기록한 것만 취소 가능하다. `wateringLogs`의 마지막 항목이 오늘 날짜인 경우에만 제거한다.

```
wateringLogs 마지막 항목 === TODAY → slice(0, -1) 로 제거
그 외                               → 무시
```

### 5-3. 식물 삭제 (deletePlant)

`plants` 배열과 `calVisible` 배열 양쪽에서 해당 id를 제거한다. 삭제 후 홈 화면으로 이동한다.

---

## 6. 달력 표시 로직

### 6-1. 메인 달력 (buildCalendarWeeks)

달력 셀마다 다음을 계산한다.

| 속성 | 내용 |
|------|------|
| `pastDots` | 해당 날에 물을 준 식물의 색상 배열 (최대 4개) |
| `futureDots` | 복수 식물 선택 시, 해당 날이 예정일인 식물 색상 배열 |
| `bandBg` | 단일 식물 선택 시, 권장 구간(±2일)에 반투명 색상 배경 |
| `isCenter` | 단일 식물 선택 시, 정확한 예정일 셀에 true |
| `isToday` | 오늘 날짜 여부 (accent 색 원 표시) |

**단일 vs 복수 식물 선택에 따른 달력 차이:**

```
단일 식물 선택
  → 권장 구간에 bandBg 적용 (±2일 음영)
  → 예정일에 isCenter=true (outline 원)
  → futureDots 미사용

복수 식물 선택
  → 각 식물의 예정일에 futureDots에 색상 추가
  → bandBg 미사용 (겹쳐 보이면 너무 복잡해짐)
```

### 6-2. 상세 미니 달력 (buildMiniCalendar)

물주기 이력의 품질을 색상으로 시각화한다. 각 물주기 날짜에 dot을 찍되, 색상은 간격에 따라 결정된다.

| 간격 기준 | dot 색상 | 의미 |
|-----------|---------|------|
| gap ≤ intervalDays × 1.15 | `#5E8C57` 초록 | 제때 |
| gap ≤ intervalDays × 1.5 | `#C99A3C` 황토 | 조금 늦음 |
| gap > intervalDays × 1.5 | `#CC6B52` 빨강 | 많이 늦음 |
| 첫 번째 기록 | `#5E8C57` 초록 | 기준 없음 |

---

## 7. 날짜 처리 규칙

모든 날짜는 `'YYYY-MM-DD'` 문자열로 다룬다. `Date` 객체는 계산할 때만 만들고, 저장·비교·전달은 항상 문자열로 한다. 이는 타임존 이슈를 방지하기 위함이다.

```ts
// 올바른 날짜 비교
diffDays('2026-06-13', '2026-06-20') // → 7

// 올바른 날짜 저장
wateringLogs: ['2026-05-01', '2026-05-08', '2026-06-13']
```

`diffDays(a, b)`는 `b - a`를 일수로 반환한다 (b가 a보다 나중이면 양수).
