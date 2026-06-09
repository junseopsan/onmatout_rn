import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import React, { Fragment, useCallback, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DatePickerModal from "../../components/DatePickerModal";
import SimpleRecordCard from "../../components/SimpleRecordCard";
import StoryShareModal from "../../components/StoryShareModal";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { useProfileStats } from "../../hooks/useDashboard";
import { useRoles } from "../../hooks/useRoles";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";

export default function ProfileScreen() {
  const { isAuthenticated, loading } = useAuth();
  const { user } = useAuthStore();
  const { roles, activeRole, setActiveRole } = useRoles();
  const queryClient = useQueryClient();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const otherRole: "teacher" | "student" | null =
    activeRole === "teacher" && roles.includes("student")
      ? "student"
      : activeRole === "student" && roles.includes("teacher")
        ? "teacher"
        : null;

  const handleSwitchRole = async () => {
    if (!otherRole) return;
    await setActiveRole(otherRole);
    navigation.reset({
      index: 0,
      routes: [
        { name: otherRole === "teacher" ? "TeacherTabNavigator" : "TabNavigator" },
      ],
    });
  };

  // authStore의 프로필 사용 (로컬 state 제거)

  // 보기 모드: 'all' = 전체 수련 기록(기본), 'month' = 해당 연월만
  const [viewMode, setViewMode] = useState<"all" | "month">("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [storyShareVisible, setStoryShareVisible] = useState(false);

  // 프로필 통계 + 전체 수련 기록 (allRecords로 통계, 리스트 모두 사용)
  const userId = user?.id;
  const { allRecords, isLoading, refetch } = useProfileStats(userId);

  // 날짜 기준 정렬 (최신순)
  const sortedAllRecords = [...(allRecords || [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  // 연월 필터 적용된 기록 (viewMode === 'month'일 때 사용)
  const filteredByMonth = (allRecords || []).filter((record) => {
    const recordDate = new Date(record.created_at);
    return (
      recordDate.getFullYear() === selectedYear &&
      recordDate.getMonth() + 1 === selectedMonth
    );
  });

  const recordsToList =
    viewMode === "all"
      ? sortedAllRecords
      : filteredByMonth.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

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

  // 스토리 공유 배경용: 수련한 아사나 image_number 수집 후 셔플
  const backgroundAsanaImageNumbers = useMemo(() => {
    const set = new Set<string>();
    (allRecords || []).forEach((r: any) => {
      const asanas = r.asanas || [];
      asanas.forEach((a: any) => {
        const num = a && typeof a === "object" && a.image_number;
        if (num) set.add(String(num).padStart(3, "0"));
      });
    });
    const arr = Array.from(set);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [allRecords]);

  // 기록 관련 핸들러 함수들
  const handleRecordPress = (record: any) => {
    navigation.navigate("RecordDetail", { record });
  };

  const handleDateSelect = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setViewMode("month");
  };

  const handleSelectAll = () => {
    setViewMode("all");
  };

  const handleDateTextPress = () => {
    setDatePickerVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?.id) {
        queryClient.invalidateQueries({ queryKey: ["profileStats"] });
        queryClient.invalidateQueries({ queryKey: ["allRecords"] });
        queryClient.invalidateQueries({ queryKey: ["todayRecords"] });
        queryClient.invalidateQueries({ queryKey: ["recentRecords"] });
        refetch();
      }
    }, [isAuthenticated, user?.id, refetch, queryClient]),
  );

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading || !isAuthenticated) {
    return (
      <View style={styles.container}>{/* 빈 화면 - 배경색만 표시 */}</View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 헤더 - 우측 액션만 */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <View style={styles.headerButtons}>
          {otherRole ? (
            <TouchableOpacity
              style={styles.roleChip}
              activeOpacity={0.85}
              onPress={handleSwitchRole}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Ionicons
                name={otherRole === "teacher" ? "school" : "person"}
                size={12}
                color={COLORS.primary}
              />
              <Text style={styles.roleChipText}>
                {otherRole === "teacher" ? "지도자" : "수련생"}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 인스타그램 스타일 프로필 카드 */}
        <View style={styles.igHero}>
          <TouchableOpacity
            onPress={() => navigation.navigate("ProfileInfo")}
            activeOpacity={0.85}
          >
            {userProfile?.avatar_url ? (
              <Image
                source={{ uri: userProfile.avatar_url }}
                style={styles.igAvatar}
              />
            ) : (
              <View style={[styles.igAvatar, styles.igAvatarPlaceholder]}>
                <Text style={styles.igAvatarText}>
                  {userProfile?.name
                    ? userProfile.name.charAt(0).toUpperCase()
                    : "U"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.igStats}>
            <View style={styles.igStatItem}>
              <Text style={styles.igStatNumber}>{allRecords?.length || 0}</Text>
              <Text style={styles.igStatLabel}>총 수련</Text>
            </View>
            <View style={styles.igStatItem}>
              <Text style={styles.igStatNumber}>{getThisWeekCount()}</Text>
              <Text style={styles.igStatLabel}>이번 주</Text>
            </View>
            <View style={styles.igStatItem}>
              <Text style={styles.igStatNumber}>{getThisMonthCount()}</Text>
              <Text style={styles.igStatLabel}>이번 달</Text>
            </View>
          </View>
        </View>

        {/* 소개 */}
        <View style={styles.igBioSection}>
          <Text style={styles.igDisplayName}>
            {userProfile?.name || "사용자"}
          </Text>
          {userProfile?.bio ? (
            <Text style={styles.igBio}>{userProfile.bio}</Text>
          ) : (
            <Text style={styles.igBioPlaceholder}>
              한 줄 소개를 적어보세요.
            </Text>
          )}
        </View>

        {/* 액션 행 */}
        <View style={styles.igActionsRow}>
          <TouchableOpacity
            style={styles.igActionBtn}
            onPress={() => navigation.navigate("ProfileInfo")}
            activeOpacity={0.85}
          >
            <Text style={styles.igActionText}>프로필 수정</Text>
          </TouchableOpacity>
        </View>

        {/* 수련 기록 리스트 섹션 */}
        <View style={styles.recordsSection}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity
              onPress={handleDateTextPress}
              style={styles.dateTitleContainer}
            >
              <Text style={styles.sectionTitle}>
                {viewMode === "all"
                  ? "전체 수련 기록"
                  : `${selectedYear}년 ${selectedMonth}월 수련 기록`}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStoryShareVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.shareIconBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name="share-social-outline"
                size={16}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.emptyRecordsContainer}>
              <Text style={styles.emptyRecordsText}>
                수련 기록을 불러오는 중...
              </Text>
            </View>
          ) : recordsToList.length === 0 ? (
            <View style={styles.emptyRecordsContainer}>
              <Text style={styles.emptyRecordsText}>
                {viewMode === "all"
                  ? "아직 수련 기록이 없습니다."
                  : `${selectedYear}년 ${selectedMonth}월에는 수련 기록이 없습니다.`}
              </Text>
            </View>
          ) : (
            <View style={styles.recordsList}>
              {recordsToList.map((record) => (
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

        {/* 하단 여백 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        currentYear={selectedYear}
        currentMonth={selectedMonth}
        onDateSelect={handleDateSelect}
        onSelectAll={handleSelectAll}
      />

      <StoryShareModal
        visible={storyShareVisible}
        onClose={() => setStoryShareVisible(false)}
        mode="stats"
        stats={{
          totalCount: allRecords?.length || 0,
          weekCount: getThisWeekCount(),
          monthCount: getThisMonthCount(),
          userName: userProfile?.name || undefined,
          backgroundAsanaImageNumbers,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  roleChipText: {
    ...TEXT.micro,
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: SPACING.lg,
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
  igHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  igAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  igAvatarPlaceholder: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  igAvatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  igStats: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  igStatItem: { alignItems: "center" },
  igStatNumber: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  igStatLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  igBioSection: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 4,
  },
  igDisplayName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  igBio: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
  },
  igBioPlaceholder: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontStyle: "italic",
  },
  igActionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  igActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  igActionText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
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
  storyShareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  storyShareButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  shareIconBtn: {
    padding: 4,
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
