import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
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
import { COLORS } from "../../constants/Colors";
import { CATEGORIES } from "../../constants/categories";
import { useAuth } from "../../hooks/useAuth";
import { asanasAPI } from "../../lib/api/asanas";
import { RootStackParamList } from "../../navigation/types";
import { useAsanaStore } from "../../stores/asanaStore";
import { AsanaCategory } from "../../types/asana";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = (screenWidth - 32 - 24) / 2; // 32 = 좌우 패딩, 24 = 카드 간 간격

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AsanasScreen() {
  const { isAuthenticated, loading } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [favoriteAsanas, setFavoriteAsanas] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // 스토어에서 상태 가져오기
  const {
    asanas,
    filteredAsanas,
    isLoading,
    isLoadingMore,
    hasMore,
    selectedCategories,
    error,
    setSelectedCategories,
    loadAsanas,
    loadMoreAsanas,
    clearError,
  } = useAsanaStore();

  // 아사나 데이터 로드 (초기 로드)
  useEffect(() => {
    if (isAuthenticated) {
      loadAsanas(true); // 초기 로드
    }
  }, [isAuthenticated, loadAsanas]);

  // 즐겨찾기 목록 로드
  const loadFavoriteAsanas = async () => {
    if (isAuthenticated) {
      try {
        const result = await asanasAPI.getFavoriteAsanas();
        if (result.success) {
          setFavoriteAsanas(result.data || []);
        }
      } catch (error) {
        console.error("즐겨찾기 목록 로드 에러:", error);
      }
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      const { asanas } = useAsanaStore.getState();

      // 기존 데이터가 없으면 로드
      if (asanas.length === 0) {
        console.log(`아사나 탭: 초기 데이터 로드 시작`);
        loadAsanas(true);
      }

      // 즐겨찾기 목록 로드
      loadFavoriteAsanas();
    }
  }, [isAuthenticated, loadAsanas]);

  // 화면이 포커스될 때마다 랜덤 셔플 적용
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        const { asanas, selectedCategories } = useAsanaStore.getState();

        if (asanas.length > 0) {
          console.log(`아사나 탭: 화면 포커스 시 랜덤 셔플 적용`);

          // 현재 선택된 카테고리를 다시 설정하여 랜덤 셔플 트리거
          setSelectedCategories(selectedCategories);
        }
      }
    }, [isAuthenticated])
  );

  const handleAsanaPress = (asana: any) => {
    // React Navigation을 사용하여 상세 화면으로 이동
    navigation.navigate("AsanaDetail", { id: asana.id });
  };

  const handleFavoriteToggle = (asanaId: string, isFavorite: boolean) => {
    setFavoriteAsanas((prev) => {
      if (isFavorite) {
        return [...prev, asanaId];
      } else {
        return prev.filter((id) => id !== asanaId);
      }
    });
  };

  // 검색 함수
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    console.log("검색어:", query);
    console.log("검색어 분리:", query.toLowerCase().trim().split(/\s+/));

    // 검색할 때 전체 데이터를 다시 로드
    try {
      await loadAsanas(true);
      const { asanas } = useAsanaStore.getState();
      console.log("검색 후 전체 아사나 수:", asanas.length);

      const filtered = asanas.filter((asana) => {
        const searchTerms = query.toLowerCase().trim().split(/\s+/);
        const krName = asana.sanskrit_name_kr.toLowerCase().trim();
        const enName = asana.sanskrit_name_en.toLowerCase().trim();

        // 모든 검색어가 한국어 이름 또는 영어 이름에 포함되어야 함
        const krMatch = searchTerms.every((term) => {
          const match = krName.includes(term);
          if (asana.sanskrit_name_kr.includes("나타라자")) {
            console.log(`나타라자 검색어 "${term}" 매칭:`, match);
          }
          return match;
        });
        const enMatch = searchTerms.every((term) => {
          const match = enName.includes(term);
          if (asana.sanskrit_name_kr.includes("나타라자")) {
            console.log(`나타라자 영어 검색어 "${term}" 매칭:`, match);
          }
          return match;
        });

        // 디버깅: 나타라자 아사나 데이터 확인
        if (asana.sanskrit_name_kr.includes("나타라자")) {
          console.log("나타라자 아사나 데이터:", {
            sanskrit_name_kr: asana.sanskrit_name_kr,
            sanskrit_name_en: asana.sanskrit_name_en,
            searchTerms,
            krMatch,
            enMatch,
          });
        }

        return krMatch || enMatch;
      });

      console.log("검색 결과 수:", filtered.length);
      setSearchResults(filtered);
    } catch (error) {
      console.error("검색 중 오류:", error);
      setSearchResults([]);
    }
  };

  // 검색 결과 또는 필터링된 결과 반환
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
      setSelectedCategories(currentCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...currentCategories, category]);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadMoreAsanas(); // 추가 로드
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

  const renderAsanaCard = ({ item }: { item: any }) => (
    <View style={styles.cardContainer}>
      <AsanaCard
        asana={item}
        onPress={handleAsanaPress}
        isFavorite={favoriteAsanas.includes(item.id)}
        onFavoriteToggle={handleFavoriteToggle}
      />
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingMoreText}>
          더 많은 아사나를 불러오는 중...
        </Text>
      </View>
    );
  };

  // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  // 인증되지 않은 경우 로그인 안내 화면 표시
  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>로그인이 필요합니다.</Text>
        <Text style={styles.emptySubText}>앱을 다시 시작해주세요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* <Text style={styles.title}>아사나</Text>
        <Text style={styles.subtitle}>요가 자세를 탐색해보세요</Text> */}

        {/* 검색창 */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="아사나 이름으로 검색..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            clearButtonMode="while-editing"
          />
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
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* 아사나 카드 리스트 */}
      {isLoading && filteredAsanas.length === 0 ? (
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <View key={item} style={styles.skeletonCard} />
            ))}
          </View>
        </View>
      ) : asanas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {selectedCategories.length > 0
              ? "선택한 카테고리의 아사나가 없습니다."
              : "아사나 데이터가 없습니다."}
          </Text>
        </View>
      ) : searchQuery.trim() !== "" && searchResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            &quot;{searchQuery}&quot;에 대한 검색 결과가 없습니다.
          </Text>
          <Text style={styles.emptySubText}>다른 검색어를 시도해보세요.</Text>
        </View>
      ) : (
        <FlatList
          data={getDisplayAsanas()}
          renderItem={renderAsanaCard}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
          onEndReached={handleLoadMore}
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
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
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 8,
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
    marginTop: 16,
    marginBottom: 8,
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
