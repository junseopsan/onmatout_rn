import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  AppState,
  Easing,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FeedDetailModal from "../../components/feed/FeedDetailModal";
import FeedItem from "../../components/feed/FeedItem";
import { FeedItemSkeleton } from "../../components/ui/SkeletonLoader";
import { COLORS } from "../../constants/Colors";
import { useAllAsanasForFeed } from "../../hooks/useAsanas";
import { useAuth } from "../../hooks/useAuth";
import { useFeedRecords } from "../../hooks/useRecords";
import { useAuthStore } from "../../stores/authStore";
import { Record } from "../../types/record";

export default function DashboardScreen() {
  const { isAuthenticated, loading } = useAuth();
  const { user } = useAuthStore();
  const [selectedRecord, setSelectedRecord] = useState<
    (Record & { user_name?: string; user_avatar_url?: string }) | null
  >(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [feedMode, setFeedMode] = useState<"latest" | "explore">("latest");
  const [exploreOffset, setExploreOffset] = useState(0);
  const tabRefreshInProgress = useRef(false);

  // React Query로 피드 데이터 가져오기 (무한 스크롤)
  const {
    data: feedData,
    isLoading: loadingData,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useFeedRecords(10); // 페이지당 10개

  React.useEffect(() => {
    // API 호출 결과 로깅 (성공/실패)
    if (feedData) {
      const total =
        feedData.pages?.reduce(
          (acc: number, page: any) => acc + (page?.data?.length || 0),
          0
        ) || 0;
      console.log("[홈탭] feedRecords 로드 완료", {
        pages: feedData.pages?.length || 0,
        totalItems: total,
        hasNextPage,
      });
    }
    if (isError && error) {
      console.log("[홈탭] feedRecords 에러", error.message);
    }
  }, [feedData, hasNextPage, isError, error]);

  // 모든 페이지의 데이터를 평면화 (useMemo로 dependency warning 해소)
  const feedRecords = React.useMemo(
    () => feedData?.pages?.flatMap((page: any) => page.data) || [],
    [feedData]
  );

  // 표시용 피드 데이터 (탭 재클릭 시 탐색 모드 정렬)
  const displayRecords = React.useMemo(() => {
    if (!feedRecords || feedRecords.length === 0) return [];

    // 기본 모드는 최신순 (서버 정렬 그대로)
    if (feedMode === "latest") {
      return feedRecords;
    }

    // 탐색 모드: 신선도 + 소셜 신호 기반 점수로 정렬한 뒤, offset 만큼 회전
    const now = Date.now();
    const scored = feedRecords.map((item: any) => {
      const stats = item.stats || {};
      const likeCount = stats.likeCount ?? 0;
      const commentCount = stats.commentCount ?? 0;
      const shareCount = stats.shareCount ?? 0;

      const createdAt = new Date(
        item.created_at || item.practice_date || item.date
      );
      const ageHours = Math.max(
        0,
        (now - createdAt.getTime()) / (1000 * 60 * 60)
      );

      // 0시간 → 1, 72시간(3일) 이상 → 0 으로 선형 감소
      const freshScore = Math.max(0, 1 - ageHours / 72);

      // 좋아요/댓글/공유 가중합 후 log 스케일
      const socialRaw = likeCount + 2 * commentCount + 3 * shareCount;
      const socialScore = Math.log1p(socialRaw); // 0 ~

      const score = 0.6 * freshScore + 0.4 * socialScore;
      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const ordered = scored.map((s) => s.item);

    if (ordered.length === 0) return ordered;

    const len = ordered.length;
    const offset = ((exploreOffset % len) + len) % len;
    return [...ordered.slice(offset), ...ordered.slice(0, offset)];
  }, [feedRecords, feedMode, exploreOffset]);

  // 데이터 로딩 상태 로깅
  console.log("홈 탭 데이터 상태:", {
    isAuthenticated,
    loading,
    loadingData,
    isError,
    error: error?.message,
    feedDataLength: feedData?.pages?.length || 0,
    feedRecordsLength: feedRecords.length,
    user: user?.id,
  });

  // 아사나 데이터 가져오기 (피드용 - 전체 데이터)
  const { data: asanas = [] } = useAllAsanasForFeed();

  // 스크롤 애니메이션을 위한 ref
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<"up" | "down">("up");
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  // FlatList ref (스크롤 제어용)
  const flatListRef = useRef<FlatList>(null);

  // 탭 재클릭 처리 함수
  const handleTabRepeatedPress = useCallback(() => {
    // 최상단으로 스크롤 이동
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

    // 헤더 보이기
    scrollDirection.current = "up";
    Animated.parallel([
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 탐색 모드로 전환 + 오프셋 변경 (다른 조합을 위로 올리기)
    setFeedMode("explore");
    setExploreOffset((prev) => prev + 5);

    // 데이터 새로고침 (새로고침 아이콘 표시)
    if (!isAuthenticated) {
      return;
    }

    // 이미 새로고침 중이면 중복 실행 방지
    if (
      tabRefreshInProgress.current ||
      isRefetching ||
      isManualRefreshing ||
      isPullRefreshing
    ) {
      return;
    }

    console.log("피드: 탭 재클릭 - 최상단 이동 및 새로고침");
    tabRefreshInProgress.current = true;
    setIsManualRefreshing(true);

    refetch()
      .catch(() => {})
      .finally(() => {
        tabRefreshInProgress.current = false;
        setTimeout(() => {
          setIsManualRefreshing(false);
        }, 500);
      });
  }, [
    isAuthenticated,
    refetch,
    headerTranslateY,
    headerOpacity,
    isRefetching,
    isManualRefreshing,
    isPullRefreshing,
  ]);

  // Pull-to-refresh 핸들러
  const handleRefresh = useCallback(() => {
    if (isAuthenticated) {
      console.log("피드: Pull-to-refresh");
      // 아래로 끌어당겨 새로고침하면 다시 최신 모드로 전환
      setFeedMode("latest");
      setExploreOffset(0);
      setIsPullRefreshing(true);
      refetch()
        .catch((err) => {
          console.log("피드: Pull-to-refresh 중 오류:", err);
        })
        .finally(() => {
          // React Query 내부 상태와 상관없이 최대 1회 풀-리프레시 사이클만 유지
          setIsPullRefreshing(false);
        });
    }
  }, [isAuthenticated, refetch]);

  // 새로고침 상태 (pull-to-refresh 또는 탭 클릭)
  // React Query의 isRefetching에만 의존하지 않고, 로컬 상태로 안전하게 제어
  const isRefreshing = isPullRefreshing || isManualRefreshing;

  // refetch 종료 감지 시 로컬 새로고침 상태 정리 + 안전 타임아웃
  React.useEffect(() => {
    // isRefetching이 false로 내려오면 즉시 로컬 플래그 해제
    if (!isRefetching && (isPullRefreshing || isManualRefreshing)) {
      setIsPullRefreshing(false);
      setIsManualRefreshing(false);
      tabRefreshInProgress.current = false;
    }

    // 혹시 네트워크/포그라운드 이슈로 resolve가 지연될 때 10초 후 강제 해제
    if (isPullRefreshing || isManualRefreshing) {
      const timer = setTimeout(() => {
        setIsPullRefreshing(false);
        setIsManualRefreshing(false);
        tabRefreshInProgress.current = false;
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isRefetching, isPullRefreshing, isManualRefreshing]);

  const navigation = useNavigation();

  // 홈 탭 스크롤 함수를 저장할 ref
  const dashboardScrollToTopRef = useRef<(() => void) | null>(null);

  // 포그라운드 복귀 시 데이터 리프레시
  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        AppState.currentState.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("[홈탭] 포그라운드 복귀 - 데이터 리프레시");
        // 포그라운드 복귀 시 데이터 강제 리프레시
        if (
          isAuthenticated &&
          !isRefetching &&
          !isPullRefreshing &&
          !isManualRefreshing
        ) {
          refetch().catch((err) => {
            console.log("[홈탭] 포그라운드 복귀 리프레시 실패:", err);
          });
        }
      }
    });

    return () => subscription.remove();
  }, [
    isAuthenticated,
    isRefetching,
    isPullRefreshing,
    isManualRefreshing,
    refetch,
  ]);

  // TabNavigator에 스크롤 함수 등록
  React.useEffect(() => {
    // navigation의 getParent를 통해 TabNavigator에 함수 등록
    const parent = navigation.getParent();
    if (parent && (parent as any).setDashboardScrollToTop) {
      (parent as any).setDashboardScrollToTop(handleTabRepeatedPress);
    }
    // 또는 직접 ref에 저장
    dashboardScrollToTopRef.current = handleTabRepeatedPress;
  }, [navigation, handleTabRepeatedPress]);

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(
    (event: any) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const scrollDifference = currentScrollY - lastScrollY.current;

      // 스크롤 방향 결정 (조금 더 많이 스크롤했을 때만 헤더 전환)
      if (Math.abs(scrollDifference) > 15) {
        if (scrollDifference > 0 && currentScrollY > 80) {
          // 아래로 스크롤 - 헤더 숨기기
          if (scrollDirection.current !== "down") {
            scrollDirection.current = "down";
            Animated.parallel([
              Animated.timing(headerTranslateY, {
                toValue: -120, // 로고 영역 높이만큼 위로 이동
                duration: 500,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(headerOpacity, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
            ]).start();
          }
        } else if (scrollDifference < 0) {
          // 위로 스크롤 - 헤더 보이기
          if (scrollDirection.current !== "up") {
            scrollDirection.current = "up";
            Animated.parallel([
              Animated.timing(headerTranslateY, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(headerOpacity, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
            ]).start();
          }
        }
        lastScrollY.current = currentScrollY;
      }
    },
    [headerTranslateY, headerOpacity]
  );

  // 헤더 애니메이션 스타일
  const headerAnimatedStyle = {
    transform: [{ translateY: headerTranslateY }],
    opacity: headerOpacity,
  };

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading || !isAuthenticated) {
    return (
      <View style={styles.container}>{/* 빈 화면 - 배경색만 표시 */}</View>
    );
  }

  const handleRecordPress = (record: any) => {
    setSelectedRecord(record);
    setIsDetailModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalVisible(false);
    setSelectedRecord(null);
  };

  const renderFeedItem = ({ item }: { item: any }) => (
    <FeedItem record={item} asanas={asanas} onPress={handleRecordPress} />
  );

  const renderSkeletonItem = () => <FeedItemSkeleton />;

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        아직 수련 기록이 없어요.{"\n"}첫 번째 수련을 시작해보세요!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 상태바 영역까지 포함한 배경 레이어 */}
      <Animated.View
        style={[
          styles.logoBackgroundLayer,
          headerAnimatedStyle,
          { opacity: headerOpacity },
        ]}
      />

      {/* 로고 영역 */}
      <Animated.View
        style={[
          styles.logoWrapper,
          headerAnimatedStyle,
          { opacity: headerOpacity },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../../images/onthemat_rm_bg.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
      </Animated.View>

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
        ref={flatListRef}
        data={loadingData ? Array(5).fill(null) : displayRecords}
        renderItem={loadingData ? renderSkeletonItem : renderFeedItem}
        keyExtractor={(item, index) =>
          loadingData ? `skeleton-${index}` : item.id
        }
        ListEmptyComponent={!loadingData ? renderEmptyComponent : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
            // iOS에서만 progressViewOffset 사용
            // 헤더 높이(100) + Safe Area 고려하여 조정
            {...(Platform.OS === "ios" && { progressViewOffset: 65 })}
          />
        }
        {...(Platform.OS === "ios" && {
          contentInsetAdjustmentBehavior: "automatic",
        })}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage && !loadingData) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => {
          if (isFetchingNextPage) {
            return (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            );
          }
          return null;
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* 피드 상세 모달 */}
      <FeedDetailModal
        visible={isDetailModalVisible}
        record={
          selectedRecord
            ? {
                ...selectedRecord,
                user_name: selectedRecord.user_name || "익명",
              }
            : null
        }
        asanas={asanas}
        onClose={handleCloseDetailModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60, // 상태바 높이 + 여백 (요가원 탭과 동일하게 고정)
  },
  logoBackgroundLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100, // 로고 영역 높이 (상태바 60 + 로고 40)
    backgroundColor: COLORS.background,
    zIndex: 9,
  },
  logoWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60, // 상태바 높이 + 여백
    zIndex: 10,
  },
  logoContainer: {
    paddingLeft: 18,
    paddingBottom: 0,
  },
  logo: {
    width: 120,
    height: 40,
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
    paddingTop: 60, // 상단 여백을 더 줄여 로고와 첫 카드 간 기본 간격 축소
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
  loadingFooter: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
