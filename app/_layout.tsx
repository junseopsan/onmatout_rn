import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import React from "react";
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

  if (!loaded) {
    // 폰트 로딩 중에는 SplashScreen과 동일한 검은 화면 표시
    // "앱 로딩 중..." 텍스트가 보이지 않도록
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
