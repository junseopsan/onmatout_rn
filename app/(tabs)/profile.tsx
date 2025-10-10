import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PracticeStatsChart from "../../components/dashboard/PracticeStatsChart";
// SettingsModal 제거됨 - 페이지로 변경
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { useDashboardData } from "../../hooks/useDashboard";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";

export default function ProfileScreen() {
  const { isAuthenticated, loading } = useAuth();
  const { user, getUserProfile } = useAuthStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 설정 모달 상태 제거
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // 대시보드 데이터 가져오기 (통계용)
  const { allRecords, isLoading: loadingData, refetch } = useDashboardData();

  // 사용자 프로필 가져오기
  useEffect(() => {
    console.log("=== 프로필 탭 useEffect 실행 ===");
    console.log("user:", user);
    console.log("loading:", loading);
    console.log("isAuthenticated:", isAuthenticated);

    const loadUserProfile = async () => {
      if (user) {
        try {
          console.log("프로필 로드 시작...");
          const profile = await getUserProfile();
          console.log("프로필 로드 결과:", profile);
          setUserProfile(profile);
        } catch (error) {
          console.error("프로필 로드 실패:", error);
        } finally {
          console.log("프로필 로딩 완료");
          setLoadingProfile(false);
        }
      } else {
        console.log("사용자 없음 - 로딩 완료");
        setLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [user, getUserProfile, isAuthenticated, loading]);

  // 화면이 포커스될 때마다 데이터 새로고침 (프로필 정보는 useEffect에서 이미 처리)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log("프로필: 화면 포커스 시 데이터 새로고침");
        refetch();
      }
    }, [isAuthenticated, refetch])
  );

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
        <Text style={styles.title}></Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* 프로필 헤더 */}
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <View style={styles.profileImageContainer}>
            {userProfile?.avatar_url ? (
              <Image
                source={{ uri: userProfile.avatar_url }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>
                  {userProfile?.name
                    ? userProfile.name.charAt(0).toUpperCase()
                    : "U"}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileGreeting}>
              {userProfile?.name || "사용자"}님! 나마스떼 🙏
            </Text>
          </View>
        </View>
      </View>

      {/* 간단한 프로필 정보 */}
      <View style={styles.content}>
        {/* 수련 통계 섹션 */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}></View>
          <PracticeStatsChart records={allRecords} isLoading={loadingData} />
        </View>
      </View>

      {/* 설정 모달 제거됨 - 페이지로 변경 */}
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
  profileHeader: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  profileTextContainer: {
    flex: 1,
  },
  profileGreeting: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 28,
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
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
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
