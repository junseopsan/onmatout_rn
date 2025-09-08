import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import {
  FlatList,
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
import { useDashboardData } from "../../hooks/useDashboard";
import { Asana } from "../../lib/api/asanas";
import { RootStackParamList } from "../../navigation/types";
import { Record } from "../../types/record";

export default function DashboardScreen() {
  const { isAuthenticated, loading } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [showFavoriteModal, setShowFavoriteModal] = useState(false);

  // React Query로 대시보드 데이터 가져오기
  const {
    todayRecords,
    recentRecords,
    favoriteAsanas,
    isLoading: loadingData,
    isError,
    error,
    refetch,
  } = useDashboardData();

  // 화면이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log("대시보드: 화면 포커스 시 데이터 새로고침");
        refetch();
      }
    }, [isAuthenticated, refetch])
  );

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
    return (
      <View style={styles.container}>{/* 빈 화면 - 배경색만 표시 */}</View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}></View>

      {/* 에러 상태 */}
      {isError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error?.message || "데이터를 불러오는데 실패했습니다."}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        {/* 수련 통계 그래프 */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>수련 통계</Text>
          </View>
          <PracticeStatsChart records={recentRecords} isLoading={loadingData} />
        </View>

        {/* 즐겨찾기 아사나 */}
        <View style={styles.favoriteSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>좋아하는 아사나</Text>
            {favoriteAsanas.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowFavoriteModal(true)}
                style={styles.moreButton}
              >
                <Text style={styles.moreButtonText}>더 보기</Text>
              </TouchableOpacity>
            )}
          </View>
          {loadingData ? (
            <View style={styles.skeletonContainer}>
              <View style={styles.skeletonAsanas}>
                {[1, 2, 3].map((item) => (
                  <View key={item} style={styles.skeletonAsanaCard} />
                ))}
              </View>
            </View>
          ) : favoriteAsanas.length > 0 ? (
            <FlatList
              data={favoriteAsanas}
              renderItem={({ item }) => (
                <FavoriteAsanaCard asana={item} onPress={handleAsanaPress} />
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favoriteAsanaScroll}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                즐겨찾기한 아사나가 없습니다.
              </Text>
            </View>
          )}
        </View>
      </View>

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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statsSection: {
    flex: 1,
  },
  favoriteSection: {
    height: 300, // 고정 높이
  },
  // 스켈레톤 스타일
  skeletonContainer: {
    marginVertical: 8,
  },
  skeletonAsanas: {
    flexDirection: "row",
    gap: 12,
  },
  skeletonAsanaCard: {
    width: 140,
    height: 180,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    opacity: 0.6,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  moreButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },

  favoriteAsanaScroll: {
    paddingHorizontal: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
});
