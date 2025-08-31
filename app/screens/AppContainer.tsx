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
  const navigation = useNavigation<NavigationProp>();

  // 세션이 있으면 인증된 것으로 판단
  const isAuthenticated = !!session;

  useEffect(() => {
    // 2초 후 스플래시 종료하고 바로 리다이렉트
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // 스플래시 종료 후 바로 리다이렉트
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
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigation]);

  // 스플래시 화면 표시 중
  if (isLoading) {
    return <SplashScreen />;
  }

  // 스플래시 종료 후에는 바로 리다이렉트되므로 여기까지 오면 안됨
  // 혹시 여기까지 온다면 기본적으로 Auth 화면으로 이동
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Loading text="앱을 시작하는 중..." color={COLORS.primary} />
    </View>
  );
}
