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
