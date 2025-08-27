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
  console.log("=== AppContainer 렌더링 시작 ===");
  console.log("AppContainer 컴포넌트가 실행됨");
  console.log("AppContainer 함수가 호출됨");

  const [isLoading, setIsLoading] = useState(true);
  const { user, session, loading: authLoading } = useAuthStore();
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigation = useNavigation<NavigationProp>();

  // 세션이 있으면 인증된 것으로 판단
  const isAuthenticated = !!session;

  console.log("AppContainer 상태:", {
    isLoading,
    authLoading,
    isAuthenticated,
    hasSession: !!session,
    hasUser: !!user,
  });

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
    console.log("=== AppContainer useEffect 트리거 ===");
    console.log("isLoading:", isLoading);
    console.log("authLoading:", authLoading);
    console.log("isAuthenticated:", isAuthenticated);
    console.log("session:", session);
    console.log("user:", user);

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
            console.log("닉네임 있음 - Dashboard로 리다이렉트");
            navigation.reset({
              index: 0,
              routes: [{ name: "Dashboard" }],
            });
          } else {
            console.log("닉네임 없음 - 닉네임 설정 화면으로 리다이렉트");
            navigation.reset({
              index: 0,
              routes: [{ name: "Nickname" }],
            });
          }
        } else {
          console.log("인증되지 않음 - Auth로 리다이렉트");
          navigation.reset({
            index: 0,
            routes: [{ name: "Auth" }],
          });
        }
      }, 100);
    }

    // 클린업 함수
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [isLoading, authLoading, isAuthenticated, session, user, navigation]); // 의존성 배열에 session, user 추가

  // 강제로 상태 변화 감지 (1초마다 체크)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentState = useAuthStore.getState();
      console.log("=== 강제 상태 체크 ===");
      console.log("현재 세션:", !!currentState.session);
      console.log("현재 사용자:", !!currentState.user);
      console.log("로딩 상태:", currentState.loading);

      if (
        currentState.session &&
        currentState.user &&
        !currentState.loading &&
        !isLoading
      ) {
        console.log("강제 리다이렉트 실행");
        const hasNickname =
          currentState.user.profile &&
          currentState.user.profile.name &&
          currentState.user.profile.name.trim() !== "" &&
          currentState.user.profile.name !== "null";

        if (hasNickname) {
          console.log("강제 Dashboard 리다이렉트");
          navigation.reset({
            index: 0,
            routes: [{ name: "Dashboard" }],
          });
        } else {
          console.log("강제 Nickname 리다이렉트");
          navigation.reset({
            index: 0,
            routes: [{ name: "Nickname" }],
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, navigation]);

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

  console.log("리다이렉트 중 - 로딩 화면 표시");
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
