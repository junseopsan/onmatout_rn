import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { useAsanas, useAsanaSearch } from "../../hooks/useAsanas";
import { useAuth } from "../../hooks/useAuth";
import { useFavoriteAsanasDetail } from "../../hooks/useDashboard";
import { RootStackParamList } from "../../navigation/types";
import { AsanaCategory } from "../../types/asana";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = (screenWidth - 32 - 24) / 2; // 32 = 좌우 패딩, 24 = 카드 간 간격

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AsanasScreen() {
  const { isAuthenticated, loading } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<AsanaCategory[]>(
    []
  );
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

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

  const { data: favoriteAsanas = [] } = useFavoriteAsanasDetail();

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

    // 즐겨찾기 모드인 경우 즐겨찾기 아사나에서 시작
    if (showFavoritesOnly) {
      filtered = favoriteAsanas;
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
  }, [allAsanas, favoriteAsanas, selectedCategories, showFavoritesOnly]);

  // 화면이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log("아사나 탭: 화면 포커스 시 데이터 새로고침 및 필터 초기화");
        refetch();
        // 필터/검색/즐겨찾기 상태 초기화
        setSearchQuery("");
        setSelectedCategories([]);
        setShowFavoritesOnly(false);
      }
    }, [isAuthenticated, refetch])
  );

  const handleAsanaPress = (asana: any) => {
    navigation.navigate("AsanaDetail", { id: asana.id });
  };

  const handleFavoriteToggle = (asanaId: string, isFavorite: boolean) => {
    // 즐겨찾기 토글 로직은 API 호출로 처리
    // TODO: 즐겨찾기 API 호출 및 캐시 무효화
    console.log("즐겨찾기 토글:", asanaId, isFavorite);
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

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

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

  const renderAsanaCard = ({ item }: { item: any }) => {
    // 즐겨찾기 상태 확인 (로그인된 사용자만)
    const isFavorite = isAuthenticated
      ? favoriteAsanas.some((fav: any) => fav.id === item.id)
      : false;

    return (
      <View style={styles.cardContainer}>
        <AsanaCard
          asana={item}
          onPress={handleAsanaPress}
          isFavorite={isFavorite}
          onFavoriteToggle={isAuthenticated ? handleFavoriteToggle : undefined}
        />
      </View>
    );
  };

  const renderSkeletonItem = () => (
    <View style={styles.cardContainer}>
      <AsanaCardSkeleton />
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingMoreText}>
          더 많은 아사나를 불러오는 중...
        </Text>
      </View>
    );
  };

  // 로딩 중인 경우만 빈 화면 표시 (비회원도 아사나 탭 접근 가능)
  if (loading) {
    return (
      <View style={styles.container}>{/* 빈 화면 - 배경색만 표시 */}</View>
    );
  }

  return (
    <View style={styles.container}>
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
            isLoading ? `skeleton-${index}` : `${item.id}-${index}`
          }
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
          onEndReached={!isLoading ? handleLoadMore : undefined}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          ListFooterComponentStyle={styles.footer}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={8}
          getItemLayout={(data, index) => ({
            length: 200, // 카드 높이 + 마진
            offset: 200 * Math.floor(index / 2),
            index,
          })}
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
  header: {
    paddingTop: 60, // 상태바 높이 + 여백
    paddingHorizontal: 24,
    paddingBottom: 24,
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
    paddingBottom: 120, // 탭바 높이 + 여백 증가
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingMoreText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
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
    paddingVertical: 12,
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
