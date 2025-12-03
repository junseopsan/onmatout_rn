import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { Fragment, useCallback, useState } from "react";
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
import { AlertDialog } from "../../components/ui/AlertDialog";
// SettingsModal 제거됨 - 페이지로 변경
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { useProfileStats } from "../../hooks/useDashboard";
import { useRecordData } from "../../hooks/useRecords";
import { supabase } from "../../lib/supabase";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";

export default function ProfileScreen() {
  const { isAuthenticated, loading } = useAuth();
  const { user } = useAuthStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // authStore의 프로필 사용 (로컬 state 제거)

  // 날짜 선택 상태
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // 프로필 통계 데이터 가져오기 (allRecords만)
  const testUserId = user?.id || "260d9314-3fa8-472f-8250-32ef3a9dc7fc";
  const { allRecords, refetch } = useProfileStats(testUserId);

  // 기록 데이터 가져오기
  const { recentRecords, refetch: refetchRecords } = useRecordData();

  // 선택한 년월에 따른 필터링된 기록
  const filteredRecords = recentRecords.filter((record) => {
    const recordDate = new Date(record.created_at);
    const recordYear = recordDate.getFullYear();
    const recordMonth = recordDate.getMonth() + 1;

    return recordYear === selectedYear && recordMonth === selectedMonth;
  });

  // 통계 계산 함수들
  const getThisWeekCount = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekCount = allRecords.filter((record) => {
      const recordDate = new Date(record.created_at);
      return recordDate >= startOfWeek;
    }).length;

    return weekCount;
  };

  const getThisMonthCount = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthCount = allRecords.filter((record) => {
      const recordDate = new Date(record.created_at);
      return recordDate >= startOfMonth;
    }).length;

    return monthCount;
  };

  // authStore에서 프로필 가져오기 (user.profile 사용)
  const userProfile = user?.profile;

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

  // 로그아웃 함수
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // authStore도 초기화
      useAuthStore.getState().clearUser();
      console.log("로그아웃 완료");

      // 로그인 화면으로 이동
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      });
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  // 로그아웃 확인 다이얼로그
  const showLogoutDialog = () => {
    AlertDialog.confirm(
      "로그아웃",
      "정말로 로그아웃하시겠습니까?",
      handleLogout,
      () => {}, // 취소 시 아무것도 하지 않음
      "로그아웃",
      "취소"
    );
  };

  // 화면이 포커스될 때마다 데이터 새로고침 (프로필 정보는 useEffect에서 이미 처리)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        refetch();
        refetchRecords();
      }
    }, [isAuthenticated, refetch, refetchRecords])
  );

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading || !isAuthenticated) {
    return (
      <View style={styles.container}>{/* 빈 화면 - 배경색만 표시 */}</View>
    );
  }

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
              <Text style={styles.statNumber}>{allRecords?.length || 0}</Text>
              <Text style={styles.statLabel}>총 수련 횟수</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{getThisWeekCount()}</Text>
              <Text style={styles.statLabel}>이번 주</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{getThisMonthCount()}</Text>
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
                <Fragment key={record.id}>
                  <SimpleRecordCard
                    record={record}
                    onPress={handleRecordPress}
                  />
                </Fragment>
              ))}
            </View>
          )}
        </View>

        {/* 로그아웃 버튼 */}
        {
          // <View style={styles.logoutSection}>
          //   <TouchableOpacity
          //     style={styles.logoutButton}
          //     onPress={showLogoutDialog}
          //     activeOpacity={0.7}
          //   >
          //     <Ionicons name="log-out-outline" size={20} color="white" />
          //     <Text style={styles.logoutButtonText}>로그아웃</Text>
          //   </TouchableOpacity>
          // </View>
        }

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
  logoutSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
