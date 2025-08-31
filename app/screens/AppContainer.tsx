import { Loading } from "@/components/ui/Loading";
import { COLORS } from "@/constants/Colors";
import { useAuthStore } from "@/stores/authStore";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { RootStackParamList } from "../../navigation/types";
import SplashScreen from "./SplashScreen";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AppContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const { user, session, loading: authLoading } = useAuthStore();
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigation = useNavigation<NavigationProp>();

  // 세션이 있으면 인증된 것으로 판단
  const isAuthenticated = !!session;

  useEffect(() => {
    // 1초 후 스플래시 종료 (3초 → 1초로 단축)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 무한 로딩 방지를 위한 타임아웃 (10초 → 5초로 단축)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      useAuthStore.getState().setLoading(false);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, []);

  // 인증 상태에 따른 리다이렉트
  useEffect(() => {
    if (!isLoading && !authLoading) {
      // 이전 타임아웃이 있다면 취소
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }

      // 50ms 지연으로 디바운싱 (100ms → 50ms로 단축)
      redirectTimeoutRef.current = setTimeout(() => {
        if (isAuthenticated) {
          const currentUser = useAuthStore.getState().user;
          const hasNickname =
            currentUser &&
            currentUser.profile &&
            currentUser.profile.name &&
            currentUser.profile.name.trim() !== "" &&
            currentUser.profile.name !== "null";

          if (hasNickname) {
            navigation.reset({
              index: 0,
              routes: [{ name: "Dashboard" }],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: "Nickname" }],
            });
          }
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "Auth" }],
          });
        }
      }, 50);
    }

    // 클린업 함수
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [isLoading, authLoading, isAuthenticated, session, user, navigation]);

  // 스플래시 화면 표시 중
  if (isLoading) {
    return <SplashScreen />;
  }

  // 인증 로딩 중
  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Loading fullScreen text="앱 시작 중..." color={COLORS.primary} />
      </View>
    );
  }

  // 리다이렉트 중
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Loading text="화면 전환 중..." color={COLORS.primary} />
    </View>
  );
}
