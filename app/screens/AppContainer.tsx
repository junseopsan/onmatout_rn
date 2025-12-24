import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { RootStackParamList } from "../../navigation/types";
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

  // 이미 초기화되었는지 추적 (포그라운드 복귀 시 재초기화 방지)
  const hasInitializedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

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

  // 앱 시작 시 알림 권한 요청 및 세션 갱신
  useEffect(() => {
    // 알림 권한 요청은 에러가 발생해도 앱 진행에 영향 없도록
    requestNotificationPermissions().catch((error) => {
      console.log("[AppContainer] 알림 권한 요청 실패 (무시):", error);
    });

    // 앱 시작 시 세션이 만료되었거나 만료 직전이면 즉시 갱신 시도
    const refreshSessionOnStart = async () => {
      try {
        // 타임아웃 추가 (5초)
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{
          data: { session: null };
          error: { message: string };
        }>((resolve) => {
          setTimeout(() => {
            resolve({
              data: { session: null },
              error: { message: "Session timeout" },
            });
          }, 5000);
        });

        const result = await Promise.race([sessionPromise, timeoutPromise]);
        const { data, error } = result;

        if (error) {
          console.log(
            "[AppContainer] 앱 시작 시 세션 조회 에러:",
            error.message
          );
          return;
        }

        if (!data?.session) {
          console.log("[AppContainer] 앱 시작 시 세션 없음");
          return;
        }

        const session = data.session;
        if (session.expires_at) {
          const expiresAt = session.expires_at * 1000;
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;

          // 세션이 만료되었거나 만료 직전(5분 이내)이면 즉시 갱신
          if (timeUntilExpiry < 5 * 60 * 1000) {
            console.log("[AppContainer] 앱 시작 시 세션 만료 임박, 갱신 시도", {
              timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + "초",
            });

            // 갱신에도 타임아웃 추가
            const refreshPromise = supabase.auth.refreshSession();
            const refreshTimeoutPromise = new Promise<{
              data: { session: null };
              error: { message: string };
            }>((resolve) => {
              setTimeout(() => {
                resolve({
                  data: { session: null },
                  error: { message: "Refresh timeout" },
                });
              }, 5000);
            });

            const refreshResult = await Promise.race([
              refreshPromise,
              refreshTimeoutPromise,
            ]);
            const { data: refreshData, error: refreshError } = refreshResult;

            if (refreshError) {
              console.log(
                "[AppContainer] 앱 시작 시 세션 갱신 실패:",
                refreshError.message
              );
            } else if (refreshData?.session) {
              console.log("[AppContainer] 앱 시작 시 세션 갱신 성공");
            }
          }
        }
      } catch (error) {
        // 세션 확인 실패는 앱 진행에 영향 없도록
        console.log(
          "[AppContainer] 앱 시작 시 세션 확인 중 오류 (무시):",
          error
        );
      }
    };

    refreshSessionOnStart();
  }, []);

  // 앱 버전 체크 (필수 업데이트 여부)
  useEffect(() => {
    // 이미 초기화된 경우 버전 체크 건너뛰기 (포그라운드 복귀 시)
    if (hasInitializedRef.current && versionChecked) {
      return;
    }

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
        // 에러가 발생해도 버전 체크는 완료로 표시하여 앱이 진행되도록 함
      } finally {
        // 에러가 발생해도 버전 체크는 완료로 표시
        setVersionChecked(true);
      }
    };

    // 버전 체크에 타임아웃 추가 (10초)
    const timeoutId = setTimeout(() => {
      console.log("[VersionCheck] 타임아웃 - 버전 체크 건너뛰기");
      setVersionChecked(true);
    }, 10000);

    checkAppVersion().finally(() => {
      clearTimeout(timeoutId);
    });
  }, [versionChecked]);

  useEffect(() => {
    // 인증 상태 로딩이 완료되면 authLoading을 false로 설정
    if (!authLoadingState) {
      setAuthLoading(false);
    }
  }, [authLoadingState]);

  // 포그라운드 복귀 시 처리 (이미 초기화된 경우 빠르게 처리)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("[AppContainer] 포그라운드 복귀 감지");

        // 이미 초기화된 경우, 빠르게 처리 (스플래시 스크린 건너뛰기)
        if (hasInitializedRef.current && hasRedirected) {
          console.log("[AppContainer] 이미 초기화됨 - 빠른 처리");
          setIsLoading(false);
          setAuthLoading(false);
          setVersionChecked(true);
          return;
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [hasRedirected]);

  useEffect(() => {
    // 이미 초기화된 경우 빠르게 처리
    if (hasInitializedRef.current) {
      setIsLoading(false);
      return;
    }

    // 스플래시 화면을 최소 1.5초는 보여주고, 인증 상태 로딩도 완료된 후에 리다이렉트
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // 인증 상태 로딩이 완료되고 스플래시도 완료된 후에 리다이렉트
  useEffect(() => {
    console.log("[AppContainer] 리다이렉트 조건 체크:", {
      isLoading,
      authLoading,
      versionChecked,
      forceUpdateInfo: !!forceUpdateInfo,
      hasRedirected,
      canNavigate:
        !isLoading &&
        !authLoading &&
        versionChecked &&
        !forceUpdateInfo &&
        !hasRedirected,
    });

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

      console.log("[AppContainer] 리다이렉트 시작:", targetRoute);

      // 약간의 지연을 두어 네비게이션 안정성 확보 (안드로이드에서 더 긴 지연 필요)
      const delay = Platform.OS === "android" ? 500 : 200;
      setTimeout(() => {
        try {
          console.log("[AppContainer] navigation.reset 시도");
          navigation.reset({
            index: 0,
            routes: [{ name: targetRoute }],
          });
          console.log("[AppContainer] navigation.reset 성공");
          // 초기화 완료 표시
          hasInitializedRef.current = true;
        } catch (error) {
          console.log("[AppContainer] navigation.reset 실패:", error);
          // 실패 시 강제로 TabNavigator로 이동
          try {
            console.log("[AppContainer] navigation.navigate 시도");
            navigation.navigate("TabNavigator" as any);
            console.log("[AppContainer] navigation.navigate 성공");
            // 초기화 완료 표시
            hasInitializedRef.current = true;
          } catch (fallbackError) {
            console.log(
              "[AppContainer] navigation.navigate 실패:",
              fallbackError
            );
            // Fallback 네비게이션도 실패하면 hasRedirected를 false로 되돌려서 재시도 가능하게
            setHasRedirected(false);
          }
        }
      }, delay);
    }
  }, [
    isLoading,
    authLoading,
    versionChecked,
    forceUpdateInfo,
    hasRedirected,
    navigation,
    isAuthenticated,
  ]);

  // 안전장치: 5초 후에도 리다이렉트가 안되면 강제로 TabNavigator로 이동
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if ((isLoading || authLoading || !versionChecked) && !hasRedirected) {
        console.log("[AppContainer] 안전장치: 강제 리다이렉트 시도");
        try {
          setHasRedirected(true);
          navigation.reset({
            index: 0,
            routes: [{ name: "TabNavigator" }],
          });
          console.log("[AppContainer] 안전장치: 리다이렉트 성공");
        } catch (error) {
          console.log("[AppContainer] 안전장치: 리다이렉트 실패:", error);
        }
      }
    }, 5000);

    return () => clearTimeout(safetyTimer);
  }, [isLoading, authLoading, versionChecked, hasRedirected, navigation]);

  // 스플래시 화면 표시 중이거나 인증 상태 로딩 중, 또는 버전 체크 중
  if (isLoading || authLoading || !versionChecked) {
    console.log("[AppContainer] SplashScreen 표시:", {
      isLoading,
      authLoading,
      versionChecked,
    });
    return <SplashScreen />;
  }

  // 필수 업데이트 안내 화면
  // if (forceUpdateInfo) {
  //   console.log("[AppContainer] ForceUpdateScreen 표시");
  //   return (
  //     <ForceUpdateScreen
  //       storeUrl={forceUpdateInfo.storeUrl}
  //       minVersion={forceUpdateInfo.minVersion}
  //     />
  //   );
  // }

  // 버전 체크 완료 후에도 리다이렉트가 안된 경우를 위한 안전장치
  // 리다이렉트가 진행 중이면 SplashScreen을 계속 표시
  if (!hasRedirected) {
    console.log("[AppContainer] 리다이렉트 대기 중 - SplashScreen 표시");
    return <SplashScreen />;
  }

  // 리다이렉트 완료 후에도 여기 도달하면 null 반환 (네비게이션이 처리해야 함)
  console.log("[AppContainer] 리다이렉트 완료 - null 반환");
  return null;
}
