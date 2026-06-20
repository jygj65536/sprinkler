# sprinkler

**식집사를 위한 물주기 알림 미니앱** — 토스 앱인토스(Apps in Toss) 입점 서비스

식물을 키울 때 언제 물을 줘야 하는지 판단하기 어렵고, 마지막으로 물을 준 날도 기억하기 어렵다. sprinkler는 물주기 기록을 쌓고, 그 기록을 기반으로 물을 줘야 할 타이밍에 알림을 보낸다. 식물을 살리면 유저는 앱을 쓸모 있다고 여기고 계속 돌아온다.

## 핵심 기능

| 화면 | 기능 |
|------|------|
| **Home** | 내 식물 목록 · 건강 상태 시각화(촉촉 / 곧 목말라요 / 물 주세요!) · 새 식물 추가 진입 |
| **달력** | 식물별 과거 물주기 내역 + 미래 물주기 예정일 range 표기 · 노출 식물 유저 선택 |
| **내 식물 상세** | 식물 메타정보 · 함께한 기간 · 물주기 이력(목록/달력) · 물주기 취소 · 삭제 |
| **식물 추가** | 식물명 검색 → 상세정보 확인 → 이름 지어주기 → 내 식물 등록 |

## 시작하기

```bash
npm install
npm run dev        # 로컬 개발 서버 (granite dev)
```

Android 기기나 에뮬레이터에서 샌드박스 테스트를 할 때는 `localhost` 대신 머신의 LAN IP가 필요합니다.

```bash
npm run dev -- --host   # 0.0.0.0 에 바인딩 → Network URL 사용
```

## 배포하기

빌드하면 `sprinkler.ait` 번들 파일이 생성됩니다.

```bash
npm run build
```

번들을 앱인토스 콘솔에 업로드합니다. `--api-key`는 콘솔 > 워크스페이스 > API 키에서 발급받을 수 있습니다.

```bash
npx ait deploy --api-key {API_KEY} -m "출시메모"
```

`-m` 옵션에 변경 사항을 간단히 적으면 콘솔 버전 목록에 표시됩니다.

## 유용한 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)

AI를 사용하시는 경우 [여기](https://developers-apps-in-toss.toss.im/development/llms.html)를 확인해보세요.
