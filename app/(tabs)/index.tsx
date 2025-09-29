import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FeedItem from "../../components/feed/FeedItem";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { useFeedRecords } from "../../hooks/useRecords";

export default function DashboardScreen() {
  const { isAuthenticated, loading } = useAuth();

  // React Query로 피드 데이터 가져오기
  const {
    data: feedRecords = [],
    isLoading: loadingData,
    isError,
    error,
    refetch,
  } = useFeedRecords();

  // 화면이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log("피드: 화면 포커스 시 데이터 새로고침");
        refetch();
      }
    }, [isAuthenticated, refetch])
  );

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading || !isAuthenticated) {
    return (
      <View style={styles.container}>{/* 빈 화면 - 배경색만 표시 */}</View>
    );
  }

  const handleRecordPress = (record: any) => {
    // 기록 상세 보기 로직 (필요시 구현)
    console.log("기록 선택:", record);
  };

  const renderFeedItem = ({ item }: { item: any }) => (
    <FeedItem record={item} onPress={handleRecordPress} />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        아직 수련 기록이 없어요.{"\n"}첫 번째 수련을 시작해보세요!
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>수련 피드</Text>
      <Text style={styles.subtitle}>
        다른 요가인들의 수련 기록을 확인해보세요
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      {/* 에러 상태 */}
      {isError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error?.message || "피드를 불러오는데 실패했습니다."}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 피드 리스트 */}
      <FlatList
        data={feedRecords}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={loadingData}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
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
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
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
