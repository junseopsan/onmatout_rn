import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useCallback, useRef } from "react";
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FeedItem from "../../components/feed/FeedItem";
import { FeedItemSkeleton } from "../../components/ui/SkeletonLoader";
import { COLORS } from "../../constants/Colors";
import { useAsanas } from "../../hooks/useAsanas";
import { useAuth } from "../../hooks/useAuth";
import { useFeedRecords } from "../../hooks/useRecords";
import { useAuthStore } from "../../stores/authStore";

export default function DashboardScreen() {
  const { isAuthenticated, loading } = useAuth();
  const { user } = useAuthStore();

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
  } = useFeedRecords(10); // 페이지당 10개

  // 모든 페이지의 데이터를 평면화
  const feedRecords = feedData?.pages?.flatMap((page: any) => page.data) || [];

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

  // 아사나 데이터 가져오기
  const { data: asanasData } = useAsanas();
  const asanas = asanasData?.pages?.flatMap((page: any) => page.data) || [];

  // 스크롤 애니메이션을 위한 ref
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<"up" | "down">("up");
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  // 화면이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log("피드: 화면 포커스 시 데이터 새로고침");
        refetch();
      }
    }, [isAuthenticated, refetch])
  );

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(
    (event: any) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const scrollDifference = currentScrollY - lastScrollY.current;

      // 스크롤 방향 결정 (10px 이상 움직였을 때만)
      if (Math.abs(scrollDifference) > 10) {
        if (scrollDifference > 0 && currentScrollY > 50) {
          // 아래로 스크롤 - 헤더 숨기기
          if (scrollDirection.current !== "down") {
            scrollDirection.current = "down";
            Animated.parallel([
              Animated.timing(headerTranslateY, {
                toValue: -120, // 로고 영역 높이만큼 위로 이동
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(headerOpacity, {
                toValue: 0,
                duration: 300,
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
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(headerOpacity, {
                toValue: 1,
                duration: 300,
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
    // 기록 상세 보기 로직 (필요시 구현)
    console.log("기록 선택:", record);
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
        data={loadingData ? Array(5).fill(null) : feedRecords}
        renderItem={loadingData ? renderSkeletonItem : renderFeedItem}
        keyExtractor={(item, index) =>
          loadingData ? `skeleton-${index}` : item.id
        }
        ListEmptyComponent={!loadingData ? renderEmptyComponent : null}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
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
                <Text style={styles.loadingText}>
                  더 많은 기록을 불러오는 중...
                </Text>
              </View>
            );
          }
          return null;
        }}
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
    paddingTop: 100, // 로고 영역 높이만큼 상단 여백 (로고가 absolute이므로)
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
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
