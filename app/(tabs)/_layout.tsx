import { Tabs, router } from "expo-router";
import React, { useEffect } from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { COLORS } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuth();

  // 인증 상태 확인 및 보호
  useEffect(() => {
    console.log("탭 레이아웃 인증 확인:", { isAuthenticated });

    // 인증되지 않은 경우에만 리다이렉트
    if (!isAuthenticated) {
      console.log("인증되지 않음 - 인증 화면으로 리다이렉트");
      // 약간의 지연을 두어 네비게이션 에러 방지
      setTimeout(() => {
        router.replace("/auth");
      }, 100);
    }
  }, [isAuthenticated]);

  // 인증되지 않은 경우 빈 화면 표시
  if (!isAuthenticated) {
    console.log("탭 레이아웃 - 인증되지 않음");
    return null;
  }

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "대시보드",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="asanas"
        options={{
          title: "아사나",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="figure.yoga" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: "수련",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="plus.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="studios"
        options={{
          title: "요가원",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="location.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "프로필",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
