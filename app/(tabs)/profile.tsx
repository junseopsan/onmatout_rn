import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DatePickerModal from "../../components/DatePickerModal";
import SimpleRecordCard from "../../components/SimpleRecordCard";
// SettingsModal 제거됨 - 페이지로 변경
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { useDashboardData } from "../../hooks/useDashboard";
import { useRecordData } from "../../hooks/useRecords";
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

  // 날짜 선택 상태
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // 대시보드 데이터 가져오기 (통계용)
  const { allRecords, isLoading: loadingData, refetch } = useDashboardData();

  // 기록 데이터 가져오기
  const { recentRecords, refetch: refetchRecords } = useRecordData();

  // 선택한 년월에 따른 필터링된 기록
  const filteredRecords = recentRecords.filter((record) => {
    const recordDate = new Date(record.created_at);
    const recordYear = recordDate.getFullYear();
    const recordMonth = recordDate.getMonth() + 1;

    return recordYear === selectedYear && recordMonth === selectedMonth;
  });

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

  // 통계 계산 함수들
  const getThisWeekCount = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return allRecords.filter((record) => {
      const recordDate = new Date(record.created_at);
      return recordDate >= startOfWeek;
    }).length;
  };

  const getThisMonthCount = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return allRecords.filter((record) => {
      const recordDate = new Date(record.created_at);
      return recordDate >= startOfMonth;
    }).length;
  };

  // 기록 관련 핸들러 함수들
  const handleRecordPress = (record: any) => {
    navigation.navigate("RecordDetail", { record });
  };

  // 날짜 선택 핸들러
  const handleDateSelect = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleDateTextPress = () => {
    setDatePickerVisible(true);
  };

  // 화면이 포커스될 때마다 데이터 새로고침 (프로필 정보는 useEffect에서 이미 처리)

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log("프로필: 화면 포커스 시 데이터 새로고침");
        refetch();
        refetchRecords();
      }
    }, [isAuthenticated, refetch, refetchRecords])
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
      {/* 헤더 - 닉네임, 프로필 사진과 설정 아이콘 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.userName}>
            {userProfile?.name || "사용자"} 님,
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("ProfileInfo")}
          >
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
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 수련 통계 섹션 */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>수련 통계</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {loadingData ? "..." : allRecords.length}
              </Text>
              <Text style={styles.statLabel}>총 수련 횟수</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {loadingData ? "..." : getThisWeekCount()}
              </Text>
              <Text style={styles.statLabel}>이번 주</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {loadingData ? "..." : getThisMonthCount()}
              </Text>
              <Text style={styles.statLabel}>이번 달</Text>
            </View>
          </View>
        </View>

        {/* 수련 기록 리스트 섹션 */}
        <View style={styles.recordsSection}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity
              onPress={handleDateTextPress}
              style={styles.dateTitleContainer}
            >
              <Text style={styles.sectionTitle}>
                {selectedYear}년 {selectedMonth}월 수련 기록
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {filteredRecords.length === 0 ? (
            <View style={styles.emptyRecordsContainer}>
              <Text style={styles.emptyRecordsText}>
                {selectedYear}년 {selectedMonth}월에는 수련 기록이 없습니다.
              </Text>
            </View>
          ) : (
            <View style={styles.recordsList}>
              {filteredRecords.map((record) => (
                <SimpleRecordCard
                  key={record.id}
                  record={record}
                  onPress={handleRecordPress}
                />
              ))}
            </View>
          )}
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 날짜 선택 모달 */}
      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        currentYear={selectedYear}
        currentMonth={selectedMonth}
        onDateSelect={handleDateSelect}
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
  headerLeft: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileButton: {
    padding: 4,
  },
  profileImage: {
    width: 28,
    height: 28,
    borderRadius: 18,
  },
  profileImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
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
    marginTop: 0,
    paddingHorizontal: 24,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
  },
  recordsSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  emptyRecordsContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyRecordsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  recordsList: {
    gap: 12,
  },
  bottomSpacer: {
    height: 40,
  },
});
