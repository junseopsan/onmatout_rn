import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { RootStackParamList } from "../../navigation/types";
import ForceUpdateScreen from "./ForceUpdateScreen";
import SplashScreen from "./SplashScreen";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const isVersionLessThan = (a: string, b: string) => {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av < bv) return true;
    if (av > bv) return false;
  }
  return false;
};

export default function AppContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [versionChecked, setVersionChecked] = useState(false);
  const [forceUpdateInfo, setForceUpdateInfo] = useState<{
    minVersion: string;
    storeUrl: string;
  } | null>(null);
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated, loading: authLoadingState } = useAuth();

  // 알림 권한 요청 함수
  const requestNotificationPermissions = async () => {
    // Expo Go에서는 알림 기능 사용 불가 (SDK 53+)
    if (Constants.executionEnvironment === "storeClient") {
      console.log("Expo Go에서는 알림 기능을 사용할 수 없습니다.");
      return;
    }

    try {
      // Android 채널 설정
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "기본 알림",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      // 현재 권한 상태 확인
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      // 권한이 없으면 요청
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();

        if (status === "granted") {
        } else {
        }
      } else {
      }
    } catch (error) {
      console.log("알림 권한 요청 실패:", error);
    }
  };

  // 앱 시작 시 알림 권한 요청
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // 앱 버전 체크 (필수 업데이트 여부)
  useEffect(() => {
    const checkAppVersion = async () => {
      try {
        const currentVersion =
          Application.nativeApplicationVersion ||
          Application.nativeBuildVersion ||
          "0.0.0";
        const platform = Platform.OS === "ios" ? "ios" : "android";

        // platform 값 대소문자/공백 차이에 대응 (ilike)
        const { data, error } = await supabase
          .from("app_versions")
          .select("min_version, store_url")
          .ilike("platform", platform)
          .order("min_version", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data?.min_version && data?.store_url) {
          const needsForceUpdate = isVersionLessThan(
            currentVersion,
            data.min_version
          );
          console.log("[VersionCheck]", {
            currentVersion,
            minVersion: data.min_version,
            needsForceUpdate,
          });
          if (needsForceUpdate) {
            setForceUpdateInfo({
              minVersion: data.min_version,
              storeUrl: data.store_url,
            });
          }
        } else {
          console.log("[VersionCheck] no version row", {
            platform,
            error,
            data,
          });
        }
      } catch (e) {
        // 버전 체크 실패 시에는 조용히 무시 (앱 사용 가능)
        console.log("[VersionCheck] failed", e);
      } finally {
        setVersionChecked(true);
      }
    };

    checkAppVersion();
  }, []);

  useEffect(() => {
    // 인증 상태 로딩이 완료되면 authLoading을 false로 설정
    if (!authLoadingState) {
      setAuthLoading(false);
    }
  }, [authLoadingState]);

  useEffect(() => {
    // 스플래시 화면을 최소 1.5초는 보여주고, 인증 상태 로딩도 완료된 후에 리다이렉트
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // 인증 상태 로딩이 완료되고 스플래시도 완료된 후에 리다이렉트
  useEffect(() => {
    if (
      !isLoading &&
      !authLoading &&
      versionChecked &&
      !forceUpdateInfo &&
      !hasRedirected
    ) {
      // 모든 사용자(인증/비인증)를 TabNavigator로 이동
      // TabNavigator 내부에서 비회원 사용자 처리
      const targetRoute = "TabNavigator";

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
          // 실패 시 강제로 TabNavigator로 이동
          try {
            navigation.navigate("TabNavigator" as any);
          } catch (fallbackError) {
            // Fallback 네비게이션도 실패
          }
        }
      }, 200);
    }
  }, [isLoading, authLoading, isAuthenticated, navigation, hasRedirected]);

  // 안전장치: 5초 후에도 리다이렉트가 안되면 강제로 TabNavigator로 이동
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (isLoading || authLoading) {
        try {
          navigation.reset({
            index: 0,
            routes: [{ name: "TabNavigator" }],
          });
        } catch (error) {}
      }
    }, 5000);

    return () => clearTimeout(safetyTimer);
  }, [isLoading, authLoading, navigation]);

  // 스플래시 화면 표시 중이거나 인증 상태 로딩 중, 또는 버전 체크 중
  if (isLoading || authLoading || !versionChecked) {
    return <SplashScreen />;
  }

  // 필수 업데이트 안내 화면
  if (forceUpdateInfo) {
    return (
      <ForceUpdateScreen
        storeUrl={forceUpdateInfo.storeUrl}
        minVersion={forceUpdateInfo.minVersion}
      />
    );
  }

  // 버전 체크 완료 후에도 리다이렉트가 안된 경우를 위한 안전장치
  // 이 경우는 실제로 발생하지 않아야 하지만, 혹시 모를 경우를 대비
  return <SplashScreen />;
}
