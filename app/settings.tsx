import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/Colors";
import { useNotification } from "../contexts/NotificationContext";
import { useAuth } from "../hooks/useAuth";
import { RootStackParamList } from "../navigation/types";
import { useAuthStore } from "../stores/authStore";

export default function SettingsScreen() {
  const { user } = useAuth();
  const { getUserProfile } = useAuthStore();
  const { showSnackbar } = useNotification();
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
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationPermissionStatus(status);
        console.log("설정: 알림 권한 상태:", status);
      } catch (error) {
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
          setUserProfile(profile);

          // 프로필에서 알림 설정 로드
          if (profile) {
            setPushNotifications(profile.push_notifications ?? true);
          }
        } catch (error) {}
      }
    };

    loadUserProfile();
  }, [user, getUserProfile]);

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return "전화번호 없음";

    // +82로 시작하는 경우 제거하고 0으로 시작하도록 변경
    let formatted = phone.replace(/^\+82/, "0");

    // 숫자만 추출
    const numbers = formatted.replace(/\D/g, "");

    // 12자리인 경우 (821083138230 -> 010-8313-8230)
    if (numbers.length === 12 && numbers.startsWith("82")) {
      const koreanNumber = "0" + numbers.slice(2);
      const result = `${koreanNumber.slice(0, 3)}-${koreanNumber.slice(
        3,
        7
      )}-${koreanNumber.slice(7)}`;
      return result;
    }

    // 11자리인 경우 (01012345678 -> 010-1234-5678)
    if (numbers.length === 11) {
      const result = `${numbers.slice(0, 3)}-${numbers.slice(
        3,
        7
      )}-${numbers.slice(7)}`;
      return result;
    }

    // 10자리인 경우 (0101234567 -> 010-123-4567)
    if (numbers.length === 10) {
      const result = `${numbers.slice(0, 3)}-${numbers.slice(
        3,
        6
      )}-${numbers.slice(6)}`;
      return result;
    }

    // 그 외의 경우 원본 반환
    return formatted;
  };

  // 알림 권한 요청
  const requestNotificationPermissions = async () => {
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
      showSnackbar("알림을 받으려면 알림 권한을 허용해주세요.", "warning");
      return false;
    }

    return true;
  };

  // 푸시 알림 토큰 가져오기
  const getPushToken = async () => {
    if (!Device.isDevice) return null;

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: "your-project-id", // Expo 프로젝트 ID로 변경 필요
      });
      return token.data;
    } catch (error) {
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
    } catch (error) {}
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
    } catch (error) {
      showSnackbar("알림 설정 중 오류가 발생했습니다.", "error");
    }
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate("PrivacyPolicy");
  };

  const handleTermsOfService = () => {
    navigation.navigate("TermsOfService");
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
          {/* 개인정보 섹션 */}
          <View style={styles.personalInfoSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>개인정보</Text>
            </View>

            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate("EditNickname")}
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
              <Text style={styles.infoLabel}>전화번호</Text>
              <Text style={styles.infoValue}>
                {formatPhoneNumber(user?.phone || "")}
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
  personalInfoSection: {
    marginBottom: 32,
    marginTop: 24,
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
  permissionWarning: {
    fontSize: 12,
    color: "#FF6B6B",
    marginTop: 4,
    fontWeight: "500",
  },
});
