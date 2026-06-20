# PoC 구성 의사결정 항목

로컬 환경에 앱인토스 미니앱을 띄우기 위해 결정해야 하는 항목들이다.
결정 완료 항목은 ✅, 미결 항목은 ❓로 표시.

---

## 1. SDK / 프레임워크

### 1-1. 개발 방식 ✅
**WebView SDK** (`@apps-in-toss/web-framework`) 선택.
- 비게임 서비스에 적합, 진입 장벽 낮음
- RN 수준의 네이티브 UX가 불필요한 현 기획에 과함

### 1-2. 웹 프레임워크 ✅

→ **결정**: `npx create-ait-app` (Vite + React, 파일 기반 라우팅). scaffold 생성 완료.

### 1-3. TDS 통합 수준 ✅
`create-ait-app` 실행 시 TDS 통합 여부를 선택해야 함.

- **통합 O**: 검수 통과 필수 요건(TDS 사용 의무), 초반부터 맞춰두면 나중에 재작업 없음
- **통합 X**: PoC 속도 빠르지만 출시 전 전면 교체 필요

→ **결정**: TDS 통합 O. 어차피 필수이므로 초반에 세팅.

---

## 2. 앱 식별자

### 2-1. `appName` ✅
딥링크(`intoss://{appName}`)와 배포에 사용되며 **등록 후 변경 불가**.

→ **결정**: `sprinkler`  
→ 딥링크: `intoss://sprinkler`

---

## 3. 데이터

### 3-1. 식물 데이터베이스 소스 ✅
식물 이름 검색 → 기본 정보(사진, 물주기 기간) 자동 조회 기능에 필요.

| 옵션 | 내용 |
|------|------|
| 농촌진흥청 공공데이터 API | 실제 식물 DB, 무료. API 키 발급 필요. 데이터 품질/커버리지 확인 필요 |
| 자체 mock JSON | PoC 속도 빠름. 식물 10~20종만 하드코딩 |
| 외부 유료 API | 품질 좋으나 비용 발생, PoC에 과함 |

→ **결정**: PoC는 mock JSON으로 시작, 이후 공공데이터 API 연동.

### 3-2. 데이터 저장 방식 ✅
"내 식물" 목록과 물주기 기록을 어디에 저장할지.

| 옵션 | 내용 |
|------|------|
| **Native Storage만** (서버 없음) | 구현 빠름, 기기 간 동기화 불가 |
| Native Storage + 백엔드 서버 | 기기 간 동기화 가능, 개발 비용 증가 |

→ **결정**: PoC는 Native Storage만 사용. 서버는 검수 후 필요 시 추가.

> **현재 구현된 스키마** (`src/types.ts`):
>
> ```ts
> interface UserPlant {
>   id: string;           // 'u_' + Date.now()
>   speciesId: string;    // SPECIES_DB 참조 (기본값 복구용) — 추가 예정
>   name: string;         // 사용자가 지어준 이름
>   sci: string;          // 학명
>   type: PlantType;      // 시각 타입 ('monstera'|'snake'|'palm'|'succulent'|'olive')
>   color: string;        // 대표 색상 hex
>   intervalDays: number; // 권장 물주기 주기(일)
>   registeredAt: string; // 등록일 'YYYY-MM-DD'
>   light: string;
>   waterTiming: string;
>   temp: string;
>   amount: string;
>   wateringLogs: string[]; // 물 준 날짜 배열 'YYYY-MM-DD', 오름차순
> }
> ```
>
> 서버 연동 시 마이그레이션 전략은 `docs/data-design.md` 참조.

---

---

## 4. 달력 화면

### 4-1. 달력 컴포넌트 구현 방식 ✅
달력 화면(main)에서 식물별 물주기 내역·미래 일정을 날짜 그리드로 표시해야 함.

**TDS Mobile에 달력/DatePicker 컴포넌트 없음** (확인 완료).  
TDS가 제공하는 40여 개 컴포넌트(Badge, Button, Modal, TextField, Tab 등) 중 날짜 관련 컴포넌트는 포함되지 않는다.

| 옵션 | 내용 |
|------|------|
| ~~TDS 달력 컴포넌트~~ | ~~존재하지 않음~~ |
| **`react-day-picker`** (headless) | 렌더링 완전 제어 가능. TDS 토큰으로 스타일링. 커스텀 셀(색상 표기, range) 지원 |
| `react-calendar` | 기능 충분하나 기본 스타일 override 필요. headless 수준은 아님 |
| 직접 구현 | 자유도 최대. 개발 비용 가장 높음 |

→ **결정**: **`react-day-picker`** 사용.  
→ 식물 수 선택(필터), 과거 물주기 건강상태 색상, 미래 range 표기 모두 커스텀 렌더러로 처리 가능. TDS 스타일과 충돌 없이 조합 가능.

---

## 5. 알림

### 5-1. 푸시 알림 구현 방식 ✅
"마지막 물주기 + 권장 주기 경과 시 알림 발송" 기능.

| 옵션 | 내용 |
|------|------|
| 앱인토스 SDK 푸시 (서버 필요) | 실제 푸시 알림. 서버에서 스케줄링 필요 |
| 앱 접속 시 인앱 배너만 (서버 없음) | PoC 범위로 적합. 푸시는 추후 추가 |

→ **결정**: PoC는 **앱 접속 시 배너 알림만** 구현. 실제 푸시는 서버 구축 후 2차.

### 5-2. 로그인 필요 여부 ✅ (방향 결정) / ❌ (미구현)
푸시 알림을 PoC에서 제외하면 로그인 없이도 동작 가능.

- **로그인 포함**: 유저 식별자 발급, 추후 서버 연동 시 필요
- **로그인 제외**: PoC 속도 빠름. 단, 나중에 추가 시 재작업

→ **결정**: 로그인은 포함하되 기능을 block하지 않는 형태로 구현 예정.  
→ **현재 상태**: 미구현. `getAnonymousKey()` 연동이 Phase 2 작업으로 남아 있음 (`docs/roadmap.md` 참조).

---

## 6. 로컬 개발 환경

### 6-1. 테스트 방법 ✅

| 옵션 | 조건 |
|------|------|
| 앱인토스 샌드박스 앱 (시뮬레이터) | Xcode / Android Studio 필요 |
| 앱인토스 샌드박스 앱 (실기기) | `granite.config.ts`의 `host`를 네트워크 IP로 변경 필요 |
| 브라우저 (`localhost`) | SDK 네이티브 기능(푸시, Native Storage) 동작 안 함 |

→ **결정**: 실기기 테스트. 브라우저는 UI 확인용으로만 사용.

### 6-2. 콘솔 등록 ✅
로컬 실기기 테스트를 위해 앱인토스 콘솔에 앱을 등록하고 워크스페이스 멤버로 추가되어야 함.

→ **결정**: 콘솔 등록 완료. (`sprinkler`)

---

## 결정 요약

| 항목 | 상태 | 결정/현황 |
|------|------|-----------|
| 개발 방식 | ✅ | WebView SDK (`@apps-in-toss/web-framework` 2.x) |
| 웹 프레임워크 | ✅ | Vite + React + TypeScript (SPA, state 기반 라우팅) |
| TDS 통합 | ✅ | `@toss/tds-mobile` + `@toss/tds-mobile-ait` |
| `appName` | ✅ | `sprinkler` (`intoss://sprinkler`) |
| 식물 DB 소스 | ✅ (PoC) | 10종 하드코딩. 농사로 API 빌드타임 연동은 Phase 1 작업 |
| 데이터 저장 | ✅ | Native Storage (localStorage 폴백). 서버 동기화는 Phase 4 |
| 달력 컴포넌트 | ✅ | 직접 구현 (TDS에 달력 없음, `react-day-picker` 미사용) |
| 푸시 알림 | ✅ (PoC) | 인앱 배너만. 실제 푸시는 Phase 4 (백엔드 필요) |
| 로그인 | ❌ | 방향 결정됨 (`getAnonymousKey`). Phase 2 작업 |
| 테스트 방법 | ✅ | 실기기 + Vitest 자동화 테스트 79개 |
| 콘솔 등록 | ✅ | 완료 (`sprinkler`) |
