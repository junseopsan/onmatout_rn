import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AsanaCard } from "../../components/AsanaCard";
import { COLORS } from "../../constants/Colors";
import { CATEGORIES } from "../../constants/categories";
import { useAuth } from "../../hooks/useAuth";
import { Asana, asanasAPI } from "../../lib/api/asanas";
import { RootStackParamList } from "../../navigation/types";
import { AsanaCategory } from "../../types/asana";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = (screenWidth - 32 - 24) / 2; // 32 = 좌우 패딩, 24 = 카드 간 간격

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AsanasScreen() {
  const { isAuthenticated, loading } = useAuth();
  const [asanas, setAsanas] = useState<Asana[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<AsanaCategory[]>(
    []
  );
  const [loadingAsanas, setLoadingAsanas] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();

  // 아사나 데이터 로드 (초기 로드)
  useEffect(() => {
    if (isAuthenticated) {
      loadAsanas(true); // 초기 로드
    }
  }, [isAuthenticated]);

  // 카테고리 변경 시 데이터 리셋
  useEffect(() => {
    if (isAuthenticated) {
      loadAsanas(true); // 카테고리 변경 시 초기화
    }
  }, [selectedCategories]);

  const loadAsanas = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoadingAsanas(true);
        setCurrentPage(1);
        setAsanas([]);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      const page = reset ? 1 : currentPage + 1;
      const categories =
        selectedCategories.length > 0 ? selectedCategories : undefined;

      const result = await asanasAPI.getAsanasWithPagination(
        page,
        20,
        categories
      );

      if (result.success && result.data) {
        if (reset) {
          setAsanas(result.data);
        } else {
          setAsanas((prev) => [...prev, ...result.data!]);
        }

        setCurrentPage(page);
        setHasMore(result.hasMore || false);

        console.log(
          `아사나 데이터 로드 완료: 페이지 ${page}, ${result.data.length}개, 더 있음: ${result.hasMore}`
        );
      } else {
        setError(result.message || "아사나 데이터를 불러오는데 실패했습니다.");
        console.error("아사나 데이터 로드 실패:", result.message);
      }
    } catch (error) {
      setError("아사나 데이터를 불러오는 중 오류가 발생했습니다.");
      console.error("아사나 데이터 로드 예외:", error);
    } finally {
      setLoadingAsanas(false);
      setLoadingMore(false);
    }
  };

  const handleAsanaPress = (asana: Asana) => {
    // React Navigation을 사용하여 상세 화면으로 이동
    navigation.navigate("AsanaDetail", { id: asana.id });
  };

  const toggleCategory = (category: AsanaCategory) => {
    setSelectedCategories((prev) => {
      const isSelected = prev.includes(category);
      let newCategories: AsanaCategory[];

      if (isSelected) {
        // 선택 해제
        newCategories = prev.filter((c) => c !== category);
      } else {
        // 선택 추가
        newCategories = [...prev, category];
      }

      return newCategories;
    });
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadAsanas(false); // 추가 로드
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
        activeOpacity={0.7} // 터치 시 투명도 효과로 깜빡임 감소
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

  const renderAsanaCard = ({ item }: { item: Asana }) => (
    <View style={styles.cardContainer}>
      <AsanaCard asana={item} onPress={handleAsanaPress} />
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingMoreText}>
          더 많은 아사나를 불러오는 중...
        </Text>
      </View>
    );
  };

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>아사나</Text>
      </View>

      {loadingAsanas ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>아사나 데이터를 불러오는 중...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : asanas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {selectedCategories.length > 0
              ? "선택한 카테고리의 아사나가 없습니다."
              : "아사나 데이터가 없습니다."}
          </Text>
        </View>
      ) : (
        <>
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

          {/* 아사나 카드 리스트 */}
          <FlatList
            data={asanas}
            renderItem={renderAsanaCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={true}
            showsHorizontalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderFooter}
            ListFooterComponentStyle={styles.footer}
          />
        </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
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
});
