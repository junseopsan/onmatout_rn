import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Linking } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useAuth } from "../hooks/useAuth";
import { extractInviteCode } from "../lib/invite";
import AppNavigator, { navigationRef } from "../navigation";
import { AppThemeProvider } from "./_layout";

// 부팅/인증 흐름 중인 라우트 — 여기 머무는 동안엔 초대 처리를 보류한다.
const INFLIGHT_ROUTES = new Set([
  "AppContainer",
  "Splash",
  "Auth",
  "PhoneLogin",
  "Verify",
  "Nickname",
  "Onboarding",
]);

// 초대 딥링크 전체 처리 (cold/warm, 로그인/미로그인).
// NavigationContainer 바로 아래 루트에 있어 reset 으로 언마운트되지 않으므로,
// 받은 코드를 로그인 과정까지 보관했다가 연결할 수 있다.
//  - 로그인 상태 + 부팅/인증 흐름이 끝남 → AuthMatch 로 이동(연결)
//  - 미로그인 → 로그인(Auth) 으로 유도, 코드는 보관 → 로그인 후 위 분기에서 연결
function InviteLinkListener() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [routeName, setRouteName] = useState<string | null>(null);
  const promptedForRef = useRef<string | null>(null);

  // 코드 캡처: cold(getInitialURL) + warm(url 이벤트)
  useEffect(() => {
    const onUrl = (url: string | null) => {
      const code = extractInviteCode(url);
      if (code) setPendingCode(code);
    };
    Linking.getInitialURL().then(onUrl).catch(() => undefined);
    const sub = Linking.addEventListener("url", ({ url }) => onUrl(url));
    return () => sub.remove();
  }, []);

  // 현재 라우트 추적 (reset/이동마다 갱신) — 소비 시점 판단용
  useEffect(() => {
    const update = () =>
      setRouteName(
        navigationRef.isReady()
          ? navigationRef.getCurrentRoute()?.name ?? null
          : null,
      );
    update();
    const unsub = navigationRef.addListener("state", update);
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // 소비: 부팅/인증 흐름이 끝난 안정된 화면에서만 처리
  useEffect(() => {
    if (!pendingCode || authLoading) return;
    if (!routeName || INFLIGHT_ROUTES.has(routeName)) return;
    if (!navigationRef.isReady()) return;
    if (isAuthenticated) {
      promptedForRef.current = null;
      setPendingCode(null);
      navigationRef.navigate("AuthMatch", { inviteCode: pendingCode });
    } else if (promptedForRef.current !== pendingCode) {
      // 게스트가 초대를 받음 → 로그인 유도. 코드는 보관(로그인 완료 후 연결).
      promptedForRef.current = pendingCode;
      navigationRef.navigate("Auth");
    }
  }, [pendingCode, isAuthenticated, authLoading, routeName]);

  return null;
}

// 포그라운드 복귀 시 세션 갱신은 Supabase 클라이언트의 autoRefreshToken: true 가 담당.
// React Query refetchOnWindowFocus 도 끔 — 백그라운드 복귀할 때마다 화면이 로딩으로 돌아가
// "재시작된 듯한" 체감의 원인이었음.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AppThemeProvider>
            <NavigationContainer ref={navigationRef}>
              <StatusBar style="light" />
              <AppNavigator />
              <InviteLinkListener />
            </NavigationContainer>
          </AppThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
