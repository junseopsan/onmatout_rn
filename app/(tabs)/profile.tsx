import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
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
import { useAuthStore } from "../../stores/authStore";

export default function ProfileScreen() {
  const { isAuthenticated, loading } = useAuth();
  const { signOut, user, getUserProfile } = useAuthStore();
  const router = useRouter();

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

  const handleSignOut = async () => {
    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handlePrivacyPolicy = () => {
    router.push("/PrivacyPolicy");
  };

  const handleTermsOfService = () => {
    router.push("/TermsOfService");
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

    setIsUploadingImage(true);
    try {
      const result = await storageAPI.uploadProfileImage(user.id);

      if (result.success && result.url) {
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

  // 알림 설정 업데이트
  const updateNotificationSettings = async (type: string, value: boolean) => {
    if (!user) return;

    try {
      const updateData: any = {};
      switch (type) {
        case "push":
          updateData.push_notifications = value;
          break;
        case "email":
          updateData.email_notifications = value;
          break;
        case "practice":
          updateData.practice_reminders = value;
          break;
      }

      const response = await userAPI.updateUserProfile(user.id, updateData);
      if (response.success) {
        setUserProfile(response.data);
      } else {
        console.error("알림 설정 업데이트 실패:", response.message);
      }
    } catch (error) {
      console.error("알림 설정 업데이트 에러:", error);
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
                새로운 기능 및 업데이트 알림
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
                정기적인 수련 리마인더
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

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>로그아웃</Text>
        </TouchableOpacity>
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
});
