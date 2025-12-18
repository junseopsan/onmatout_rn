import { NavigationContainer } from "@react-navigation/native";
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "../navigation";
import { AppThemeProvider } from "./_layout";
import * as Network from "expo-network";

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

export default function App() {
  console.log("=== App 컴포넌트 렌더링 ===");
  useReactQueryFocusManager();

  // 네트워크 재연결 시 포커스 이벤트를 강제로 발생시켜 refetch 유도
  useEffect(() => {
    let subscription: Network.Subscription | null = null;
    const setup = async () => {
      subscription = await Network.addNetworkStateListener((state) => {
        if (state.isConnected && state.isInternetReachable !== false) {
          focusManager.setFocused(true);
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
