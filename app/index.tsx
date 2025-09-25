import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import React from "react";
import AppNavigator from "../navigation";
import { AppThemeProvider } from "./_layout";

// QueryClient 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000, // 10분 (cacheTime -> gcTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  console.log("=== App 컴포넌트 렌더링 ===");
  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </AppThemeProvider>
    </QueryClientProvider>
  );
}
