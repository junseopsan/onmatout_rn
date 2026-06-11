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
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ConnectTeacherSheet } from "../components/student/ConnectTeacherSheet";
import { AlertDialog } from "../components/ui/AlertDialog";
import { COLORS } from "../constants/Colors";
import { useNotification } from "../contexts/NotificationContext";
import { useAuth } from "../hooks/useAuth";
import { useRoles } from "../hooks/useRoles";
import { nearbyApi } from "../lib/api/nearby";
import { userAPI } from "../lib/api/user";
import { getCurrentCoords } from "../lib/location";
import { RootStackParamList } from "../navigation/types";
import { useAuthStore } from "../stores/authStore";

export default function SettingsScreen() {
  const { user } = useAuth();
  const { roles, activeRole, addRole, removeRole, hasMultipleRoles } =
    useRoles();
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
  const [teacherInfoOpen, setTeacherInfoOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [discoverable, setDiscoverable] = useState(false);

  useEffect(() => {
    if (!user?.id || !roles.includes("student")) return;
    nearbyApi
      .getDiscoverable(user.id)
      .then(setDiscoverable)
      .catch(() => undefined);
  }, [user?.id, roles]);

  const toggleDiscoverable = async (on: boolean) => {
    if (on) {
      // 위치가 있어야 근처 선생님에게 보일 수 있음 — 권한/위치 먼저 확보
      const coords = await getCurrentCoords();
      if (!coords) {
        // 거절/실패 → 켜지 않음 (토글 off 유지)
        setDiscoverable(false);
        await nearbyApi.setDiscoverable(false).catch(() => undefined);
        showSnackbar(
          "위치 권한을 허용해야 근처 선생님에게 보일 수 있어요.",
          "warning",
        );
        return;
      }
      setDiscoverable(true);
      try {
        await nearbyApi.setDiscoverable(true);
        await nearbyApi.updateLocation(coords.lat, coords.lng);
      } catch {
        setDiscoverable(false);
        showSnackbar("변경하지 못했어요. 다시 시도해 주세요.", "error");
      }
    } else {
      setDiscoverable(false);
      try {
        await nearbyApi.setDiscoverable(false);
      } catch {
        setDiscoverable(true);
        showSnackbar("변경하지 못했어요. 다시 시도해 주세요.", "error");
      }
    }
  };

  const startTeacherRole = async () => {
    setTeacherInfoOpen(false);
    const ok = await addRole("teacher");
    if (ok) {
      showSnackbar("선생님 역할이 추가됐어요", "success");
    } else {
      showSnackbar("추가하지 못했어요. 다시 시도해 주세요.", "error");
    }
  };

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
        "warning",
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
            ],
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
        "error",
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
      "취소",
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
            "success",
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
      "수련생 탈퇴",
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
              "error",
            );
          }
        } catch {
          showSnackbar("계정 삭제 중 오류가 발생했습니다.", "error");
        } finally {
          setIsDeletingAccount(false);
        }
      },
      undefined,
      "탈퇴하기",
      "취소",
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
                  알림 권한이 거부되었습니다. 설정에서 허용해주세요.
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

          {/* 앱 섹션 */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>앱</Text>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Linking.openSettings()}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>앱 설정 열기</Text>
              <Text style={styles.settingDescription}>
                알림, 권한 등 기기의 앱 설정으로 이동해요.
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

              {!hasMultipleRoles && roles.length > 0 ? (
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={async () => {
                    if (!roles.includes("teacher")) {
                      // 선생님 역할 추가 전 안내 모달
                      setTeacherInfoOpen(true);
                      return;
                    }
                    const ok = await addRole("student");
                    if (ok) {
                      showSnackbar("수련생 역할이 추가됐어요", "success");
                    }
                  }}
                >
                  <View style={styles.settingContent}>
                    <Text style={styles.settingText}>
                      {roles.includes("teacher")
                        ? "수련생 역할도 추가하기"
                        : "선생님 역할 추가하기"}
                    </Text>
                    <Text style={styles.settingDescription}>
                      한 사용자가 선생님 + 수련생 동시에 가능해요.
                    </Text>
                  </View>
                  <Text style={styles.arrowText}>+</Text>
                </TouchableOpacity>
              ) : null}

              {/* 선생님 역할 해제 (선생님 + 다른 역할이 있을 때만) */}
              {roles.includes("teacher") && roles.length > 1 ? (
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => {
                    Alert.alert(
                      "선생님 역할 해제",
                      "선생님 역할을 해제하면 클래스/수련생 관리 기능을 사용할 수 없어요. 이미 만든 요가원 정보는 보존됩니다. 해제할까요?",
                      [
                        { text: "취소", style: "cancel" },
                        {
                          text: "해제",
                          style: "destructive",
                          onPress: async () => {
                            const ok = await removeRole("teacher");
                            if (ok) {
                              showSnackbar(
                                "선생님 역할을 해제했어요",
                                "success",
                              );
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
                    <Text style={styles.settingText}>선생님 역할 해제</Text>
                    <Text style={styles.settingDescription}>
                      수련생 역할만 남깁니다. 요가원 정보는 보존돼요.
                    </Text>
                  </View>
                  <Text style={styles.arrowText}>›</Text>
                </TouchableOpacity>
              ) : null}

              {/* 수련생 모드일 때만 — 선생님 연결 진입점 */}
              {activeRole === "student" ? (
                <>
                  <TouchableOpacity
                    style={styles.settingItem}
                    onPress={() => setConnectOpen(true)}
                  >
                    <View style={styles.settingContent}>
                      <Text style={styles.settingText}>선생님과 연결</Text>
                      <Text style={styles.settingDescription}>
                        선생님의 초대 QR을 스캔해 연결하세요. 선생님이 미리
                        등록했다면 여기서 바로 수락할 수 있어요.
                      </Text>
                    </View>
                    <Text style={styles.arrowText}>›</Text>
                  </TouchableOpacity>

                  <View style={styles.settingItem}>
                    <View style={styles.settingContent}>
                      <Text style={styles.settingText}>
                        근처 선생님에게 보이기
                      </Text>
                      <Text style={styles.settingDescription}>
                        켜면 가까이 있는 선생님이 나를 찾아 바로 초대할 수
                        있어요.
                      </Text>
                    </View>
                    <Switch
                      value={discoverable}
                      onValueChange={toggleDiscoverable}
                      trackColor={{
                        false: COLORS.border,
                        true: COLORS.primary,
                      }}
                      thumbColor={COLORS.white}
                    />
                  </View>
                </>
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
                수련생 탈퇴
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

      <ConnectTeacherSheet
        visible={connectOpen}
        onClose={() => setConnectOpen(false)}
      />

      {/* 선생님 역할 안내 모달 */}
      <Modal
        visible={teacherInfoOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTeacherInfoOpen(false)}
      >
        <Pressable
          style={styles.tInfoBackdrop}
          onPress={() => setTeacherInfoOpen(false)}
        >
          <Pressable
            style={styles.tInfoCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.tInfoIcon}>
              <Ionicons name="school" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.tInfoTitle}>선생님이 되면</Text>
            <Text style={styles.tInfoSub}>
              수련생을 수업 밖에서도 케어할 수 있어요.
            </Text>

            <View style={styles.tInfoList}>
              {[
                {
                  icon: "calendar-outline",
                  text: "클래스(수업)와 요일/시간 스케줄 만들기",
                },
                {
                  icon: "people-outline",
                  text: "수련생 등록과 초대 코드 발급",
                },
                {
                  icon: "checkmark-done-outline",
                  text: "출석 체크와 수련생별 출석 현황",
                },
                { icon: "ticket-outline", text: "수업권(횟수권/기간권) 관리" },
                { icon: "albums-outline", text: "복습 시퀀스 만들고 공유하기" },
              ].map((it) => (
                <View key={it.text} style={styles.tInfoRow}>
                  <Ionicons
                    name={it.icon as any}
                    size={17}
                    color={COLORS.primary}
                  />
                  <Text style={styles.tInfoRowText}>{it.text}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.tInfoNote}>
              선생님이 되면 &quot;내 요가원&quot;에서 요가원 정보를 등록하고 클래스, 수업권을
              관리할 수 있어요.
            </Text>

            <View style={styles.tInfoActions}>
              <TouchableOpacity
                style={[styles.tInfoBtn, styles.tInfoBtnCancel]}
                onPress={() => setTeacherInfoOpen(false)}
              >
                <Text style={styles.tInfoBtnCancelText}>나중에</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tInfoBtn, styles.tInfoBtnGo]}
                onPress={startTeacherRole}
              >
                <Text style={styles.tInfoBtnGoText}>선생님 시작하기</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    marginTop: 26,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
  },
  settingItem: {
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  tInfoBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  tInfoCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 22,
    alignItems: "center",
  },
  tInfoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(139, 92, 246, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  tInfoTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },
  tInfoSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  tInfoList: {
    alignSelf: "stretch",
    gap: 12,
    marginTop: 18,
    marginBottom: 14,
  },
  tInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tInfoRowText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  tInfoNote: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginBottom: 16,
  },
  tInfoActions: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "stretch",
  },
  tInfoBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  tInfoBtnCancel: {
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tInfoBtnCancelText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  tInfoBtnGo: {
    backgroundColor: COLORS.primary,
  },
  tInfoBtnGoText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
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
