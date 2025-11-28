import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AsanaCard } from "../../components/AsanaCard";
import { AsanaCardSkeleton } from "../../components/ui/SkeletonLoader";
import { COLORS } from "../../constants/Colors";
import { CATEGORIES } from "../../constants/categories";
import {
  useAsanas,
  useAsanaSearch,
  useFavoriteAsanas,
} from "../../hooks/useAsanas";
import { useAuth } from "../../hooks/useAuth";
import { useFavoriteAsanasDetail } from "../../hooks/useDashboard";
import { RootStackParamList } from "../../navigation/types";
import { AsanaCategory } from "../../types/asana";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = (screenWidth - 32 - 24) / 2; // 32 = 좌우 패딩, 24 = 카드 간 간격

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AsanasScreen() {
  const { isAuthenticated, loading, user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<AsanaCategory[]>(
    []
  );
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // 상세 화면에서 돌아온 경우를 추적하기 위한 ref
  const isReturningFromDetail = useRef(false);
  const previousFocusedState = useRef(false);

  // 무한 스크롤 디바운싱을 위한 ref
  const loadingMoreRef = useRef(false);

  // 스크롤 애니메이션을 위한 ref
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<"up" | "down">("up");
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  // React Query hooks
  const {
    data: asanasData,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useAsanas(20);

  const { data: favoriteAsanas = [], refetch: refetchFavorites } =
    useFavoriteAsanasDetail();
  const { data: favoriteAsanaIds = [] } = useFavoriteAsanas();

  // 디버깅을 위한 로그 추가
  console.log("아사나 탭 상태:", {
    isAuthenticated,
    loading,
    isLoading,
    isError,
    asanasDataLength: asanasData?.pages?.length || 0,
    favoriteAsanasLength: favoriteAsanas.length,
  });

  const { data: searchResults = [], isLoading: isSearching } =
    useAsanaSearch(searchQuery);

  // 모든 아사나 데이터를 하나의 배열로 변환
  const allAsanas = useMemo(() => {
    if (!asanasData?.pages) return [];
    return asanasData.pages.flatMap((page: any) => page.data);
  }, [asanasData]);

  // 카테고리별 및 즐겨찾기 필터링된 아사나
  const filteredAsanas = useMemo(() => {
    let filtered;

    // 즐겨찾기 모드인 경우 즐겨찾기 ID 목록을 기준으로 필터링
    if (showFavoritesOnly) {
      // allAsanas에서 favoriteAsanaIds에 포함된 아사나만 필터링
      // 이렇게 하면 새로 추가된 즐겨찾기도 즉시 표시됨
      filtered = allAsanas.filter((asana) =>
        favoriteAsanaIds.includes(asana.id)
      );
    } else {
      filtered = allAsanas;
    }

    // 카테고리 필터링
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((asana) => {
        return selectedCategories.some(
          (category) => asana.category_name_en === category
        );
      });
    }

    return filtered;
  }, [
    allAsanas,
    favoriteAsanaIds,
    selectedCategories,
    showFavoritesOnly,
  ]);

  // 화면이 포커스될 때마다 데이터 새로고침 (상세 화면에서 돌아온 경우 제외)
  useFocusEffect(
    useCallback(() => {
      // 이전에 포커스되지 않았던 경우 (첫 마운트 또는 탭 직접 클릭)
      if (!previousFocusedState.current) {
        previousFocusedState.current = true;
        if (isAuthenticated) {
          console.log("아사나 탭: 초기 포커스 시 데이터 새로고침");
          refetch();
          refetchFavorites();
        }
        return;
      }

      // 상세 화면에서 돌아온 경우 새로고침하지 않음
      if (isReturningFromDetail.current) {
        console.log("아사나 탭: 상세 화면에서 돌아옴 - 새로고침 건너뜀");
        isReturningFromDetail.current = false;
        return;
      }

      // 탭을 직접 클릭한 경우 새로고침
      if (isAuthenticated) {
        console.log(
          "아사나 탭: 탭 직접 접근 시 데이터 새로고침 및 필터 초기화"
        );
        refetch();
        refetchFavorites(); // 즐겨찾기 목록도 새로고침
        // 필터/검색/즐겨찾기 상태 초기화
        setSearchQuery("");
        setSelectedCategories([]);
        setShowFavoritesOnly(false);
      }
    }, [isAuthenticated, refetch, refetchFavorites])
  );

  const handleAsanaPress = (asana: any) => {
    // 상세 화면으로 이동할 때 플래그 설정
    isReturningFromDetail.current = true;
    navigation.navigate("AsanaDetail", { id: asana.id });
  };

  const handleFavoriteToggle = (asanaId: string, isFavorite: boolean) => {
    // 즐겨찾기 상태가 변경되었으므로 관련 캐시 무효화
    console.log("즐겨찾기 토글:", asanaId, isFavorite);

    // 즐겨찾기 해제 시 ID 목록에서만 제거 (목록에는 남아있고 하트만 비어있는 상태로 표시)
    if (!isFavorite) {
      queryClient.setQueryData<string[]>(["favoriteAsanas"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter((id) => id !== asanaId);
      });
    } else {
      // 즐겨찾기 추가 시 ID 목록에 추가
      queryClient.setQueryData<string[]>(["favoriteAsanas"], (oldData) => {
        if (!oldData) return [asanaId];
        if (oldData.includes(asanaId)) return oldData;
        return [...oldData, asanaId];
      });
    }

    // 즐겨찾기 상세 목록은 무효화하지 않음 (목록에 남아있도록)
    // 즐겨찾기 모드가 활성화된 경우 아사나 목록도 새로고침하지 않음
  };

  // 즐겨찾기 필터 토글
  const handleFavoriteFilterToggle = () => {
    setShowFavoritesOnly(!showFavoritesOnly);
    // 즐겨찾기 모드로 전환 시 검색어 초기화
    if (!showFavoritesOnly) {
      setSearchQuery("");
    }
  };

  // 검색 함수
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 표시할 아사나 데이터 결정
  const getDisplayAsanas = () => {
    if (searchQuery.trim() !== "") {
      return searchResults;
    }
    return filteredAsanas;
  };

  const toggleCategory = (category: AsanaCategory) => {
    const currentCategories = selectedCategories;
    const isSelected = currentCategories.includes(category);
    if (isSelected) {
      setSelectedCategories(
        currentCategories.filter((c: any) => c !== category)
      );
    } else {
      setSelectedCategories([...currentCategories, category]);
    }
  };

  const handleLoadMore = useCallback(() => {
    // 디바운싱: 이미 로딩 중이면 건너뜀
    if (
      loadingMoreRef.current ||
      !hasNextPage ||
      isFetchingNextPage ||
      isLoading
    ) {
      return;
    }

    loadingMoreRef.current = true;
    fetchNextPage().finally(() => {
      // 약간의 딜레이 후 플래그 리셋 (너무 빠른 연속 호출 방지)
      setTimeout(() => {
        loadingMoreRef.current = false;
      }, 200);
    });
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

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
                toValue: -200, // 헤더 + 필터 높이만큼 위로 이동
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(headerOpacity, {
                toValue: 0,
                duration: 500,
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
                useNativeDriver: true,
              }),
              Animated.timing(headerOpacity, {
                toValue: 1,
                duration: 500,
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

  const renderCategoryButton = (category: AsanaCategory) => {
    const categoryInfo = CATEGORIES[category];
    const isSelected = selectedCategories.includes(category);
    const unifiedColor = "#EF4444"; // 후굴 색상으로 통일

    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryButton,
          {
            backgroundColor: COLORS.surface, // 항상 동일한 배경색
            borderColor: isSelected ? unifiedColor : "#666666", // 선택 시 빨간색, 미선택 시 회색
            borderWidth: isSelected ? 2 : 1, // 선택 시 더 굵은 테두리
            // 테두리 두께 변화로 인한 크기 변화 방지
            marginHorizontal: isSelected ? -0.5 : 0, // 선택 시 테두리가 1px 두꺼워지므로 마진으로 보정
          },
        ]}
        onPress={() => toggleCategory(category)}
        activeOpacity={0.8} // 터치 시 투명도 효과로 깜빡임 감소
        delayPressIn={0} // 즉시 반응
      >
        <Text
          style={[
            styles.categoryText,
            { color: COLORS.text }, // 항상 동일한 텍스트 색상
          ]}
        >
          {categoryInfo.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAsanaCard = useCallback(
    ({ item }: { item: any }) => {
      // 즐겨찾기 상태 확인 (로그인된 사용자만)
      // ID 목록을 우선 확인 (즉시 반영되도록)
      const isFavorite = isAuthenticated
        ? favoriteAsanaIds.includes(item.id)
        : false;

      return (
        <View style={styles.cardContainer}>
          <AsanaCard
            asana={item}
            onPress={handleAsanaPress}
            isFavorite={isFavorite}
            onFavoriteToggle={
              isAuthenticated ? handleFavoriteToggle : undefined
            }
            userId={user?.id}
          />
        </View>
      );
    },
    [isAuthenticated, favoriteAsanaIds, handleAsanaPress, handleFavoriteToggle, user?.id]
  );

  const renderSkeletonItem = () => (
    <View style={styles.cardContainer}>
      <AsanaCardSkeleton />
    </View>
  );

  const renderFooter = () => {
    // 더 이상 로드할 데이터가 없고, 현재 데이터가 있는 경우
    if (!hasNextPage && allAsanas.length > 0) {
      return null; // 인스타그램처럼 끝에 아무것도 표시하지 않음
    }

    // 다음 페이지를 로드 중인 경우 - 작은 인디케이터만 표시
    if (isFetchingNextPage) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    }

    return null;
  };

  // 로딩 중인 경우만 빈 화면 표시 (비회원도 아사나 탭 접근 가능)
  if (loading) {
    return (
      <View style={styles.container}>{/* 빈 화면 - 배경색만 표시 */}</View>
    );
  }

  // 헤더 애니메이션 스타일
  const headerAnimatedStyle = {
    transform: [{ translateY: headerTranslateY }],
    opacity: headerOpacity,
  };

  return (
    <View style={styles.container}>
      {/* 상태바 영역까지 포함한 배경 레이어 */}
      <Animated.View
        style={[
          styles.headerBackgroundLayer,
          headerAnimatedStyle,
          { opacity: headerOpacity },
        ]}
      />

      {/* 헤더와 필터를 하나로 묶어서 배경 처리 */}
      <Animated.View
        style={[
          styles.headerWrapper,
          headerAnimatedStyle,
          { opacity: headerOpacity },
        ]}
      >
        <View style={styles.header}>
          {/* 검색창과 즐겨찾기 버튼 */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={
                  showFavoritesOnly
                    ? "즐겨찾기 아사나 검색..."
                    : "아사나 이름으로 검색..."
                }
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
                clearButtonMode="while-editing"
              />
            </View>
            {isAuthenticated && (
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={handleFavoriteFilterToggle}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showFavoritesOnly ? "heart" : "heart-outline"}
                  size={24}
                  color={
                    showFavoritesOnly ? COLORS.primary : COLORS.textSecondary
                  }
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 카테고리 필터 */}
        <View style={styles.categoryContainer}>
          <FlatList
            data={
              [
                "Basic",
                "SideBend",
                "BackBend",
                "ForwardBend",
                "Twist",
                "Inversion",
                "Standing",
                "Armbalance",
                "Core",
                "Rest",
              ] as AsanaCategory[]
            }
            renderItem={({ item }) => renderCategoryButton(item)}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollView}
          />
        </View>
      </Animated.View>

      {/* 에러 상태 */}
      {isError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error?.message || "아사나 데이터를 불러오는데 실패했습니다."}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 아사나 카드 리스트 */}
      {isLoading && allAsanas.length === 0 ? (
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <View key={item} style={styles.skeletonCard} />
            ))}
          </View>
        </View>
      ) : allAsanas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {showFavoritesOnly
              ? "즐겨찾기한 아사나가 없습니다."
              : selectedCategories.length > 0
              ? "선택한 카테고리의 아사나가 없습니다."
              : "아사나 데이터가 없습니다."}
          </Text>
          {!showFavoritesOnly && (
            <TouchableOpacity
              onPress={() => refetch()}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>새로고침</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : searchQuery.trim() !== "" &&
        searchResults.length === 0 &&
        !isSearching ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            &quot;{searchQuery}&quot;에 대한 검색 결과가 없습니다.
          </Text>
          <Text style={styles.emptySubText}>다른 검색어를 시도해보세요.</Text>
        </View>
      ) : getDisplayAsanas().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {showFavoritesOnly
              ? "즐겨찾기한 아사나가 없습니다."
              : selectedCategories.length > 0
              ? "선택한 카테고리의 아사나가 없습니다."
              : "아사나 데이터가 없습니다."}
          </Text>
          {!showFavoritesOnly && selectedCategories.length > 0 && (
            <TouchableOpacity
              onPress={() => setSelectedCategories([])}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>필터 초기화</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={isLoading ? Array(6).fill(null) : getDisplayAsanas()}
          renderItem={isLoading ? renderSkeletonItem : renderAsanaCard}
          keyExtractor={(item, index) =>
            isLoading ? `skeleton-${index}` : item.id
          }
          extraData={[isLoading, isFetchingNextPage, getDisplayAsanas().length]}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReached={!isLoading ? handleLoadMore : undefined}
          onEndReachedThreshold={0.6}
          ListFooterComponent={renderFooter}
          ListFooterComponentStyle={styles.footer}
          removeClippedSubviews={false}
          maxToRenderPerBatch={12}
          windowSize={5}
          initialNumToRender={12}
          updateCellsBatchingPeriod={50}
          // getItemLayout 제거: numColumns={2}와 함께 사용할 때 정확한 높이 계산이 어려워
          // 동적 높이 계산으로 전환하여 빈 공백 문제 해결
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBackgroundLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 170, // 헤더 + 필터 전체 높이
    backgroundColor: COLORS.background,
    zIndex: 9,
  },
  headerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60, // 상태바 높이 + 여백
    zIndex: 10,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  listContainer: {
    paddingHorizontal: 16, // 좌우 여백 추가
    paddingTop: 200, // 헤더 + 필터 높이만큼 상단 여백 (헤더가 absolute이므로)
    paddingBottom: 200, // 탭바 높이 + 여백 증가 (마지막 카드가 잘리지 않도록 충분한 여백)
  },
  row: {
    justifyContent: "space-between",
  },
  cardContainer: {
    width: cardWidth,
    marginBottom: 16, // 카드 간 세로 간격
  },
  separator: {
    height: 16,
  },
  footer: {
    paddingVertical: 20,
  },
  // 스켈레톤 스타일
  skeletonContainer: {
    paddingHorizontal: 16,
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  skeletonCard: {
    width: cardWidth,
    height: 200,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 16,
    opacity: 0.6,
  },
  loadingMoreContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingBottom: 24,
  },
  endOfListContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  endOfListText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    opacity: 0.7,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 8,
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
  categoryContainer: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
    zIndex: 10,
  },
  categoryScrollView: {
    flexDirection: "row",
    gap: 8,
  },
  categoryButton: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    minHeight: 36, // 고정 높이 설정
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.surfaceDark,
  },
});
