import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Linking, Platform, View } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useRoles } from "../../hooks/useRoles";
import { registerPushTokenForUser } from "../../lib/pushTokens";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../constants/Colors";
import { RootStackParamList } from "../../navigation/types";
import ForceUpdateScreen from "./ForceUpdateScreen";
import SplashScreen from "./SplashScreen";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** 현재 버전이 최소 필요 버전보다 낮을 때만 업데이트 필요 (같으면 통과) */
const needsForceUpdateByVersion = (current: string, minRequired: string) => {
  const pa = current.split(".").map(Number);
  const pb = minRequired.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av < bv) return true;
    if (av > bv) return false;
  }
  return false; // 같으면 업데이트 불필요 → 앱 사용 가능
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
  const { isAuthenticated, loading: authLoadingState, user } = useAuth();
  const {
    isTeacher,
    needsRoleSelection,
    loaded: rolesLoaded,
  } = useRoles();

  // 로그인 후 푸시 토큰 등록 (한 번만)
  const pushRegisteredRef = useRef(false);
  useEffect(() => {
    if (
      !pushRegisteredRef.current &&
      isAuthenticated &&
      user?.id
    ) {
      pushRegisteredRef.current = true;
      registerPushTokenForUser(user.id).catch(() => undefined);
    }
  }, [isAuthenticated, user?.id]);

  // 푸시 탭 → 화면 이동 (data 기반 딥링크)
  const routeFromNotification = (data: any) => {
    if (!data) return;
    try {
      if (data.thread_id) {
        navigation.navigate("YogaTalkThread", { threadId: data.thread_id });
      } else {
        navigation.navigate("Notifications");
      }
    } catch {
      // 네비게이터 미준비 등 — 무시
    }
  };

  // 앱 실행 중 푸시 탭 + 종료 상태에서 푸시로 실행된 경우
  const coldStartHandledRef = useRef(false);
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        routeFromNotification(response.notification.request.content.data);
      },
    );
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (coldStartHandledRef.current) return;
    if (!isAuthenticated || !rolesLoaded) return;
    coldStartHandledRef.current = true;
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          routeFromNotification(
            response.notification.request.content.data,
          );
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, rolesLoaded]);

  // 초대 딥링크 (onmatout://invite?code=ONM-XXXX)
  const pendingInviteRef = useRef<string | null>(null);
  const handleInviteUrl = (url: string | null) => {
    if (!url || !url.includes("invite")) return;
    const m = url.match(/[?&]code=([^&]+)/);
    if (!m) return;
    const code = decodeURIComponent(m[1]).toUpperCase();
    if (isAuthenticated) {
      navigation.navigate("AuthMatch", { inviteCode: code });
    } else {
      pendingInviteRef.current = code;
    }
  };

  useEffect(() => {
    Linking.getInitialURL()
      .then(handleInviteUrl)
      .catch(() => undefined);
    const sub = Linking.addEventListener("url", ({ url }) =>
      handleInviteUrl(url),
    );
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // 미로그인 상태로 받은 초대 코드: 로그인 완료 후 자동 적용
  useEffect(() => {
    if (isAuthenticated && rolesLoaded && pendingInviteRef.current) {
      const code = pendingInviteRef.current;
      pendingInviteRef.current = null;
      navigation.navigate("AuthMatch", { inviteCode: code });
    }
  }, [isAuthenticated, rolesLoaded, navigation]);

  // 이미 초기화되었는지 추적
  const hasInitializedRef = useRef(false);

  // 알림 권한 요청 함수
  const requestNotificationPermissions = async () => {
    // Expo Go에서는 알림 기능 사용 불가 (SDK 53+) - 조용히 무시
    if (Constants.executionEnvironment === "storeClient") {
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
          console.log("[AppContainer] 알림 권한 허용됨");
        } else {
          // 권한이 거부되었을 때 Android에서만 설정으로 이동
          if (Platform.OS === "android") {
            Alert.alert(
              "알림 권한 필요",
              "알림을 받으려면 알림 권한을 허용해주세요.",
              [
                { text: "취소", style: "cancel" },
                {
                  text: "설정으로 이동",
                  onPress: () => Linking.openSettings(),
                },
              ],
            );
          }
        }
      } else {
        console.log("[AppContainer] 알림 권한 이미 허용됨");
      }
    } catch (error: any) {
      // Expo Go 관련 에러는 조용히 무시
      const errorMessage = error?.message || String(error);
      if (
        errorMessage.includes("Expo Go") ||
        errorMessage.includes("expo-notifications") ||
        errorMessage.includes("SDK 53") ||
        errorMessage.includes("development build")
      ) {
        // Expo Go 환경에서 발생하는 정상적인 에러 - 무시
        return;
      }
      console.log("[AppContainer] 알림 권한 요청 실패:", error);
    }
  };

  // 앱 시작 시 알림 권한 요청. 세션 갱신은 supabase 클라이언트의 autoRefreshToken 이 담당.
  useEffect(() => {
    requestNotificationPermissions().catch((error) => {
      console.log("[AppContainer] 알림 권한 요청 실패 (무시):", error);
    });
  }, []);

  // 앱 버전 체크 (필수 업데이트 여부)
  useEffect(() => {
    // 이미 초기화된 경우 버전 체크 건너뛰기 (포그라운드 복귀 시)
    if (hasInitializedRef.current && versionChecked) {
      return;
    }

    const checkAppVersion = async () => {
      try {
        // 앱 버전은 항상 app.json의 version으로 비교 (Expo Go/개발빌드에서는 네이티브가 SDK 버전(54.x)을 반환함)
        const currentVersion =
          Constants.expoConfig?.version ||
          Application.nativeApplicationVersion ||
          Application.nativeBuildVersion ||
          "0.0.0";
        const platform = Platform.OS === "ios" ? "ios" : "android";

        const { data, error } = await supabase
          .from("app_versions")
          .select("min_version, store_url")
          .ilike("platform", platform)
          .order("min_version", { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log("[VersionCheck]", {
          currentVersion,
          minVersion: data?.min_version ?? null,
          error: error?.message ?? null,
        });

        if (!error && data?.min_version && data?.store_url) {
          const needsForceUpdate = needsForceUpdateByVersion(
            currentVersion,
            data.min_version,
          );
          if (needsForceUpdate) {
            setForceUpdateInfo({
              minVersion: data.min_version,
              storeUrl: data.store_url,
            });
          }
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

    // 인증된 사용자는 roles 첫 로드 완료(loaded=true)까지 기다림 — 그래야 역할 분기가 의미 있음
    const rolesReady = !isAuthenticated || rolesLoaded;

    if (
      !isLoading &&
      !authLoading &&
      versionChecked &&
      !forceUpdateInfo &&
      !hasRedirected &&
      rolesReady
    ) {
      // 인증되지 않았거나 역할 정보 로딩 중이면 기존 TabNavigator (게스트 + nickname 흐름)
      // 인증된 사용자는 역할 분기:
      //   - user_roles 비어있음 → RoleSelect
      //   - teacher 활성 → TeacherHome
      //   - 그 외 → TabNavigator (기존 student 시점)
      let targetRoute: keyof RootStackParamList = "TabNavigator";
      if (isAuthenticated && rolesLoaded) {
        if (needsRoleSelection) {
          targetRoute = "RoleSelect";
        } else if (isTeacher) {
          targetRoute = "TeacherTabNavigator";
        }
      }

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
              fallbackError,
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
    rolesLoaded,
    isTeacher,
    needsRoleSelection,
  ]);

  // 안전장치: 5초 후에도 리다이렉트가 안 되면 강제로 TabNavigator로 이동 (필수 업데이트 중이면 제외)
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!hasRedirected && !forceUpdateInfo) {
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
  }, [hasRedirected, forceUpdateInfo, navigation]);

  // 스플래시 화면 표시 중이거나 인증 상태 로딩 중, 또는 버전 체크 중
  if (isLoading || authLoading || !versionChecked) {
    console.log("[AppContainer] SplashScreen 표시:", {
      isLoading,
      authLoading,
      versionChecked,
    });
    return <SplashScreen />;
  }

  // 필수 업데이트 안내 화면 (구버전 사용자)
  if (forceUpdateInfo) {
    return (
      <ForceUpdateScreen
        storeUrl={forceUpdateInfo.storeUrl}
        minVersion={forceUpdateInfo.minVersion}
      />
    );
  }

  // 버전 체크 완료 후에도 리다이렉트가 안된 경우를 위한 안전장치
  // 리다이렉트가 진행 중이면 SplashScreen을 계속 표시
  if (!hasRedirected) {
    console.log("[AppContainer] 리다이렉트 대기 중 - SplashScreen 표시");
    return <SplashScreen />;
  }

  // 리다이렉트 완료 후: null 반환 시 프로덕션에서 검정 화면이 되므로 배경색 View 반환
  // (reset 직후 한 프레임이라도 AppContainer가 null을 그리면 검정으로 보임)
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }} />
  );
}
