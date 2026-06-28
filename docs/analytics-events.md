# Sprinkler 유저 행동 로그 설계서

> 앱인토스 Analytics SDK (`Analytics` 객체) 기준으로 정의  
> 참고: [사용자 행동 기록](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/분석/Analytics.md)

---

## 개요

### 네이밍 규칙

```
[타입]_[screen]_[element]
```

- 타입: `screen` · `imp` · `click`
- snake_case 사용
- 파라미터 키도 snake_case

### 공통 파라미터

`plant_count`는 screen 이벤트에만 붙인다. click/imp마다 중복 저장할 필요 없음.

---

## 1. Screen 이벤트

화면 진입 시 발화. `go()` 함수 호출 시점에 심는다.  
**화면 이동 없이 재발화 금지** — 같은 화면에서 상태가 바뀌어도 screen 이벤트를 다시 찍으면 DAU·retention이 오염된다.

| 이벤트명 | 화면 | 발화 시점 |
|---------|------|---------|
| `screen_home` | 홈 | 홈 화면 진입 시 |
| `screen_calendar` | 달력 | 달력 화면 진입 시 |
| `screen_archive` | 보관함 | 보관함 화면 진입 시 |
| `screen_detail` | 식물 상세 | 상세 화면 진입 시 |
| `screen_add` | 식물 추가 | 추가 화면 진입 시 |

### 파라미터

**`screen_home`** — 홈 imp 3종을 screen 파라미터로 흡수. 선반 구조 특성상 진입 = 전체 노출이므로 별도 imp 불필요.

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `home_state` | `'empty' \| 'need' \| 'ok'` | 빈 상태 / 물 필요 / 모두 촉촉 |
| `plant_count` | number | 전체 식물 수 |
| `need_water_count` | number | 물이 필요한 식물 수 |
| `healthy_count` | number | `HealthKey: 'healthy'` 식물 수 |
| `thirsty_count` | number | `HealthKey: 'thirsty'` 식물 수 |
| `urgent_count` | number | `HealthKey: 'urgent'` 식물 수 |
| `referrer` | string | 진입 경로 (푸시 알림 → 앱 진입 기여 측정) |

**`screen_archive`** — 홈과 동일한 이유로 선반 진입 = 전체 노출. 별도 imp 불필요.

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `archive_state` | `'empty' \| 'has_plants'` | 보관 식물 유무 |
| `plant_count` | number | 보관 중인 식물 수 |

**`screen_detail`**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `plant_id` | string | 세션 내 funnel 추적용 |
| `species_id` | string | DB 종 ID. 커스텀 식물은 `''` |
| `plant_type` | string | 식물 형태 (항상 존재) |
| `plant_count` | number | 전체 식물 수 |
| `entry_from` | `'home' \| 'calendar' \| 'archive'` | 이전 화면 |

**`screen_calendar`**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `plant_count` | number | 전체 식물 수 |

**`screen_add`**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `plant_count` | number | 전체 식물 수 |
| `entry_from` | `'home' \| 'calendar' \| 'archive'` | 이전 화면 |

---

## 2. Impression 이벤트

요소가 화면에 노출될 때 발화. `<Analytics.Impression>` 컴포넌트로 wrapping.  
홈 화면 imp는 `screen_home` 파라미터로 대체됨.

### 2-1. 달력 (`screen_calendar`)

| 이벤트명 | 요소 | 발화 조건 | 파라미터 |
|---------|------|---------|---------|
| `imp_calendar_upcoming_item` | 다가오는 물주기 아이템 | 리스트 아이템 뷰포트 진입 시 (per item) | `plant_id`, `due_days: number` |

### 2-2. 식물 추가 (`screen_add`)

| 이벤트명 | 요소 | 발화 조건 | 파라미터 |
|---------|------|---------|---------|
| `imp_add_no_result` | 검색 결과 없음 + 직접 추가 버튼 | 검색어 있지만 결과 0건 | `query` |
| `imp_add_species_sheet` | 종 상세 바텀시트 | 바텀시트 열림 | `species_id` |
| `imp_add_custom_sheet` | 직접 추가 바텀시트 | 바텀시트 열림 | — |

---

## 3. Click 이벤트

앱인토스 SDK는 `<Analytics.Press>` 컴포넌트로 wrapping하는 방식.

### 3-1. 홈 (`screen_home`)

| 이벤트명 | 요소 | 파라미터 |
|---------|------|---------|
| `click_home_plant_card` | 식물 카드 | `plant_id`, `species_id`, `plant_type`, `plant_status`, `shelf_position` |
| `click_home_add_empty` | 빈 상태 "새로운 식물 들이기" | — |
| `click_home_water_fab` | 물뿌리개 FAB | `water_mode: 'on' \| 'off'`, `resulting_need_water_count?: number` |
| `click_home_water_plant` | 물주기 모드에서 식물 탭 | `plant_id`, `species_id`, `plant_type`, `plant_status` |
| `click_home_water_done` | 물주기 모드 완료 버튼 | `resulting_need_water_count: number` |

> `resulting_need_water_count`: 물주기 모드가 종료되는 시점의 잔여 need 수. `click_home_water_fab`은 `water_mode: 'off'`일 때만 포함, `click_home_water_done`은 항상 포함. 두 이벤트 중 하나가 반드시 발화되므로 세션 결과를 빠짐없이 측정 가능.

### 3-2. 달력 (`screen_calendar`)

| 이벤트명 | 요소 | 파라미터 |
|---------|------|---------|
| `click_calendar_month_prev` | 이전 달 이동 | `year`, `month` (이동 후 기준) |
| `click_calendar_month_next` | 다음 달 이동 | `year`, `month` (이동 후 기준) |
| `click_calendar_plant_chip` | 식물 필터 칩 토글 | `plant_id`, `state: 'on' \| 'off'`, `active_chip_count` |
| `click_calendar_upcoming_item` | 다가오는 물주기 아이템 | `plant_id`, `due_days` |

### 3-3. 보관함 (`screen_archive`)

| 이벤트명 | 요소 | 파라미터 |
|---------|------|---------|
| `click_archive_plant_card` | 보관 식물 카드 | `plant_id`, `plant_type`, `archived_days: number`, `shelf_position` |

> `archived_days`: 보관한 날 기준 경과일. 장기 보관 패턴 파악용.

### 3-4. 식물 상세 (`screen_detail`)

| 이벤트명 | 요소 | 파라미터 |
|---------|------|---------|
| `click_detail_water` | "물 줬어요" 버튼 | `plant_id`, `species_id`, `plant_type`, `plant_status` |
| `click_detail_cancel_water` | 물주기 취소 버튼 | `plant_id` |
| `click_detail_diary_view_toggle` | 물주기 일기 뷰 전환 | `plant_id`, `view: 'list' \| 'cal'` |
| `click_detail_edit_first_water_open` | 첫 물주기 "수정" 버튼 | `plant_id` |
| `click_detail_edit_first_water_save` | 첫 물주기 수정 "수정하기" | `plant_id`, `date_changed: boolean` |
| `click_detail_edit_open` | "정보 수정" 버튼 | `plant_id` |
| `click_detail_edit_save` | 정보 수정 "저장하기" | `plant_id`, `fields_changed: string` |
| `click_detail_edit_reset` | "처음 값으로 초기화" | `plant_id` |
| `click_detail_archive` | "보관하기" 버튼 | `plant_id`, `species_id`, `plant_type`, `plant_status`, `bond_days: number` |
| `click_detail_unarchive` | "다시 키우기" 버튼 | `plant_id`, `plant_type`, `archived_days: number` |
| `click_detail_delete` | "내 식물에서 보내주기" | `plant_id`, `species_id`, `plant_type`, `bond_days: number`, `plant_status` |

> `fields_changed`: 변경된 필드를 comma-join string으로. 예: `'name,water_interval'`

### 3-5. 식물 추가 (`screen_add`)

| 이벤트명 | 요소 | 파라미터 |
|---------|------|---------|
| `click_add_search_bar` | 검색창 포커스 | — |
| `click_add_search_result` | 검색 결과 아이템 | `species_id`, `query`, `rank` |
| `click_add_custom_open` | "직접 추가하기" 버튼 | `query` |
| `click_add_species_confirm` | 종 선택 후 "내 식물로 들이기" | `plant_id`, `species_id`, `has_custom_name: boolean`, `color` |
| `click_add_custom_confirm` | 직접 추가 "내 식물로 들이기" | `plant_id`, `plant_type`, `water_mode: 'uniform' \| 'seasonal'`, `color` |

---

## 4. 구현 가이드

### 초기화

```ts
// main.tsx
import { Analytics } from '@apps-in-toss/web-framework';
Analytics.init({ ... });
```

### Screen 이벤트

`App.tsx`의 `go()` 함수에서 발화. `needWater`, `plants`는 클로저로 참조.

```ts
const go = (s: Screen) => {
  if (s === 'home' || s === 'calendar') setLastMain(s);
  setScreen(s);

  const statuses  = plants.map(p => getStatus(p, TODAY).key);
  const homeState = plants.length === 0 ? 'empty' : needWater > 0 ? 'need' : 'ok';

  if (s === 'home')
    Analytics.screen('screen_home', {
      home_state: homeState,
      plant_count: plants.length,
      need_water_count: needWater,
      healthy_count: statuses.filter(k => k === 'healthy').length,
      thirsty_count: statuses.filter(k => k === 'thirsty').length,
      urgent_count:  statuses.filter(k => k === 'urgent').length,
      referrer: getReferrer(),  // import { getReferrer } from '@apps-in-toss/web-framework'
    });
  if (s === 'calendar')
    Analytics.screen('screen_calendar', { plant_count: plants.length });
  if (s === 'detail') {
    const dp = plants.find(p => p.id === selectedId);
    Analytics.screen('screen_detail', {
      plant_id: selectedId,
      species_id: dp?.speciesId ?? '',
      plant_type: dp?.type,
      plant_count: plants.length,
      entry_from: lastMain,
    });
  }
  if (s === 'add')
    Analytics.screen('screen_add', { plant_count: plants.length, entry_from: lastMain });
};
```

### 식별자 규칙

| 필드 | 출처 | 비고 |
|------|------|------|
| `plant_id` | `UserPlant.id` (`'u_' + Date.now()`) | lifecycle 추적 전용. cross-user 집계 불가 |
| `species_id` | `UserPlant.speciesId` | DB 종이면 채워짐. 커스텀 식물은 `''` |
| `plant_type` | `UserPlant.type` | 항상 존재 → 커스텀 포함 전체 집계 가능 |
| `plant_status` | `getStatus().key` | `'healthy' \| 'thirsty' \| 'urgent'` |

### 구현 방식 — imperative API

SDK는 컴포넌트 방식이 아닌 명령형 API를 사용한다.

```ts
import { Analytics } from '@apps-in-toss/web-framework';

// Screen 이벤트 — App.tsx go() 내부
Analytics.screen({ log_name: 'screen_home', home_state: 'need', plant_count: 3, need_water_count: 2, healthy_count: 1, thirsty_count: 1, urgent_count: 1 });

// Click 이벤트 — 이벤트 핸들러 내부
Analytics.click({ log_name: 'click_home_plant_card', plant_id: p.id, species_id: p.speciesId, plant_type: p.type, plant_status: st.key, shelf_position: idx });

// Impression 이벤트 — useEffect 또는 함수 호출 시점
Analytics.impression({ log_name: 'imp_add_species_sheet', species_id: id });
```

```ts
// App.tsx — 식물 추가 완료 (plant_id lifecycle 시작점)
const np: UserPlant = { id: 'u_' + Date.now(), ... };
Analytics.click({ log_name: 'click_add_species_confirm', plant_id: np.id, species_id: np.speciesId, has_custom_name: addCustomName.trim() !== '', color: addColor });

// App.tsx — 커스텀 식물 추가 완료
Analytics.click({ log_name: 'click_add_custom_confirm', plant_id: np.id, plant_type: np.type, water_mode: 'uniform' | 'seasonal', color: np.color });

// Home.tsx — FAB 토글 (OFF 시에만 resulting_need_water_count 포함)
const next = !waterMode;
Analytics.click({ log_name: 'click_home_water_fab', water_mode: next ? 'on' : 'off', ...(waterMode ? { resulting_need_water_count: needWater } : {}) });

// Add.tsx — 검색 결과 없음 / 커스텀 시트 노출 (useEffect)
useEffect(() => {
  if (isCustomMode) Analytics.impression({ log_name: 'imp_add_no_result', query: query.trim() });
}, [isCustomMode]);
```

---

## 5. 분석 가능 항목 요약

| 분석 질문 | 사용 이벤트 |
|---------|-----------|
| Activation: 첫 방문 후 식물 추가율 | `screen_home (home_state: empty)` → `click_add_species_confirm` |
| 물주기 모드 완료율 | `click_home_water_fab (on)` → `click_home_water_fab (off, resulting: 0)` |
| 푸시 알림 기여 물주기 | `screen_home (referrer: push)` → `click_detail_water` |
| 어떤 검색어가 DB에 없는지 | `imp_add_no_result.query` |
| 어떤 상태에서 식물을 삭제하는지 | `click_detail_delete.plant_status` + `bond_days` |
| 달력 기능 활용도 | `screen_calendar` + `click_calendar_plant_chip` |
| 검색 → 추가 전환율 | `click_add_search_bar` → `click_add_search_result` → `click_add_species_confirm` |

---

## 6. 우선순위

| 우선순위 | 이벤트 | 이유 |
|---------|-------|------|
| P0 | `screen_*` 4종 | 기본 funnel · retention |
| P0 | `click_home_water_plant`, `click_detail_water` | 핵심 액션 전환율 |
| P0 | `click_add_species_confirm`, `click_add_custom_confirm` | 식물 추가 전환율 |
| P1 | `click_home_water_fab` | 물주기 모드 퍼널 + need→ok 전환 |
| P1 | `click_detail_delete` | 이탈 패턴 |
| P2 | `click_calendar_plant_chip`, `click_calendar_upcoming_item` | 달력 기능 활용도 |
| P2 | `imp_add_no_result` | DB 보강 우선순위 |
| P3 | 나머지 click / imp | 상세 UX 분석용 |
