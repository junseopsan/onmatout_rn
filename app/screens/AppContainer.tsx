import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { RootStackParamList } from "../../navigation/types";
import SplashScreen from "./SplashScreen";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AppContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated, loading: authLoadingState } = useAuth();

  // 알림 권한 요청 함수
  const requestNotificationPermissions = async () => {
    try {
      console.log("AppContainer: 알림 권한 요청 시작");

      // Android 채널 설정
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "기본 알림",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
        console.log("AppContainer: Android 알림 채널 설정 완료");
      }

      // 현재 권한 상태 확인
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      console.log("AppContainer: 현재 알림 권한 상태:", existingStatus);

      // 권한이 없으면 요청
      if (existingStatus !== "granted") {
        console.log("AppContainer: 알림 권한 요청 중...");
        const { status } = await Notifications.requestPermissionsAsync();
        console.log("AppContainer: 알림 권한 요청 결과:", status);

        if (status === "granted") {
          console.log("AppContainer: 알림 권한 허용됨");
        } else {
          console.log("AppContainer: 알림 권한 거부됨");
        }
      } else {
        console.log("AppContainer: 이미 알림 권한이 허용됨");
      }
    } catch (error) {
      console.error("AppContainer: 알림 권한 요청 실패:", error);
    }
  };

  // 앱 시작 시 알림 권한 요청
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    console.log("AppContainer: 인증 상태 확인 중...", {
      isAuthenticated,
      authLoading: authLoadingState,
    });

    // 인증 상태 로딩이 완료되면 authLoading을 false로 설정
    if (!authLoadingState) {
      setAuthLoading(false);
    }
  }, [authLoadingState, isAuthenticated]);

  useEffect(() => {
    // 스플래시 화면을 최소 1.5초는 보여주고, 인증 상태 로딩도 완료된 후에 리다이렉트
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // 인증 상태 로딩이 완료되고 스플래시도 완료된 후에 리다이렉트
  useEffect(() => {
    if (!isLoading && !authLoading && !hasRedirected) {
      console.log("AppContainer: 리다이렉트 시작", { isAuthenticated });

      // 인증된 사용자는 TabNavigator로, 그렇지 않으면 Auth로
      const targetRoute = isAuthenticated ? "TabNavigator" : "Auth";

      console.log("AppContainer: 리다이렉트 대상", targetRoute);

      // 중복 리다이렉트 방지
      setHasRedirected(true);

      // 약간의 지연을 두어 네비게이션 안정성 확보
      setTimeout(() => {
        try {
          navigation.reset({
            index: 0,
            routes: [{ name: targetRoute }],
          });
        } catch (error) {
          console.error("AppContainer: 네비게이션 리다이렉트 실패", error);
          // 실패 시 강제로 Auth로 이동
          try {
            navigation.navigate("Auth" as any);
          } catch (fallbackError) {
            console.error(
              "AppContainer: Fallback 네비게이션도 실패",
              fallbackError
            );
          }
        }
      }, 200);
    }
  }, [isLoading, authLoading, isAuthenticated, navigation, hasRedirected]);

  // 안전장치: 5초 후에도 리다이렉트가 안되면 강제로 Auth로 이동
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (isLoading || authLoading) {
        console.log("AppContainer: 안전장치 발동 - 강제로 Auth로 이동");
        try {
          navigation.reset({
            index: 0,
            routes: [{ name: "Auth" }],
          });
        } catch (error) {
          console.error("AppContainer: 안전장치 네비게이션 실패", error);
        }
      }
    }, 5000);

    return () => clearTimeout(safetyTimer);
  }, [isLoading, authLoading, navigation]);

  // 스플래시 화면 표시 중이거나 인증 상태 로딩 중
  if (isLoading || authLoading) {
    return <SplashScreen />;
  }

  // 리다이렉트가 완료된 경우 아무것도 렌더링하지 않음
  if (hasRedirected) {
    return null;
  }

  // 리다이렉트 대기 중 (매우 짧은 시간)
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
      }}
    >
      <Text style={{ color: COLORS.text, fontSize: 16 }}>
        앱을 시작하는 중...
      </Text>
    </View>
  );
}
