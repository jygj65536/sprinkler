@docs/skills/apps-in-toss.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

토스 앱인토스(Apps in Toss) 플랫폼에 입점할 **식물 물주기 알림 미니앱**이다. 식집사(식물 키우는 사람)가 물주기 기록을 남기고, 과거 기록 기반으로 다음 물주기 타이밍에 푸시 알림을 받을 수 있게 한다.

핵심 기능 세 가지:
1. 식물 검색 → "내 식물" 추가 (이름, 사진, 이상적 물주기 기간 자동 조회)
2. 식물별 물주기 날짜 기록 (리스트 / 캘린더 뷰)
3. 마지막 물주기 + 권장 주기 기반 알림 (앱 접속 시 메인화면 / 푸시 알림 / 위젯)

## 플랫폼: 앱인토스

**개발 방식**: WebView SDK (`@apps-in-toss/web-framework`) — 비게임 서비스, 빠른 개발에 적합  
**SDK 버전**: 반드시 SDK 2.x 사용 (1.x 업로드 마감 2026-03-23, 이미 만료)

### 프로젝트 초기화 (앱이 아직 없을 때)

```bash
npx create-ait-app <app-name>
# 또는 기존 웹 프로젝트에 추가
npm install @apps-in-toss/web-framework
npx ait init
```

### 주요 개발 명령어

```bash
npm run dev       # 로컬 개발 서버
npm run build     # 빌드 → sprinkler.ait 파일 생성
npm run test      # Vitest 테스트 실행
npx ait deploy --api-key {API_KEY} -m "출시메모"   # 콘솔 배포
```

### `granite.config.ts` 핵심 필드

```ts
export default {
  appName: "...",        // 딥링크·배포용 식별자, 등록 후 변경 불가
  displayName: "...",    // 네비게이션 바 표시명
  primaryColor: "#RRGGBB",
  permissions: [],       // 푸시 알림 권한 등 필요 항목 명시
};
```

### 라우팅 (state 기반, SPA)

`src/App.tsx`의 `screen` 상태로 화면을 전환한다. 파일 기반 라우팅이 아니다.

```
src/screens/Home.tsx      → screen === 'home'      (Home: 내 식물 목록 + 건강상태 표시 + 새 식물 추가 진입)
src/screens/Calendar.tsx  → screen === 'calendar'  (달력: 식물별 물주기 내역 + 미래 물주기 예정일 range 표기, 노출 식물 수 유저가 선택)
src/screens/Detail.tsx    → screen === 'detail'    (내 식물 상세: 메타정보 + 유대정보 + 물주기 데이터 + 취소/삭제)
src/screens/Add.tsx       → screen === 'add'       (식물 추가: 검색 → 바텀시트 확인 → 이름 지어주기 → 등록)
```

딥링크 진입점: `intoss://sprinkler`

## 앱인토스 SDK 사용 시 주의사항

- **Native Storage** 사용 — `localStorage`보다 안정적, 앱 종료 후에도 유지됨. 식물 데이터·물주기 기록은 여기 저장
- **로그인** — 유저 식별자(hash) 발급 필수. 푸시 알림 발송 전 로그인 선행
- **Safe Area** 적용 필수 — 미적용 시 iOS 흰 화면 발생, 검수 필수 항목
- **TDS (Toss Design System)** 사용 필수 — 라이트 모드만 지원, 다크 모드 미지원
- **번들 크기** 100MB 이하 (압축 해제 후)
- **CORS** 설정 누락 시 외부 API 통신 실패

## 검수 체크리스트 (출시 전)

검수는 운영 → 기능 → 디자인 → 보안 4단계이며 2~3 영업일 소요.

- [ ] Safe Area 모든 화면 적용
- [ ] TDS 컴포넌트 가이드라인 준수
- [ ] 로그인 플로우 정상 동작
- [ ] 푸시 알림 권한 요청 시점 자연스러운지 확인
- [ ] 예상치 못한 바텀 시트 / 불시 광고 없음 (다크 패턴 금지)
- [ ] mTLS 인증서 (서버 간 API 통신 시 필수)

## 참고 링크

| 자료 | URL |
|------|-----|
| 개발자 센터 | https://developers-apps-in-toss.toss.im/ |
| 콘솔 | https://apps-in-toss.toss.im/ |
| GitHub 예시 (Web) | https://github.com/toss/apps-in-toss-examples |
| AX (AI 개발 도구) | https://github.com/toss/apps-in-toss-ax |
