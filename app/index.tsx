import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Linking } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { extractInviteCode } from "../lib/invite";
import AppNavigator, { navigationRef } from "../navigation";
import { AppThemeProvider } from "./_layout";

// 앱이 이미 실행 중일 때(warm) 들어오는 초대 딥링크 처리.
// cold start 는 AppContainer 가 리다이렉트 reset 에 AuthMatch 를 실어 처리하므로,
// 여기서는 리다이렉트가 끝난(=AppContainer 가 아닌) 상태에서만 navigationRef 로 이동한다.
// 이 리스너는 네비게이터 바깥 루트에 있어 reset 으로 언마운트되지 않는다.
function InviteLinkListener() {
  useEffect(() => {
    const handle = (url: string | null) => {
      const code = extractInviteCode(url);
      if (!code || !navigationRef.isReady()) return;
      const current = navigationRef.getCurrentRoute()?.name;
      if (current && current !== "AppContainer") {
        navigationRef.navigate("AuthMatch", { inviteCode: code });
      }
    };
    const sub = Linking.addEventListener("url", ({ url }) => handle(url));
    return () => sub.remove();
  }, []);
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
