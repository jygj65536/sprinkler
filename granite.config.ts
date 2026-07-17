import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "sprinkler",
  brand: {
    displayName: "스프링클러", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#CCF695", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "https://static.toss.im/appsintoss/41751/31e0fef2-2948-4ddc-bc2a-eb6049bd2f0d.png", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [{ name: 'geolocation', access: 'access' }],
  navigationBar: {
    // 앱이 자체 safe-top 패딩으로 상태바 여백을 이미 계산하므로, 네이티브 바가
    // 별도 공간을 예약하면 이중 여백이 생김 — 오버레이로 전환해 웹뷰가 그 아래까지 확장되게 함
    transparentBackground: true,
  },
  outdir: "dist",
});
