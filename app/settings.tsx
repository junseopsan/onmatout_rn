import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AlertDialog } from "../components/ui/AlertDialog";
import { COLORS } from "../constants/Colors";
import { useNotification } from "../contexts/NotificationContext";
import { useAuth } from "../hooks/useAuth";
import { useRoles } from "../hooks/useRoles";
import { useRoleSwitch } from "../hooks/useRoleSwitch";
import { userAPI } from "../lib/api/user";
import { RootStackParamList } from "../navigation/types";
import { useAuthStore } from "../stores/authStore";

export default function SettingsScreen() {
  const { user } = useAuth();
  const { roles, activeRole, addRole, removeRole, hasMultipleRoles } =
    useRoles();
  const { switchTo } = useRoleSwitch();
  const { getUserProfile, clearSession, signOut } = useAuthStore();
  const { showSnackbar } = useNotification();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  // 알림 설정 상태
  const [pushNotifications, setPushNotifications] = useState(true);
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<string>("unknown");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 알림 권한 상태 확인
  useEffect(() => {
    const checkNotificationPermission = async () => {
      // Expo Go에서는 알림 기능 사용 불가 (SDK 53+)
      if (Constants.executionEnvironment === "storeClient") {
        setNotificationPermissionStatus("denied");
        return;
      }

      try {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationPermissionStatus(status);
        console.log("설정: 알림 권한 상태:", status);
      } catch {
        setNotificationPermissionStatus("unknown");
      }
    };

    checkNotificationPermission();
  }, []);

  // 사용자 프로필 가져오기
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile();

          // 프로필에서 알림 설정 로드
          if (profile) {
            setPushNotifications(profile.push_notifications ?? true);
          }
        } catch {}
      }
    };

    loadUserProfile();
  }, [user, getUserProfile]);

  // 알림 권한 요청
  const requestNotificationPermissions = async () => {
    // Expo Go에서는 알림 기능 사용 불가 (SDK 53+)
    if (Constants.executionEnvironment === "storeClient") {
      showSnackbar(
        "Expo Go에서는 알림 기능을 사용할 수 없습니다. 개발 빌드를 사용해주세요.",
        "warning"
      );
      return false;
    }

    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        // Android에서만 설정으로 이동 팝업 표시
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
            ]
          );
        } else {
          showSnackbar("알림을 받으려면 알림 권한을 허용해주세요.", "warning");
        }
        return false;
      }

      return true;
    } catch (error) {
      console.log("알림 권한 요청 실패:", error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      queryClient.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      });
    } catch (error: any) {
      showSnackbar(
        error?.message || "로그아웃에 실패했습니다. 다시 시도해주세요.",
        "error"
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const confirmLogout = () => {
    AlertDialog.confirm(
      "로그아웃",
      "정말로 로그아웃하시겠습니까?",
      handleLogout,
      () => {},
      "로그아웃",
      "취소"
    );
  };

  // 푸시 알림 토큰 가져오기
  const getPushToken = async () => {
    if (!Device.isDevice) return null;

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: "your-project-id", // Expo 프로젝트 ID로 변경 필요
      });
      return token.data;
    } catch {
      return null;
    }
  };

  // 수련 알림 스케줄링
  const schedulePracticeReminder = async (enabled: boolean) => {
    if (!enabled) {
      // 기존 알림 모두 취소
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    try {
      // 즉시 알림 테스트 (1초 후)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧘‍♀️ 요가 수련 시간입니다!",
          body: "오늘도 건강한 하루를 위해 요가를 시작해보세요.",
          data: { type: "practice_reminder" },
        },
        trigger: null, // 즉시 실행
      });

      console.log("수련 알림이 성공적으로 스케줄되었습니다.");
    } catch {}
  };

  // 알림 설정 업데이트
  const updateNotificationSettings = async (type: string, value: boolean) => {
    if (!user) return;

    try {
      // 알림 권한 확인
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        // 권한이 없으면 설정을 false로 변경
        if (type === "push") {
          setPushNotifications(false);
        }
        return;
      }

      const updateData: any = {};
      switch (type) {
        case "push":
          updateData.push_notifications = value;
          if (value) {
            const token = await getPushToken();
            if (token) {
              updateData.push_token = token;
            }
          }
          break;
        case "practice":
          updateData.practice_reminders = value;
          await schedulePracticeReminder(value);
          break;
      }

      // 알림 설정 업데이트 (임시로 성공 처리)
      console.log("알림 설정 업데이트:", updateData);

      // 성공 메시지 표시
      if (type === "practice") {
        if (value) {
          showSnackbar(
            "수련 알림이 설정되었습니다. 매일 오전 9시에 알림을 받으실 수 있습니다.",
            "success"
          );
        } else {
          showSnackbar("수련 알림이 해제되었습니다.", "info");
        }
      }
    } catch {
      showSnackbar("알림 설정 중 오류가 발생했습니다.", "error");
    }
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate("PrivacyPolicy");
  };

  const handleTermsOfService = () => {
    navigation.navigate("TermsOfService");
  };

  const confirmDeleteAccount = () => {
    AlertDialog.confirm(
      "회원 탈퇴",
      "탈퇴 시 모든 수련 기록과 즐겨찾기 정보가 삭제되며 복구할 수 없습니다. 계속하시겠어요?",
      async () => {
        setIsDeletingAccount(true);
        try {
          const result = await userAPI.deleteAccount();
          if (result.success) {
            showSnackbar("계정이 삭제되었습니다.", "success");
            await clearSession();
            navigation.reset({
              index: 0,
              routes: [{ name: "Auth" }],
            });
          } else {
            showSnackbar(
              result.message || "계정을 삭제할 수 없습니다. 다시 시도해주세요.",
              "error"
            );
          }
        } catch (error) {
          showSnackbar("계정 삭제 중 오류가 발생했습니다.", "error");
        } finally {
          setIsDeletingAccount(false);
        }
      },
      undefined,
      "탈퇴하기",
      "취소"
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.settingsContainer}>
          {/* 알림 설정 섹션 */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>알림 설정</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>푸시 알림</Text>
              <Text style={styles.settingDescription}>
                새로운 기능, 업데이트 및 중요 알림
              </Text>
              {notificationPermissionStatus === "denied" && (
                <Text style={styles.permissionWarning}>
                  ⚠️ 알림 권한이 거부되었습니다. 설정에서 허용해주세요.
                </Text>
              )}
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={(value) => {
                setPushNotifications(value);
                updateNotificationSettings("push", value);
              }}
              trackColor={{ false: COLORS.surface, true: COLORS.primary }}
              thumbColor={pushNotifications ? "white" : COLORS.textSecondary}
            />
          </View>


          {/* 고객지원 섹션 */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>고객지원</Text>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate("CreateSupportRequest")}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>건의사항</Text>
              <Text style={styles.settingDescription}>
                버그 신고, 기능 제안, 문의사항을 남겨주세요
              </Text>
            </View>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>

          {/* 역할 / 모드 섹션 (Phase 1) */}
          {user ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>역할</Text>
              </View>

              {hasMultipleRoles ? (
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() =>
                    switchTo(activeRole === "teacher" ? "student" : "teacher")
                  }
                >
                  <View style={styles.settingContent}>
                    <Text style={styles.settingText}>
                      {activeRole === "teacher"
                        ? "수련생 모드로 전환"
                        : "지도자 모드로 전환"}
                    </Text>
                    <Text style={styles.settingDescription}>
                      다중 역할 — 언제든 전환할 수 있어요.
                    </Text>
                  </View>
                  <Text style={styles.arrowText}>›</Text>
                </TouchableOpacity>
              ) : roles.length > 0 ? (
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={async () => {
                    const missing = roles.includes("teacher") ? "student" : "teacher";
                    const ok = await addRole(missing);
                    if (ok) {
                      showSnackbar(
                        missing === "teacher"
                          ? "선생님 역할이 추가됐어요"
                          : "회원 역할이 추가됐어요",
                        "success",
                      );
                    }
                  }}
                >
                  <View style={styles.settingContent}>
                    <Text style={styles.settingText}>
                      {roles.includes("teacher")
                        ? "회원 역할도 추가하기"
                        : "선생님 역할도 추가하기"}
                    </Text>
                    <Text style={styles.settingDescription}>
                      한 사용자가 선생님 + 회원 동시에 가능해요.
                    </Text>
                  </View>
                  <Text style={styles.arrowText}>+</Text>
                </TouchableOpacity>
              ) : null}

              {/* 지도자 역할 해제 (지도자 + 다른 역할이 있을 때만) */}
              {roles.includes("teacher") && roles.length > 1 ? (
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => {
                    Alert.alert(
                      "지도자 역할 해제",
                      "지도자 역할을 해제하면 클래스/회원 관리 기능을 사용할 수 없어요. 이미 만든 요가원 정보는 보존됩니다. 해제할까요?",
                      [
                        { text: "취소", style: "cancel" },
                        {
                          text: "해제",
                          style: "destructive",
                          onPress: async () => {
                            const ok = await removeRole("teacher");
                            if (ok) {
                              showSnackbar("지도자 역할을 해제했어요", "success");
                            } else {
                              showSnackbar(
                                "해제하지 못했어요. 다시 시도해 주세요.",
                                "error",
                              );
                            }
                          },
                        },
                      ],
                    );
                  }}
                >
                  <View style={styles.settingContent}>
                    <Text style={styles.settingText}>지도자 역할 해제</Text>
                    <Text style={styles.settingDescription}>
                      수련생 역할만 남깁니다. 요가원 정보는 보존돼요.
                    </Text>
                  </View>
                  <Text style={styles.arrowText}>›</Text>
                </TouchableOpacity>
              ) : null}

              {/* 회원 모드일 때만 — 선생님 연결 진입점 */}
              {roles.includes("student") ? (
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => navigation.navigate("AuthMatch" as any)}
                >
                  <View style={styles.settingContent}>
                    <Text style={styles.settingText}>선생님과 연결 / 초대 코드</Text>
                    <Text style={styles.settingDescription}>
                      선생님이 회원으로 등록했거나 초대 코드(ONM-XXXX)를 받았다면
                      여기서 연결하세요.
                    </Text>
                  </View>
                  <Text style={styles.arrowText}>›</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}

          {/* 요가원 관리 — 선생님 역할 보유 시에만 노출 */}
          {user && roles.includes("teacher") ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>요가원</Text>
              </View>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => navigation.navigate("TeacherStudioList" as any)}
              >
                <View style={styles.settingContent}>
                  <Text style={styles.settingText}>내 요가원 관리</Text>
                  <Text style={styles.settingDescription}>
                    상호명, 연락처, 운영시간, 홈페이지 등 정보를 추가/수정하고
                    여러 요가원을 전환하세요.
                  </Text>
                </View>
                <Text style={styles.arrowText}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() =>
                  navigation.navigate("TeacherStudioApply" as any)
                }
              >
                <View style={styles.settingContent}>
                  <Text style={styles.settingText}>+ 새 요가원 등록 신청</Text>
                  <Text style={styles.settingDescription}>
                    한 번의 신청으로 자동 승인돼요. 추가 요가원도 같은 흐름으로
                    등록할 수 있어요.
                  </Text>
                </View>
                <Text style={styles.arrowText}>›</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {/* 수련생 → 원장 전환 진입점: 아직 지도자 역할이 없을 때만 */}
          {user && !roles.includes("teacher") ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>요가원</Text>
              </View>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() =>
                  navigation.navigate("TeacherStudioApply" as any)
                }
              >
                <View style={styles.settingContent}>
                  <Text style={styles.settingText}>요가원 등록 신청</Text>
                  <Text style={styles.settingDescription}>
                    내 요가원을 운영하시나요? 신청 즉시 원장으로 전환돼요 (자동
                    승인, 후속 검토).
                  </Text>
                </View>
                <Text style={styles.arrowText}>›</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {/* 약관 및 정책 섹션 */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>약관 및 정책</Text>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handlePrivacyPolicy}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>개인정보 처리방침</Text>
            </View>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleTermsOfService}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>이용약관</Text>
            </View>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>계정</Text>
          </View>

          <TouchableOpacity
            style={[styles.settingItem, isLoggingOut && styles.disabledItem]}
            onPress={confirmLogout}
            disabled={isLoggingOut}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>로그아웃</Text>
              <Text style={styles.settingDescription}>
                현재 계정에서 로그아웃합니다.
              </Text>
            </View>
            <Text style={styles.arrowText}>{isLoggingOut ? "…" : "›"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingItem,
              styles.dangerItem,
              isDeletingAccount && styles.disabledItem,
            ]}
            onPress={confirmDeleteAccount}
            disabled={isDeletingAccount}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingText, styles.dangerText]}>
                회원 탈퇴
              </Text>
              <Text
                style={[styles.settingDescription, styles.dangerDescription]}
              >
                모든 개인 데이터와 수련 기록이 영구 삭제됩니다.
              </Text>
            </View>
            <Text style={[styles.arrowText, styles.dangerText]}>
              {isDeletingAccount ? "…" : "›"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60, // 상태바 높이 + 여백
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  placeholder: {
    width: 40, // 뒤로가기 버튼과 같은 크기로 균형 맞춤
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  settingsContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  settingItem: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingContent: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  settingDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  arrowText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: "300",
  },
  dangerItem: {
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  dangerText: {
    color: "#F87171",
    fontWeight: "600",
  },
  dangerDescription: {
    color: "#FCA5A5",
  },
  disabledItem: {
    opacity: 0.6,
  },
  permissionWarning: {
    fontSize: 12,
    color: "#FF6B6B",
    marginTop: 4,
    fontWeight: "500",
  },
});
