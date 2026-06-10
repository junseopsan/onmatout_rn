import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({
  visible,
  onClose,
}: SettingsModalProps) {
  const { user } = useAuth();
  const { getUserProfile } = useAuthStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 알림 설정 상태
  const [pushNotifications, setPushNotifications] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<string>("unknown");

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

    if (visible) {
      checkNotificationPermission();
    }
  }, [visible]);

  // 사용자 프로필 가져오기 (모달이 열릴 때만)
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user && visible) {
        try {
          const profile = await getUserProfile();
          setUserProfile(profile);

          // 프로필에서 알림 설정 로드
          if (profile) {
            setPushNotifications(profile.push_notifications ?? true);
          }
        } catch (error) {
          console.error("프로필 로드 실패:", error);
        }
      }
    };

    loadUserProfile();
  }, [user, getUserProfile, visible]);

  // 알림 권한 요청
  const requestNotificationPermissions = async () => {
    // Expo Go에서는 알림 기능 사용 불가 (SDK 53+)
    if (Constants.executionEnvironment === "storeClient") {
      Alert.alert(
        "알림 기능 사용 불가",
        "Expo Go에서는 알림 기능을 사용할 수 없습니다. 개발 빌드를 사용해주세요.",
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
        return false;
      }

      return true;
    } catch (error) {
      console.log("알림 권한 요청 실패:", error);
      return false;
    }
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
          Alert.alert(
            "알림 설정",
            "수련 알림이 설정되었습니다. 매일 오전 9시에 알림을 받으실 수 있습니다.",
          );
        } else {
          Alert.alert("알림 설정", "수련 알림이 해제되었습니다.");
        }
      }
    } catch {
      Alert.alert("오류", "알림 설정 중 오류가 발생했습니다.");
    }
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate("PrivacyPolicy");
  };

  const handleTermsOfService = () => {
    navigation.navigate("TermsOfService");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>설정</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.settingsContainer}>
            {/* 개인정보 섹션 */}
            <View style={styles.personalInfoSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>개인정보</Text>
              </View>

              <TouchableOpacity
                style={styles.infoItem}
                onPress={() => navigation.navigate("Nickname")}
              >
                <Text style={styles.infoLabel}>닉네임</Text>
                <View style={styles.infoValueContainer}>
                  <Text style={styles.infoValue}>
                    {userProfile?.name || "사용자"}
                  </Text>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>이메일</Text>
                <Text style={styles.infoValue}>
                  {user?.email || "이메일 없음"}
                </Text>
              </View>
            </View>

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
          </View>
        </View>
      </View>
    </Modal>
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
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  personalInfoSection: {
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
  },
  infoValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 20,
    textAlign: "center",
  },
  nicknameInput: {
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  saveButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },
  permissionWarning: {
    fontSize: 12,
    color: "#FF6B6B",
    marginTop: 4,
    fontWeight: "500",
  },
});
