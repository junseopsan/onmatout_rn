import { NavigationContainer } from "@react-navigation/native";
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import * as Network from "expo-network";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import AppNavigator from "../navigation";
import { AppThemeProvider } from "./_layout";

// QueryClient 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000, // 10분 (cacheTime -> gcTime)
      retry: 2,
      // 앱이 포그라운드로 돌아올 때마다 새 데이터 요청
      refetchOnWindowFocus: "always",
    },
  },
});

// React Native에서 포그라운드 전환 시 React Query에 포커스 이벤트 전달
const useReactQueryFocusManager = () => {
  useEffect(() => {
    const onAppStateChange = (status: string) => {
      focusManager.setFocused(status === "active");
    };

    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);
};

// 포그라운드 복귀 시 세션 갱신 함수
const refreshSessionIfNeeded = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.log("🟡 [Session] 세션 조회 에러:", error.message);
      return;
    }

    if (!data.session) {
      console.log("🟡 [Session] 세션이 없습니다");
      return;
    }

    const expiresAt = data.session.expires_at * 1000; // 초를 밀리초로 변환
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    console.log("🟢 [Session] 세션 상태:", {
      expiresAt: new Date(expiresAt).toISOString(),
      now: new Date(now).toISOString(),
      timeUntilExpiry: Math.round(timeUntilExpiry / 1000 / 60) + "분",
    });

    // 만료 1분 이내면 강제 refresh
    if (timeUntilExpiry < 60_000) {
      console.log("🔄 [Session] 토큰 만료 임박, 세션 갱신 중...");
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError) {
        console.log("❌ [Session] 세션 갱신 실패:", refreshError.message);
      } else if (refreshData.session) {
        console.log("✅ [Session] 세션 갱신 성공");
      }
    } else {
      console.log("✅ [Session] 세션 유효함");
    }
  } catch (e) {
    console.log("❌ [Session] 세션 갱신 중 예외:", e);
  }
};

export default function App() {
  console.log("=== App 컴포넌트 렌더링 ===");
  useReactQueryFocusManager();

  // 포그라운드 복귀 시 세션 갱신
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state === "active") {
        console.log("🟢 [App] 포그라운드 복귀 감지");
        await refreshSessionIfNeeded();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 네트워크 재연결 시 포커스 이벤트를 강제로 발생시켜 refetch 유도
  useEffect(() => {
    let subscription: Awaited<
      ReturnType<typeof Network.addNetworkStateListener>
    > | null = null;
    const setup = async () => {
      subscription = await Network.addNetworkStateListener((state) => {
        if (state.isConnected && state.isInternetReachable !== false) {
          focusManager.setFocused(true);
          // 네트워크 재연결 시에도 세션 갱신 시도
          refreshSessionIfNeeded();
        }
      });
    };
    setup();
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </AppThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
