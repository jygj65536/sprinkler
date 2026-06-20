# PoC → 서비스 로드맵

PoC에서 실제 서비스로 전환하기 위한 단계별 작업 목록.  
각 Phase는 앞 Phase를 선행 조건으로 한다.

---

## 현재 PoC 상태

| 항목 | 상태 | 비고 |
|------|:----:|------|
| AIT WebView SDK 2.x | ✅ | |
| 4개 화면 (Home / Calendar / Detail / Add) | ✅ | |
| 물주기 기록 / 건강 상태 / 취소 / 삭제 | ✅ | |
| TDS 컴포넌트 + Safe Area | ✅ | |
| Native Storage (localStorage 폴백) | ✅ | |
| SVG 두들 (5종) | ✅ | 실제 사진 아님 |
| 식물 DB 10종 하드코딩 | ✅ | 농사로 API 미연동 |
| Vitest 테스트 79개 | ✅ | |
| AIT 로그인 | ❌ | |
| 실제 식물 이미지 | ❌ | |
| 사용자 오버라이드 + 복구 | ❌ | |
| 푸시 알림 (실제) | ❌ | 현재 인앱 배너만 |
| 백엔드 서버 | ❌ | |

---

## Phase 1 — 데이터 기반 구축 (가장 선행)

모든 화면과 기능의 기반이 되는 데이터 레이어. 이 Phase 없이는 나머지 작업이 불가능하거나 나중에 재작업이 발생한다.

### 1-1. `UserPlant`에 `speciesId` 추가

기본값 복구와 사용자 오버라이드를 위한 전제 조건.

```ts
interface UserPlant {
  id: string;
  speciesId: string;  // ← 추가
  // ... 나머지 동일
}
```

- `src/types.ts` 수정
- `src/App.tsx` `addPlant()` 로직 수정 (speciesId 전달)
- `src/data.ts` DEMO_PLANTS에 speciesId 추가
- 기존 저장 데이터 마이그레이션 (speciesId 없는 레코드 처리)

### 1-2. 빌드타임 식물 DB 생성 스크립트

농촌진흥청 API → `src/data.ts` SPECIES_DB 자동 생성.

```
scripts/
  fetch-plants.ts     # API 호출 → PlantSpecies[] 생성
  type-overrides.ts   # cntntsNo → PlantType 수동 매핑
```

- `gardenList` 전체 페이징 조회
- 각 식물에 대해 `gardenDtl` 상세 조회
- 코드 변환 (물주기 코드 → intervalDays, light 코드 → 서술형 등)
- `type` 결정 (수동 오버라이드 맵 + 폴백 추론)
- `src/data.ts` 덮어쓰기

실행: `npx ts-node scripts/fetch-plants.ts --api-key {KEY}`  
시점: 릴리즈 전 수동 실행, API 데이터 변경 시 재실행.

### 1-3. 식물 이미지 연동

현재 SVG 두들을 실제 식물 이미지로 교체.

- `gardenFileList` 응답의 `rtnFileUrl` / `rtnThumbFileUrl` 사용
- `PlantSpecies`에 `imageUrl: string` 필드 추가
- `Home`, `Add`, `Detail` 화면의 이미지 렌더링 수정
- 이미지 로딩 실패 시 SVG 두들 폴백 유지

> SVG 두들은 완전히 제거하지 않고 이미지 없는 종의 폴백으로 유지한다.

---

## Phase 2 — 로그인 & 사용자 정체성

푸시 알림 발송의 선행 조건. 현재 로그인 없이 기기 로컬로만 동작한다.

### 2-1. AIT 익명 키 발급

서비스 특성상 가입 장벽 없이 바로 쓸 수 있어야 한다. Toss 로그인이 아닌 익명 식별자로 시작한다.

```ts
import { getAnonymousKey } from '@apps-in-toss/web-framework';
const userKey = await getAnonymousKey();
```

- 앱 초기화 시 `getAnonymousKey()` 호출
- 발급된 `userKey`를 Native Storage에 저장
- 이후 서버 API 호출 시 헤더로 전달

### 2-2. 로그인 → 토스 계정 업그레이드 (선택)

물주기 리마인드처럼 장기 사용을 유도하는 기능에서 토스 로그인을 자연스럽게 제안한다.

- 강제 로그인 게이트 없음 (검수 필수)
- "다른 기기에서도 내 식물 보기" 기능 진입 시 토스 로그인 제안

---

## Phase 3 — 사용자 오버라이드 & 설정

사용자가 API 기본값을 자신의 환경에 맞게 조정할 수 있는 기능.

### 3-1. 식물 설정 편집 화면

`Detail` 화면에 "내 식물 설정" 섹션 추가.

편집 가능 항목:
- `intervalDays` (물주기 주기, 슬라이더 또는 숫자 입력)
- `light` (드롭다운)
- `waterTiming` (드롭다운)
- `temp` (텍스트)
- `amount` (드롭다운 또는 텍스트)

### 3-2. 기본값 복구

"종 기본값으로 되돌리기" 버튼.

```ts
function resetToDefault(plant: UserPlant): UserPlant {
  const species = SPECIES_DB.find(s => s.id === plant.speciesId);
  if (!species) return plant;
  return {
    ...plant,
    intervalDays: species.intervalDays,
    waterTiming: species.waterTiming,
    light: species.light,
    temp: species.temp,
    amount: species.amount,
  };
}
```

이름(`name`)은 복구 대상에서 제외.

### 3-3. 식물 검색 고도화

현재 10종 하드코딩 → 전체 DB 검색.

- 검색어 매칭 (이름, 학명)
- 필터: 광요구도, 관리수준(초보자/경험자/전문가), 물주기 빈도

---

## Phase 4 — 실제 푸시 알림

알림이 이 앱의 핵심 가치다. 백엔드 없이는 구현 불가.

### 4-1. 알림 동의 수집

```ts
import { requestNotificationAgreement } from '@apps-in-toss/web-framework';
```

- 시점: 첫 식물 추가 후 자연스러운 흐름에서 요청
- 강제 팝업 금지 (검수 탈락 사유)

### 4-2. 백엔드 서버 구축

| 기능 | 설명 |
|------|------|
| 알림 스케줄 저장 | 각 유저의 식물별 다음 물주기 날짜 관리 |
| 스마트 발송 API 호출 | AIT `/sendMessage` API로 푸시 발송 |
| mTLS 인증서 | AIT 서버 API 통신 필수 요건 |

알림 발송 트리거 시점 옵션:
- 물주기 예정일 D-1 오전 9시
- 물주기 예정일 당일 오전 9시
- 사용자 설정 시간

### 4-3. 앱 ↔ 서버 데이터 동기화

현재 기기 로컬에만 있는 물주기 기록을 서버로 동기화.

- 물주기 기록 시 서버 PUT
- 서버에서 다음 알림 일정 재계산
- 기기 변경 시 서버에서 데이터 복원 가능

---

## Phase 5 — 프로덕션 안정화

### 5-1. 에러 핸들링 & 로딩 상태

- 이미지 로딩 실패 처리
- 네트워크 오류 시 오프라인 표시
- 저장소 읽기/쓰기 실패 fallback

### 5-2. 분석 이벤트 로깅

AIT Analytics SDK로 핵심 전환 이벤트 기록.

| 이벤트 | 목적 |
|--------|------|
| `plant_add` | 식물 추가 전환율 |
| `water_plant` | 물주기 기록 빈도 |
| `notification_agree` | 알림 동의율 |
| `app_open` | DAU 측정 |

### 5-3. 번들 크기 검토

- 100MB 이하 (압축 해제 후) 확인
- 이미지 최적화 (WebP, 적절한 해상도)
- 불필요 의존성 제거

---

## Phase 6 — 검수 준비 & 출시

### 6-1. 비게임 필수 체크리스트 통과

현재 자동화 테스트로 확인된 항목 (`src/__tests__/checklist-*.ts`):

| 항목 | 상태 |
|------|:----:|
| Safe Area 전 화면 | ✅ |
| user-scalable=no | ✅ |
| viewport-fit=cover | ✅ |
| 다크 모드 미지원 | ✅ |
| eval / new Function 없음 | ✅ |
| SDK 2.x | ✅ |

미완료 항목 (수동 검수 필요):

| 항목 | 비고 |
|------|------|
| 로그인 플로우 자연스러운지 | 강제 팝업 금지 |
| 알림 권한 요청 시점 | 불시 요청 금지, 맥락 있는 시점 |
| 예상치 못한 바텀시트 없음 | 다크패턴 금지 |
| TDS 컴포넌트 가이드라인 준수 | 버튼 계층, 색상 등 |
| mTLS 인증서 적용 | 서버 API 연동 시 |

### 6-2. 테스트 기기 검증

| 기기 | 필수 확인 사항 |
|------|--------------|
| iPhone (최신) | Safe Area 노치/다이나믹 아일랜드 |
| iPhone (구형, 홈버튼) | Safe Area 하단 버튼 영역 |
| Android | 네비게이션 바 높이, 폰트 렌더링 |

### 6-3. 출시 절차

```
1. ait build               # .ait 번들 생성
2. 앱인토스 콘솔 → 검토 요청
3. 검수 (운영 → 기능 → 디자인 → 보안, 2~3영업일)
4. 검수 통과 → 출시
5. npx ait deploy --api-key {KEY} -m "출시 메모"
```

---

## 단계별 의존 관계 요약

```
Phase 1 (데이터)
  ├─ 1-1 speciesId 추가       ← 3-2 기본값 복구의 전제
  ├─ 1-2 DB 생성 스크립트     ← 3-3 전체 검색의 전제
  └─ 1-3 실제 이미지          독립 진행 가능

Phase 2 (로그인)
  └─ 2-1 익명 키             ← Phase 4 푸시의 전제

Phase 3 (오버라이드)
  └─ 1-1 완료 후 진행 가능

Phase 4 (푸시)
  └─ Phase 2 완료 후 진행 가능

Phase 5 (안정화)
  └─ 언제든 병행 가능

Phase 6 (출시)
  └─ Phase 1~5 완료 후
```

---

## 미결 기술 결정 사항

| 항목 | 옵션 | 결정 필요 시점 |
|------|------|--------------|
| 백엔드 언어/플랫폼 | Node.js, Supabase, Firebase 등 | Phase 4 시작 전 |
| 기기 간 동기화 전략 | 서버 우선 vs 로컬 우선 (충돌 해결) | Phase 4 설계 시 |
| 알림 시간 설정 | 앱에서 유저 선택 vs 고정 시간 | Phase 4 설계 시 |
| `amount` 필드 존치 여부 | API에 없어 추론값 사용 — 제거 또는 유지 | Phase 3 시작 전 |
