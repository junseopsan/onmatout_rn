import { Loading } from "@/components/ui/Loading";
import { COLORS } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import SplashScreen from "./SplashScreen";

export default function AppContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const { loading: authLoading, isAuthenticated, user, session } = useAuth();
  const redirectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // 3초 후 스플래시 종료
    const timer = setTimeout(() => {
      console.log("스플래시 종료");
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // 무한 로딩 방지를 위한 타임아웃
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log("인증 로딩 타임아웃 - 강제로 로딩 해제");
      useAuthStore.getState().setLoading(false);
    }, 10000); // 10초 후 강제 해제

    return () => clearTimeout(timeoutId);
  }, []);

  // 인증 상태에 따른 리다이렉트 (디바운싱 적용)
  useEffect(() => {
    if (!isLoading && !authLoading) {
      // 이전 타임아웃이 있다면 취소
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }

      // 100ms 지연으로 디바운싱
      redirectTimeoutRef.current = setTimeout(() => {
        console.log("=== AppContainer 리다이렉트 체크 ===");
        console.log("isAuthenticated:", isAuthenticated);
        console.log("user:", user);
        console.log("session:", session);

        if (isAuthenticated) {
          const currentUser = useAuthStore.getState().user;
          console.log("현재 사용자 정보:", currentUser);

          const hasNickname =
            currentUser &&
            currentUser.profile &&
            currentUser.profile.name &&
            currentUser.profile.name.trim() !== "" &&
            currentUser.profile.name !== "null";
          console.log("닉네임 존재 여부:", hasNickname);

          if (hasNickname) {
            console.log("닉네임 있음 - tabs로 리다이렉트");
            router.replace("/(tabs)");
          } else {
            console.log("닉네임 없음 - 닉네임 설정 화면으로 리다이렉트");
            router.replace("/auth/nickname");
          }
        } else {
          console.log("인증되지 않음 - auth로 리다이렉트");
          router.replace("/auth");
        }
      }, 100);
    }

    // 클린업 함수
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [isLoading, authLoading, isAuthenticated]); // 의존성 배열 수정

  // 스플래시 화면 표시 중
  if (isLoading) {
    console.log("스플래시 화면 표시 중");
    return <SplashScreen />;
  }

  // 인증 로딩 중
  if (authLoading) {
    console.log("인증 로딩 중");
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Loading fullScreen text="앱 시작 중..." color={COLORS.primary} />
      </View>
    );
  }

  console.log("리다이렉트 중 - null 반환");
  return null; // 리다이렉트 중
}
