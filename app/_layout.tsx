import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";

import { Loading } from "@/components/ui/Loading";
import { COLORS } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuthStore } from "@/stores/authStore";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const {
    loading: authLoading,
    isAuthenticated,
    resetAuth,
    clearSession,
  } = useAuth();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // 인증 상태에 따른 리다이렉트 처리
  useEffect(() => {
    if (authLoading) {
      // 로딩 중이면 5초 후 강제로 인증되지 않은 상태로 설정
      const timer = setTimeout(() => {
        console.log("인증 로딩 타임아웃 - 강제로 인증되지 않은 상태로 설정");
        resetAuth();
      }, 5000);

      return () => clearTimeout(timer);
    } else if (isAuthenticated) {
      // 인증된 사용자의 닉네임 확인 후 리다이렉트
      const user = useAuthStore.getState().user;
      const hasNickname = user && user.profile && user.profile.name;

      if (hasNickname) {
        console.log("닉네임 있음 - tabs로 리다이렉트");
        router.replace("/(tabs)");
      } else {
        console.log("닉네임 없음 - 닉네임 설정 화면으로 리다이렉트");
        router.replace("/auth/nickname");
      }
    }
  }, [authLoading, isAuthenticated, resetAuth]);

  // 폰트 로딩만 확인
  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Loading fullScreen text="ONMATOUT" color={COLORS.primary} />
      </View>
    );
  }

  // 인증 로딩 중이면 로딩 화면 표시
  if (authLoading) {
    console.log("인증 로딩 중...");
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Loading fullScreen text="앱 시작 중..." color={COLORS.primary} />
      </View>
    );
  }

  console.log("인증 상태 확인:", { isAuthenticated, authLoading });

  // 기본적으로 auth 화면을 먼저 표시하고, 인증된 경우에만 tabs로 이동
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
