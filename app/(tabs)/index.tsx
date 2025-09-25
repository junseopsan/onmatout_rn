import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { useDashboardData } from "../../hooks/useDashboard";

export default function DashboardScreen() {
  const { isAuthenticated, loading } = useAuth();

  // React Query로 대시보드 데이터 가져오기
  const {
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
        {/* 빈 화면 - 모든 기능이 프로필 탭으로 이동됨 */}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            모든 기능이 프로필 탭으로 이동되었습니다.
          </Text>
        </View>
      </View>
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
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
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
