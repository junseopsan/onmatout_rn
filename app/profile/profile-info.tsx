import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
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
import { userAPI } from "../../lib/api/user";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";

export default function ProfileInfoScreen() {
  const { user } = useAuth();
  const { setUser } = useAuthStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // authStore의 프로필 사용 (로컬 state 제거)
  const userProfile = user?.profile;

  // 휴대폰 번호 포맷터 (숫자만 보관되어 있을 가능성이 높으므로 가독성 있게 변환)
  const formatPhoneNumber = (raw?: string | null): string | null => {
    if (!raw) return null;
    const digits = raw.replace(/[^\d]/g, "");
    if (!digits) return null;

    // 국제형식(82...) → 국내 0으로 시작하도록 변환
    let local = digits;
    if (digits.startsWith("82") && digits.length >= 11) {
      local = "0" + digits.slice(2);
    }

    // 010-0000-0000 형태로 포맷
    if (local.length === 11) {
      return `${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
    }

    // 그 외 길이는 그대로 반환
    return local;
  };

  const formattedPhone = formatPhoneNumber(userProfile?.phone);

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
      if (!user) {
        Alert.alert("오류", "사용자 정보가 없습니다.");
        return;
      }

      const result = await storageAPI.uploadProfileImage(user.id);
      if (result.success && result.url) {
        // 업로드된 이미지 URL을 프로필에 저장
        const updateResult = await userAPI.upsertUserProfile(user.id, {
          avatar_url: result.url,
        });

        if (updateResult.success && updateResult.data) {
          // authStore의 프로필 업데이트
          if (user) {
            const updatedUser = {
              ...user,
              profile: updateResult.data,
            };
            setUser(updatedUser);
          }
          Alert.alert("완료", "프로필 사진이 변경되었습니다.");
        } else {
          Alert.alert(
            "오류",
            updateResult.message || "프로필 사진 저장에 실패했습니다."
          );
        }
      } else {
        Alert.alert("오류", result.message || "이미지 업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("사진 촬영 실패:", error);
      Alert.alert("오류", "사진 촬영 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 갤러리에서 이미지 선택
  const pickImage = async () => {
    try {
      setIsUploadingAvatar(true);
      if (!user) {
        Alert.alert("오류", "사용자 정보가 없습니다.");
        return;
      }

      const result = await storageAPI.uploadProfileImage(user.id);
      if (result.success && result.url) {
        // 업로드된 이미지 URL을 프로필에 저장
        const updateResult = await userAPI.upsertUserProfile(user.id, {
          avatar_url: result.url,
        });

        if (updateResult.success && updateResult.data) {
          // authStore의 프로필 업데이트
          if (user) {
            const updatedUser = {
              ...user,
              profile: updateResult.data,
            };
            setUser(updatedUser);
          }
          Alert.alert("완료", "프로필 사진이 변경되었습니다.");
        } else {
          Alert.alert(
            "오류",
            updateResult.message || "프로필 사진 저장에 실패했습니다."
          );
        }
      } else {
        Alert.alert("오류", result.message || "이미지 업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("이미지 선택 실패:", error);
      Alert.alert("오류", "이미지 선택 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 아바타 제거
  const removeAvatar = async () => {
    try {
      if (!user) {
        console.error("사용자 정보가 없습니다.");
        return;
      }

      setIsUploadingAvatar(true);

      // 기존 이미지가 있으면 스토리지에서 삭제
      if (userProfile?.avatar_url) {
        await storageAPI.deleteProfileImage(userProfile.avatar_url);
      }

      // 프로필의 avatar_url을 null로 업데이트
      const result = await userAPI.upsertUserProfile(user.id, {
        avatar_url: null,
      });

      if (result.success && result.data) {
        // authStore의 프로필 업데이트
        if (user) {
          const updatedUser = {
            ...user,
            profile: result.data,
          };
          setUser(updatedUser);
        }
        Alert.alert("완료", "프로필 이미지가 기본 이미지로 변경되었습니다.");
      } else {
        Alert.alert(
          "오류",
          result.message || "프로필 이미지 변경에 실패했습니다."
        );
      }
    } catch (error) {
      console.error("아바타 제거 실패:", error);
      Alert.alert("오류", "프로필 이미지 변경 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingAvatar(false);
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
              <Text style={styles.infoLabel}>휴대폰 번호</Text>
              <Text style={styles.infoValue}>
                {formattedPhone || "전화번호 없음"}
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
