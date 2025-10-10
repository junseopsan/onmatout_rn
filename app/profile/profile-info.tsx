import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { storageAPI } from "../../lib/api/storage";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";

export default function ProfileInfoScreen() {
  const { user } = useAuth();
  const { getUserProfile } = useAuthStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // 사용자 프로필 가져오기
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile();
          setUserProfile(profile);
        } catch (error) {
          console.error("프로필 로드 실패:", error);
        }
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

  // 프로필 사진 변경 함수
  const handleChangeAvatar = () => {
    Alert.alert("프로필 사진 변경", "프로필 사진을 어떻게 변경하시겠습니까?", [
      {
        text: "카메라로 촬영",
        onPress: () => takePhoto(),
      },
      {
        text: "갤러리에서 선택",
        onPress: () => pickImage(),
      },
      {
        text: "기본 이미지로 변경",
        onPress: () => removeAvatar(),
      },
      {
        text: "취소",
        style: "cancel",
      },
    ]);
  };

  // 카메라로 사진 촬영
  const takePhoto = async () => {
    try {
      setIsUploadingAvatar(true);
      if (user) {
        const result = await storageAPI.uploadProfileImage(user.id);
        if (result.success) {
          // 프로필 정보 새로고침
          const profile = await getUserProfile();
          setUserProfile(profile);
        }
      }
    } catch (error) {
      console.error("사진 촬영 실패:", error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 갤러리에서 이미지 선택
  const pickImage = async () => {
    try {
      setIsUploadingAvatar(true);
      if (user) {
        const result = await storageAPI.uploadProfileImage(user.id);
        if (result.success) {
          // 프로필 정보 새로고침
          const profile = await getUserProfile();
          setUserProfile(profile);
        }
      }
    } catch (error) {
      console.error("이미지 선택 실패:", error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 아바타 제거
  const removeAvatar = async () => {
    try {
      if (userProfile?.avatar_url) {
        const result = await storageAPI.deleteProfileImage(
          userProfile.avatar_url
        );
        if (result.success) {
          // 프로필 정보 새로고침
          const profile = await getUserProfile();
          setUserProfile(profile);
        }
      }
    } catch (error) {
      console.error("아바타 제거 실패:", error);
    }
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
        <Text style={styles.headerTitle}>개인정보</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileContainer}>
          {/* 프로필 사진 섹션 */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleChangeAvatar}
              disabled={isUploadingAvatar}
            >
              {userProfile?.avatar_url ? (
                <Image
                  source={{ uri: userProfile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {userProfile?.name
                      ? userProfile.name.charAt(0).toUpperCase()
                      : "U"}
                  </Text>
                </View>
              )}
              {isUploadingAvatar && (
                <View style={styles.uploadingOverlay}>
                  <Text style={styles.uploadingText}>업로드 중...</Text>
                </View>
              )}
              {/* 변경 아이콘 */}
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={12} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>프로필 사진</Text>
            <Text style={styles.avatarDescription}>탭하여 변경</Text>
          </View>

          {/* 개인정보 섹션 */}
          <View style={styles.infoSection}>
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
    paddingTop: 60,
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
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  profileContainer: {
    marginTop: 24,
  },
  // 프로필 사진 관련 스타일
  avatarSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarContainer: {
    position: "relative",
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  avatarDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // 개인정보 섹션
  infoSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
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
  arrowText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: "300",
  },
});
