import { SafeAreaInsets } from "@apps-in-toss/web-framework";
import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import config from "../granite.config.ts";
import App from "./App.tsx";
import { ErrorBoundary } from "./ErrorBoundary.tsx";
import "./index.css";

function applySafeArea({ top, bottom }: { top: number; bottom: number; [key: string]: number }) {
  document.documentElement.style.setProperty('--safe-top', `${top}px`);
  document.documentElement.style.setProperty('--safe-bottom', `${bottom}px`);
}

// SafeAreaInsets.get() throws outside the native WebView bridge — guard it
try {
  applySafeArea(SafeAreaInsets.get());
  SafeAreaInsets.subscribe({ onEvent: applySafeArea });
} catch {
  // Running in browser or bridge not yet ready — CSS env() fallback applies via index.css
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <TDSMobileAITProvider brandPrimaryColor={config.brand.primaryColor}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </TDSMobileAITProvider>
    </ErrorBoundary>
  </StrictMode>,
);
