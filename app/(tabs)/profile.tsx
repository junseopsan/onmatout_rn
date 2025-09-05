import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { storageAPI } from "../../lib/api/storage";
import { userAPI } from "../../lib/api/user";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";

export default function ProfileScreen() {
  const { isAuthenticated, loading } = useAuth();
  const { user, getUserProfile } = useAuthStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 알림 설정 상태
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [practiceReminders, setPracticeReminders] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // 닉네임 수정 모달 상태
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [editingNickname, setEditingNickname] = useState("");
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false);

  // 이미지 업로드 상태
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
            setEmailNotifications(profile.email_notifications ?? false);
            setPracticeReminders(profile.practice_reminders ?? true);
          }
        } catch (error) {
          console.error("프로필 로드 에러:", error);
        } finally {
          setLoadingProfile(false);
        }
      }
    };

    loadUserProfile();
  }, [user, getUserProfile]);

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading || !isAuthenticated) {
    return null;
  }

  // 로그아웃 기능 제거 (요청에 따라 세션 유지)

  const handlePrivacyPolicy = () => {
    navigation.navigate("PrivacyPolicy");
  };

  const handleTermsOfService = () => {
    navigation.navigate("TermsOfService");
  };

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (phone: string): string => {
    console.log("전화번호 포맷팅 시작:", phone);

    if (!phone) return "전화번호 없음";

    // +82로 시작하는 경우 제거하고 0으로 시작하도록 변경
    let formatted = phone.replace(/^\+82/, "0");
    console.log("+82 제거 후:", formatted);

    // 숫자만 추출
    const numbers = formatted.replace(/\D/g, "");
    console.log("숫자만 추출:", numbers);

    // 12자리인 경우 (821083138230 -> 010-8313-8230)
    if (numbers.length === 12 && numbers.startsWith("82")) {
      const koreanNumber = "0" + numbers.slice(2);
      const result = `${koreanNumber.slice(0, 3)}-${koreanNumber.slice(3, 7)}-${koreanNumber.slice(7)}`;
      console.log("12자리 포맷팅 결과:", result);
      return result;
    }

    // 11자리인 경우 (01012345678 -> 010-1234-5678)
    if (numbers.length === 11) {
      const result = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
      console.log("11자리 포맷팅 결과:", result);
      return result;
    }

    // 10자리인 경우 (0101234567 -> 010-123-4567)
    if (numbers.length === 10) {
      const result = `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
      console.log("10자리 포맷팅 결과:", result);
      return result;
    }

    // 그 외의 경우 원본 반환
    console.log("기본 반환:", formatted);
    return formatted;
  };

  // 닉네임 수정 모달 열기
  const openNicknameModal = () => {
    setEditingNickname(userProfile?.name || "");
    setShowNicknameModal(true);
  };

  // 닉네임 수정 모달 닫기
  const closeNicknameModal = () => {
    setShowNicknameModal(false);
    setEditingNickname("");
  };

  // 이미지 업로드
  const handleImageUpload = async () => {
    if (!user) return;

    // 이미지 변경 옵션 제공
    Alert.alert("프로필 사진 변경", "프로필 사진을 어떻게 변경하시겠습니까?", [
      {
        text: "갤러리에서 선택",
        onPress: () => uploadFromGallery(),
      },
      ...(userProfile?.avatar_url
        ? [
            {
              text: "기본 이미지로 변경",
              onPress: () => removeProfileImage(),
            },
          ]
        : []),
      {
        text: "취소",
        style: "cancel",
      },
    ]);
  };

  // 갤러리에서 이미지 업로드
  const uploadFromGallery = async () => {
    if (!user) return;

    setIsUploadingImage(true);
    try {
      console.log("갤러리에서 이미지 업로드 시작");
      const result = await storageAPI.uploadProfileImage(user.id);

      if (result.success && result.url) {
        // 기존 이미지가 있다면 삭제
        if (userProfile?.avatar_url) {
          await storageAPI.deleteProfileImage(userProfile.avatar_url);
        }

        // 프로필에 이미지 URL 업데이트
        const response = await userAPI.updateUserProfile(user.id, {
          avatar_url: result.url,
        });

        if (response.success) {
          setUserProfile(response.data);
          Alert.alert("성공", "프로필 사진이 업데이트되었습니다.");
        } else {
          Alert.alert("오류", "프로필 업데이트에 실패했습니다.");
        }
      } else {
        Alert.alert("오류", result.message || "이미지 업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("이미지 업로드 에러:", error);
      Alert.alert("오류", "이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 프로필 이미지 제거
  const removeProfileImage = async () => {
    if (!user || !userProfile?.avatar_url) return;

    Alert.alert("프로필 사진 제거", "프로필 사진을 제거하시겠습니까?", [
      {
        text: "제거",
        style: "destructive",
        onPress: async () => {
          setIsUploadingImage(true);
          try {
            // 기존 이미지 삭제
            await storageAPI.deleteProfileImage(userProfile.avatar_url);

            // 프로필에서 이미지 URL 제거
            const response = await userAPI.updateUserProfile(user.id, {
              avatar_url: undefined,
            });

            if (response.success) {
              setUserProfile(response.data);
              Alert.alert("성공", "프로필 사진이 제거되었습니다.");
            } else {
              Alert.alert("오류", "프로필 업데이트에 실패했습니다.");
            }
          } catch (error) {
            console.error("이미지 제거 에러:", error);
            Alert.alert("오류", "이미지 제거 중 오류가 발생했습니다.");
          } finally {
            setIsUploadingImage(false);
          }
        },
      },
      {
        text: "취소",
        style: "cancel",
      },
    ]);
  };

  // 닉네임 수정 저장
  const saveNickname = async () => {
    if (!user || !editingNickname.trim()) return;

    setIsUpdatingNickname(true);
    try {
      const response = await userAPI.updateUserProfile(user.id, {
        name: editingNickname.trim(),
      });

      if (response.success) {
        setUserProfile(response.data);
        closeNicknameModal();
      } else {
        Alert.alert("오류", response.message || "닉네임 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("닉네임 수정 에러:", error);
      Alert.alert("오류", "닉네임 수정 중 오류가 발생했습니다.");
    } finally {
      setIsUpdatingNickname(false);
    }
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
      Alert.alert(
        "알림 권한 필요",
        "알림을 받으려면 알림 권한을 허용해주세요.",
        [{ text: "설정으로 이동", onPress: () => {} }]
      );
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
      console.error("푸시 토큰 가져오기 실패:", error);
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
    } catch (error) {
      console.error("알림 스케줄링 실패:", error);
    }
  };

  // 알림 설정 업데이트
  const updateNotificationSettings = async (type: string, value: boolean) => {
    if (!user) return;

    try {
      // 알림 권한 확인
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        // 권한이 없으면 설정을 false로 변경
        switch (type) {
          case "push":
            setPushNotifications(false);
            break;
          case "practice":
            setPracticeReminders(false);
            break;
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
        case "email":
          updateData.email_notifications = value;
          break;
        case "practice":
          updateData.practice_reminders = value;
          await schedulePracticeReminder(value);
          break;
      }

      const response = await userAPI.updateUserProfile(user.id, updateData);
      if (response.success) {
        setUserProfile(response.data);

        // 성공 메시지 표시
        if (type === "practice") {
          if (value) {
            Alert.alert(
              "알림 설정",
              "수련 알림이 설정되었습니다. 매일 오전 9시에 알림을 받으실 수 있습니다."
            );
          } else {
            Alert.alert("알림 설정", "수련 알림이 해제되었습니다.");
          }
        }
      } else {
        console.error("알림 설정 업데이트 실패:", response.message);
        Alert.alert("오류", "알림 설정 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("알림 설정 업데이트 에러:", error);
      Alert.alert("오류", "알림 설정 중 오류가 발생했습니다.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* <Text style={styles.title}>프로필</Text> */}
      </View>

      <View style={styles.content}>
        {/* 사용자 프로필 섹션 */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleImageUpload}
            disabled={isUploadingImage}
            activeOpacity={0.7}
          >
            {userProfile?.avatar_url ? (
              <Image
                source={{ uri: userProfile.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userProfile?.name
                    ? userProfile.name.charAt(0).toUpperCase()
                    : "U"}
                </Text>
              </View>
            )}

            {/* 카메라 아이콘 */}
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={16} color="white" />
            </View>

            {isUploadingImage && (
              <View style={styles.uploadingOverlay}>
                <Text style={styles.uploadingText}>업로드 중...</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.nicknameContainer}
            onPress={openNicknameModal}
            activeOpacity={0.7}
          >
            <Text style={styles.nickname}>{userProfile?.name || "사용자"}</Text>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
          <Text style={styles.phoneNumber}>
            {(() => {
              console.log("전화번호 표시 - user.phone:", user?.phone);
              return formatPhoneNumber(user?.phone || "");
            })()}
          </Text>
        </View>

        {/* 전화번호 정보는 프로필 섹션에서 이미 표시하므로 제거 */}

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

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>수련 알림</Text>
              <Text style={styles.settingDescription}>
                매일 정기적인 요가 수련 리마인더
              </Text>
            </View>
            <Switch
              value={practiceReminders}
              onValueChange={(value) => {
                setPracticeReminders(value);
                updateNotificationSettings("practice", value);
              }}
              trackColor={{ false: COLORS.surface, true: COLORS.primary }}
              thumbColor={practiceReminders ? "white" : COLORS.textSecondary}
            />
          </View>

          {/* 알림 테스트 버튼 */}
          {practiceReminders && (
            <TouchableOpacity
              style={styles.testNotificationButton}
              onPress={async () => {
                try {
                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title: "🧘‍♀️ 요가 수련 알림 테스트",
                      body: "알림이 정상적으로 작동합니다!",
                      data: { type: "test" },
                    },
                    trigger: null, // 즉시 실행
                  });
                  Alert.alert("알림 테스트", "테스트 알림이 전송되었습니다!");
                } catch (error) {
                  console.error("테스트 알림 실패:", error);
                  Alert.alert("오류", "테스트 알림 전송에 실패했습니다.");
                }
              }}
            >
              <Text style={styles.testNotificationButtonText}>알림 테스트</Text>
            </TouchableOpacity>
          )}

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

        {/* 로그아웃 버튼 제거 */}
      </View>

      {/* 닉네임 수정 모달 */}
      <Modal
        visible={showNicknameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeNicknameModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>닉네임 수정</Text>

            <TextInput
              style={styles.nicknameInput}
              value={editingNickname}
              onChangeText={setEditingNickname}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={20}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeNicknameModal}
                disabled={isUpdatingNickname}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveNickname}
                disabled={isUpdatingNickname || !editingNickname.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {isUpdatingNickname ? "저장 중..." : "저장"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingTop: 60, // 상태바 높이 + 여백
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 100, // 탭바 높이 + 여백
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
    paddingVertical: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  nickname: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  nicknameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  editIcon: {
    fontSize: 16,
    marginLeft: 8,
    opacity: 0.7,
  },
  phoneNumber: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  userInfo: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  userLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  userValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
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
  signOutButton: {
    backgroundColor: COLORS.error,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
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
  testNotificationButton: {
    backgroundColor: COLORS.secondary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  testNotificationButtonText: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
});
