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

// 포그라운드 복귀 시 세션 갱신 함수
// 세션 갱신 성공 여부를 반환하여 포커스 이벤트 발생 시점을 제어
const refreshSessionIfNeeded = async (): Promise<boolean> => {
  try {
    // getSession() 호출에 타임아웃 추가 (5초)
    // Expo Go 환경에서 네트워크 지연이 있을 수 있으므로 여유있게 설정
    const sessionPromise = supabase.auth.getSession();
    let timeoutOccurred = false;
    const timeoutPromise = new Promise<{ data: { session: null }; error: { message: string } }>((resolve) => {
      setTimeout(() => {
        timeoutOccurred = true;
        resolve({ data: { session: null }, error: { message: "Session timeout" } });
      }, 5000);
    });
    
    const result = await Promise.race([sessionPromise, timeoutPromise]);
    
    // 타임아웃이 발생했지만 실제로는 성공했을 수 있으므로 확인
    if (timeoutOccurred) {
      // 타임아웃 후에도 실제 결과를 기다려서 확인 (추가 3초 대기)
      try {
        const actualResult = await Promise.race([
          sessionPromise,
          new Promise<{ data: { session: null }; error: { message: string } }>((resolve) => {
            setTimeout(() => {
              resolve({ data: { session: null }, error: { message: "Additional timeout" } });
            }, 3000);
          }),
        ]);
        if (actualResult.data?.session) {
          console.log("✅ [Session] 타임아웃 후 실제 세션 확인 성공");
          // 세션이 있으면 만료 시간 확인
          const session = actualResult.data.session;
          if (session.expires_at) {
            const expiresAt = session.expires_at * 1000;
            const now = Date.now();
            const timeUntilExpiry = expiresAt - now;
            // 세션이 유효하면(5분 이상 남음) true 반환
            if (timeUntilExpiry >= 5 * 60 * 1000) {
              return true;
            }
          }
          return true;
        }
        // 실제 결과가 없거나 에러인 경우
        console.log("⚠️ [Session] 타임아웃 후 실제 세션 확인 실패 - 네트워크 문제 가능성");
        // 네트워크 문제일 수 있으므로 false 반환하여 API 호출 시 에러 처리하도록 함
        return false;
      } catch (e) {
        console.log("⚠️ [Session] 타임아웃 후 세션 확인 중 예외:", e);
        // 예외 발생 시에도 false 반환
        return false;
      }
    }
    
    const { data, error } = result;

    if (error) {
      // 타임아웃 에러는 이미 위에서 처리됨
      if (error.message === "Session timeout") {
        return true;
      }
      
      console.log("🟡 [Session] 세션 조회 에러:", error.message);
      
      // 리프레시 토큰 관련 에러인 경우 갱신 시도
      const errorMessage = error.message?.toLowerCase() || "";
      if (
        errorMessage.includes("invalid refresh token") ||
        errorMessage.includes("refresh token not found")
      ) {
        console.log("🔄 [Session] 리프레시 토큰 문제, 강제 갱신 시도");
        try {
          // refreshSession에도 타임아웃 추가 (5초)
          const refreshPromise = supabase.auth.refreshSession();
          const refreshTimeoutPromise = new Promise<{ data: { session: null }; error: { message: string } }>((resolve) => {
            setTimeout(() => {
              resolve({ data: { session: null }, error: { message: "Refresh timeout" } });
            }, 5000);
          });
          
          const { data: refreshData, error: refreshError } = await Promise.race([
            refreshPromise,
            refreshTimeoutPromise,
          ]);
          
          if (refreshError) {
            console.log("❌ [Session] 강제 갱신 실패:", refreshError.message);
            return false;
          } else if (refreshData.session) {
            console.log("✅ [Session] 강제 갱신 성공");
            return true;
          }
        } catch (refreshError) {
          console.log("❌ [Session] 강제 갱신 중 예외:", refreshError);
          return false;
        }
      }
      return false;
    }

    if (!data.session) {
      console.log("🟡 [Session] 세션이 없습니다");
      return false;
    }

    const expiresAt = data.session.expires_at * 1000; // 초를 밀리초로 변환
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    // 세션이 유효한 경우(5분 이상 남음)에는 로그를 간소화
    if (timeUntilExpiry >= 5 * 60 * 1000) {
      // 세션이 유효하면 상세 로그 생략
    } else {
      console.log("🟢 [Session] 세션 상태:", {
        expiresAt: new Date(expiresAt).toISOString(),
        now: new Date(now).toISOString(),
        timeUntilExpiry: Math.round(timeUntilExpiry / 1000 / 60) + "분",
        timeUntilExpirySeconds: Math.round(timeUntilExpiry / 1000) + "초",
      });
    }

    // 세션이 만료되었거나 만료 직전(5분 이내)이면 즉시 갱신
    // 세션 시간이 1시간이므로 5분 전에 갱신하는 것이 적절
    // timeUntilExpiry가 0 이하이면 이미 만료된 상태
    if (timeUntilExpiry < 5 * 60 * 1000) {
      const isExpired = timeUntilExpiry <= 0;
      console.log(
        isExpired
          ? "🔄 [Session] 세션 만료됨, 세션 갱신 중..."
          : "🔄 [Session] 토큰 만료 임박, 세션 갱신 중...",
        {
          timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + "초",
        }
      );
      
      try {
        // refreshSession에도 타임아웃 추가 (5초)
        const refreshPromise = supabase.auth.refreshSession();
        const refreshTimeoutPromise = new Promise<{ data: { session: null }; error: { message: string } }>((resolve) => {
          setTimeout(() => {
            resolve({ data: { session: null }, error: { message: "Refresh timeout" } });
          }, 5000);
        });
        
        const { data: refreshData, error: refreshError } = await Promise.race([
          refreshPromise,
          refreshTimeoutPromise,
        ]);

        if (refreshError) {
          console.log("❌ [Session] 세션 갱신 실패:", {
            message: refreshError.message,
            status: refreshError.status,
          });
          return false;
        } else if (refreshData.session) {
          console.log("✅ [Session] 세션 갱신 성공", {
            expiresAt: new Date(refreshData.session.expires_at * 1000).toISOString(),
          });
          return true;
        }
        console.log("🟡 [Session] 세션 갱신 결과: 세션 없음");
        return false;
      } catch (refreshError) {
        console.log("❌ [Session] 세션 갱신 중 예외:", refreshError);
        return false;
      }
    } else {
      console.log("✅ [Session] 세션 유효함", {
        timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + "초",
      });
      return true; // 세션이 유효하면 true 반환
    }
  } catch (e) {
    console.log("❌ [Session] 세션 갱신 중 예외:", e);
    return false;
  }
};

export default function App() {
  console.log("=== App 컴포넌트 렌더링 ===");

  // 포그라운드 복귀 시 세션 갱신 후 React Query 포커스 이벤트 발생
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state === "active") {
        // 로그 간소화 (너무 많은 로그 방지)
        
        try {
          // 세션 갱신을 먼저 완료
          // refreshSessionIfNeeded 내부에서 타임아웃을 처리하므로 여기서는 추가 타임아웃 불필요
          const sessionValid = await refreshSessionIfNeeded();
          
          // 세션 갱신 결과와 관계없이 포커스 이벤트 발생
          // 세션 문제는 API 레벨에서 처리하고, 여기서는 데이터 로딩을 막지 않음
          // 세션이 유효하지 않으면 API 호출 시 에러가 발생하지만, 사용자가 재시도할 수 있도록 함
          if (sessionValid) {
            focusManager.setFocused(true);
          } else {
            console.log("⚠️ [App] 세션 유효하지 않음 - 포커스 이벤트는 발생시키지만 API 호출 시 에러 가능");
            // 세션이 유효하지 않아도 포커스 이벤트는 발생시켜서 데이터 로딩 시도
            // API 레벨에서 세션 에러를 처리하도록 함
            focusManager.setFocused(true);
          }
        } catch (error) {
          console.log("❌ [App] 포그라운드 복귀 처리 중 예외:", error);
          focusManager.setFocused(false);
        }
      } else if (state === "background" || state === "inactive") {
        // 백그라운드로 전환 시 포커스 해제
        focusManager.setFocused(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 네트워크 재연결 시 세션 갱신 후 포커스 이벤트 발생
  useEffect(() => {
    let subscription: Awaited<
      ReturnType<typeof Network.addNetworkStateListener>
    > | null = null;
    const setup = async () => {
      subscription = await Network.addNetworkStateListener(async (state) => {
        if (state.isConnected && state.isInternetReachable !== false) {
          try {
            // 네트워크 재연결 시에도 세션 갱신을 먼저 완료
            // refreshSessionIfNeeded 내부에서 타임아웃을 처리하므로 여기서는 추가 타임아웃 불필요
            const sessionValid = await refreshSessionIfNeeded();
            
            // 세션 갱신 결과와 관계없이 포커스 이벤트 발생
            // 네트워크 재연결 시 데이터를 불러오도록 함
            focusManager.setFocused(true);
          } catch (error) {
            console.log("❌ [App] 네트워크 재연결 처리 중 예외:", error);
          }
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
