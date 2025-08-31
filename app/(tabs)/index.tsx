import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FavoriteAsanaCard from "../../components/dashboard/FavoriteAsanaCard";
import FavoriteAsanasModal from "../../components/dashboard/FavoriteAsanasModal";
import PracticeStatsChart from "../../components/dashboard/PracticeStatsChart";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { Asana, asanasAPI } from "../../lib/api/asanas";
import { recordsAPI } from "../../lib/api/records";
import { RootStackParamList } from "../../navigation/types";
import { Record } from "../../types/record";

export default function DashboardScreen() {
  const { isAuthenticated, loading } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [todayRecords, setTodayRecords] = useState<Record[]>([]);
  const [allRecords, setAllRecords] = useState<Record[]>([]);
  const [favoriteAsanas, setFavoriteAsanas] = useState<Asana[]>([]);
  const [allAsanas, setAllAsanas] = useState<Asana[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);

  // 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  // 화면이 포커스될 때마다 데이터 새로 로드
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadDashboardData();
      }
    }, [isAuthenticated])
  );

  const loadDashboardData = async () => {
    try {
      setLoadingData(true);

      // 병렬로 데이터 로드
      const [todayResult, allRecordsResult, favoriteResult, allAsanasResult] =
        await Promise.all([
          recordsAPI.getTodayRecords(),
          recordsAPI.getRecentRecords(),
          asanasAPI.getFavoriteAsanas(),
          asanasAPI.getAllAsanas(),
        ]);

      if (todayResult.success) {
        setTodayRecords(todayResult.data || []);
      }

      if (allRecordsResult.success) {
        setAllRecords(allRecordsResult.data || []);
      }

      if (favoriteResult.success && allAsanasResult.success) {
        const favoriteIds = favoriteResult.data || [];
        const allAsanasData = allAsanasResult.data || [];

        // 즐겨찾기 아사나 정보 가져오기
        const favoriteAsanasData = allAsanasData.filter((asana) =>
          favoriteIds.includes(asana.id)
        );

        setFavoriteAsanas(favoriteAsanasData);
        setAllAsanas(allAsanasData);
      }
    } catch (error) {
      console.error("대시보드 데이터 로드 에러:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleRecordPress = (record: Record) => {
    // 기록 상세 모달로 표시 (임시로 기록 탭으로 이동)
    navigation.navigate("Record");
  };

  const handleAsanaPress = (asana: Asana) => {
    // 아사나 상세 화면으로 이동
    navigation.navigate("AsanaDetail", { id: asana.id });
  };

  const handleNewRecord = () => {
    navigation.navigate("NewRecord");
  };

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}></View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loadingData ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
          </View>
        ) : (
          <>
            {/* 수련 통계 그래프 */}
            {allRecords.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>최근 수련 통계</Text>
                </View>
                <PracticeStatsChart records={allRecords} />
              </View>
            )}

            {/* 즐겨찾기 아사나 */}
            {favoriteAsanas.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>즐겨찾기 아사나</Text>
                  <TouchableOpacity onPress={() => setShowFavoriteModal(true)}>
                    <Text style={styles.viewAllButtonText}>모두 보기</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={favoriteAsanas}
                  renderItem={({ item }) => (
                    <FavoriteAsanaCard
                      asana={item}
                      onPress={handleAsanaPress}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.favoriteAsanaScroll}
                  ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* 즐겨찾기 아사나 모달 */}
      <FavoriteAsanasModal
        visible={showFavoriteModal}
        onClose={() => setShowFavoriteModal(false)}
        favoriteAsanas={favoriteAsanas}
        onAsanaPress={handleAsanaPress}
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: 24,
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
  addButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: "center",
  },
  newRecordButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newRecordButtonText: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
  favoriteAsanaRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  moreButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  moreButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  viewAllButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  favoriteAsanaScroll: {
    paddingHorizontal: 4,
  },
});
