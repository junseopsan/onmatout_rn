import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { TamaguiProvider } from "tamagui";
import config from "../tamagui.config";

import { COLORS } from "../constants/Colors";
import { NotificationProvider } from "../contexts/NotificationContext";
import { useColorScheme } from "../hooks/useColorScheme";

// ThemeProvider를 별도로 export
export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    // Noto Sans KR — 한글 본문/UI (sans 폰트로 매핑)
    NotoSansKR_400Regular: require("@expo-google-fonts/noto-sans-kr/400Regular/NotoSansKR_400Regular.ttf"),
    NotoSansKR_500Medium: require("@expo-google-fonts/noto-sans-kr/500Medium/NotoSansKR_500Medium.ttf"),
    NotoSansKR_600SemiBold: require("@expo-google-fonts/noto-sans-kr/600SemiBold/NotoSansKR_600SemiBold.ttf"),
    NotoSansKR_700Bold: require("@expo-google-fonts/noto-sans-kr/700Bold/NotoSansKR_700Bold.ttf"),
    // Noto Serif KR — 한글 serif 헤더 (Notion 풍, 한글 hero/title 용)
    NotoSerifKR_500Medium: require("@expo-google-fonts/noto-serif-kr/500Medium/NotoSerifKR_500Medium.ttf"),
    NotoSerifKR_600SemiBold: require("@expo-google-fonts/noto-serif-kr/600SemiBold/NotoSerifKR_600SemiBold.ttf"),
    NotoSerifKR_700Bold: require("@expo-google-fonts/noto-serif-kr/700Bold/NotoSerifKR_700Bold.ttf"),
    // Newsreader — Latin 인용/이탤릭 액센트 전용 (한글 본문엔 NotoSerifKR 사용)
    Newsreader_400Regular_Italic: require("@expo-google-fonts/newsreader/400Regular_Italic/Newsreader_400Regular_Italic.ttf"),
  });

  // 네이티브 스플래시 숨김은 AppContainer 가 앱 준비 완료 시점에 hideAsync() 로 처리.
  // (폰트 로딩 완료 시점에 내리면 인증 로딩 동안 두 번째 스플래시가 보임)

  if (!loaded) {
    // 폰트 로딩 중에는 네이티브 스플래시가 위를 덮으므로 빈 검은 화면만 둔다.
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000000",
          justifyContent: "center",
          alignItems: "center",
        }}
      />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={config}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <NotificationProvider>
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.background,
              }}
            >
              {children}
              <StatusBar style="light" />
            </View>
          </NotificationProvider>
        </ThemeProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}

// 기존 RootLayout은 더 이상 사용하지 않음
export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // 폰트 로딩 중에는 SplashScreen과 동일한 검은 화면 표시
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000000",
          justifyContent: "center",
          alignItems: "center",
        }}
      />
    );
  }

  return null;
}
