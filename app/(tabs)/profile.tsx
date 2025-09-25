import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import SettingsModal from "../../components/profile/SettingsModal";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../stores/authStore";

export default function ProfileScreen() {
  const { isAuthenticated, loading } = useAuth();
  const { user, getUserProfile } = useAuthStore();

  // 설정 모달 상태
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // 사용자 프로필 가져오기
  useEffect(() => {
    console.log("=== 프로필 탭 useEffect 실행 ===");
    console.log("user:", user);
    console.log("loading:", loading);
    console.log("isAuthenticated:", isAuthenticated);
    console.log("loadingProfile:", loadingProfile);

    const loadUserProfile = async () => {
      if (user) {
        try {
          console.log("프로필 로드 시작...");
          const profile = await getUserProfile();
          console.log("프로필 로드 결과:", profile);
          setUserProfile(profile);
        } catch (error) {
          console.error("프로필 로드 에러:", error);
        } finally {
          console.log("프로필 로딩 완료");
          setLoadingProfile(false);
        }
      } else {
        console.log("사용자 없음 - 로딩 완료");
        // 사용자가 없으면 로딩 완료
        setLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [user, getUserProfile, loading, isAuthenticated, loadingProfile]);

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

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading || !isAuthenticated) {
    console.log("=== 빈 화면 표시 ===");
    console.log("loading:", loading);
    console.log("isAuthenticated:", isAuthenticated);
    return (
      <View style={styles.container}>{/* 빈 화면 - 배경색만 표시 */}</View>
    );
  }

  // 프로필 로딩 중일 때 스켈레톤 로딩 표시
  if (loadingProfile) {
    console.log("=== 스켈레톤 로딩 표시 ===");
    console.log("loadingProfile:", loadingProfile);
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonInfo}>
            <View style={styles.skeletonText} />
            <View style={[styles.skeletonText, { width: "60%" }]} />
          </View>
        </View>
      </View>
    );
  }

  console.log("=== 메인 프로필 화면 렌더링 ===");
  console.log("userProfile:", userProfile);

  return (
    <View style={styles.container}>
      {/* 헤더 - 설정 아이콘 */}
      <View style={styles.header}>
        <Text style={styles.title}>프로필</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettingsModal(true)}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* 간단한 프로필 정보 */}
      <View style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
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
          </View>

          <Text style={styles.nickname}>{userProfile?.name || "사용자"}</Text>
          <Text style={styles.phoneNumber}>
            {formatPhoneNumber(user?.phone || "")}
          </Text>
        </View>
      </View>

      {/* 설정 모달 */}
      <SettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
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
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 100, // 탭바 높이 + 여백
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 40,
    paddingVertical: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "white",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  nickname: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  statsSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  // 스켈레톤 스타일
  skeletonAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    opacity: 0.6,
  },
  skeletonInfo: {
    flex: 1,
    marginLeft: 16,
    gap: 8,
  },
  skeletonText: {
    height: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    opacity: 0.6,
  },
});
