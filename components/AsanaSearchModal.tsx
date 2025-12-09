import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/Colors";
import { CATEGORIES } from "../constants/categories";
import { Asana, asanasAPI } from "../lib/api/asanas";
import { AsanaCategory } from "../types/asana";
import { AsanaCard } from "./AsanaCard";
import { TamaguiInputComponent } from "./ui/TamaguiInput";

interface AsanaSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (asanas: Asana[]) => void;
  selectedAsanas: Asana[];
}

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = (screenWidth - 80) / 2; // 더 작은 카드 너비로 왼쪽 정렬 강화

export default function AsanaSearchModal({
  visible,
  onClose,
  onSelect,
  selectedAsanas,
}: AsanaSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Asana[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<AsanaCategory[]>(
    []
  );
  const [tempSelectedAsanas, setTempSelectedAsanas] = useState<Asana[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // 검색 실행
  const searchAsanas = async (
    query: string,
    categories: AsanaCategory[],
    page: number = 1,
    append: boolean = false
  ) => {
    if (!query.trim() && categories.length === 0) {
      // 검색어와 카테고리가 모두 없으면 모든 아사나 로드
      loadAllAsanas(page, append);
      return;
    }

    try {
      if (page === 1) {
        setSearching(true);
      } else {
        setLoadingMore(true);
      }

      let result;

      if (query.trim()) {
        // 검색어가 있는 경우
        result = await asanasAPI.searchAsanas(query);
      } else {
        // 카테고리만 선택된 경우
        result = await asanasAPI.getAsanasWithPagination(page, 20, categories);
      }

      if (result.success && result.data) {
        // 이미 선택된 아사나는 제외
        const filteredResults = result.data.filter(
          (asana) =>
            !selectedAsanas.find((selected) => selected.id === asana.id)
        );

        if (append) {
          setSearchResults((prev) => {
            const combined = [...prev, ...filteredResults];
            return removeDuplicates(combined);
          });
        } else {
          setSearchResults(removeDuplicates(filteredResults));
        }

        // 더 로드할 데이터가 있는지 확인
        setHasMore(filteredResults.length === 20);
      } else {
        if (!append) {
          setSearchResults([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      if (!append) {
        setSearchResults([]);
      }
      setHasMore(false);
    } finally {
      setSearching(false);
      setLoadingMore(false);
    }
  };

  // 모달이 열릴 때 모든 아사나 로드
  useEffect(() => {
    if (visible) {
      setCurrentPage(1);
      setHasMore(true);
      loadAllAsanas(1, false);
    }
  }, [visible]);

  // 검색어 변경 시 검색 실행
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    const timeoutId = setTimeout(() => {
      searchAsanas(searchQuery, selectedCategories, 1, false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategories]);

  // 모든 아사나 로드
  const loadAllAsanas = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setSearching(true);
      } else {
        setLoadingMore(true);
      }

      // 초기 로딩 시에는 더 많은 데이터를 가져옴
      const limit = page === 1 ? 50 : 20;
      const result = await asanasAPI.getAsanasWithPagination(page, limit);

      if (result.success && result.data) {
        // 이미 선택된 아사나는 제외
        const filteredResults = result.data.filter(
          (asana) =>
            !selectedAsanas.find((selected) => selected.id === asana.id)
        );

        if (append) {
          setSearchResults((prev) => {
            const combined = [...prev, ...filteredResults];
            return removeDuplicates(combined);
          });
        } else {
          setSearchResults(removeDuplicates(filteredResults));
        }

        // 더 로드할 데이터가 있는지 확인
        setHasMore(filteredResults.length === limit);
      } else {
        if (!append) {
          setSearchResults([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      if (!append) {
        setSearchResults([]);
      }
      setHasMore(false);
    } finally {
      setSearching(false);
      setLoadingMore(false);
    }
  };

  // 카테고리 토글
  const toggleCategory = (category: AsanaCategory) => {
    setSelectedCategories((prev) => {
      const isSelected = prev.includes(category);
      if (isSelected) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // 아사나 선택/해제
  const toggleAsanaSelection = (asana: Asana) => {
    setTempSelectedAsanas((prev) => {
      const isSelected = prev.find((item) => item.id === asana.id);
      if (isSelected) {
        return prev.filter((item) => item.id !== asana.id);
      } else {
        // 10개 제한 확인
        if (prev.length >= 10) {
          Alert.alert("알림", "최대 10개의 아사나만 선택할 수 있습니다.");
          return prev;
        }
        return [...prev, asana];
      }
    });
  };

  // 무한스크롤을 위한 추가 데이터 로드
  const loadMoreAsanas = () => {
    if (!loadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      searchAsanas(searchQuery, selectedCategories, nextPage, true);
    }
  };

  // 중복 제거 함수
  const removeDuplicates = (asanas: Asana[]) => {
    const seen = new Set();
    return asanas.filter((asana) => {
      const duplicate = seen.has(asana.id);
      seen.add(asana.id);
      return !duplicate;
    });
  };

  // 선택 완료
  const handleComplete = () => {
    onSelect(tempSelectedAsanas);
    setTempSelectedAsanas([]);
    setSearchQuery("");
    setSelectedCategories([]);
    setSearchResults([]);
    onClose();
  };

  // 이미지 URL 생성
  const getImageUrl = (imageNumber: string) => {
    const formattedNumber = imageNumber.padStart(3, "0");
    return `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/thumbnail/${formattedNumber}.png`;
  };

  // 카테고리 정보 가져오기
  const getCategoryInfo = (categoryName: string) => {
    const category = CATEGORIES[categoryName as AsanaCategory];
    if (category) {
      return {
        label: category.label,
        color: category.color,
      };
    }
    return {
      label: "기타",
      color: COLORS.textSecondary,
    };
  };

  // 카테고리 버튼 렌더링
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

  // 아사나 카드 렌더링 - 아사나 탭과 동일한 카드 디자인 사용
  const renderAsanaCard = ({ item }: { item: Asana }) => {
    const isSelected = tempSelectedAsanas.find((asana) => asana.id === item.id);

    return (
      <View style={styles.asanaCardWrapper}>
        <AsanaCard
          asana={item}
          // 모달에서는 상세로 이동하지 않고 선택 토글만 수행
          onPress={(asana) => toggleAsanaSelection(asana)}
          // 즐겨찾기 UI는 숨김
          showFavoriteIndicator={false}
        />
        {isSelected && (
          <View style={styles.asanaCheckmark}>
            <Text style={styles.asanaCheckmarkText}>✓</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.completeButton,
              { opacity: tempSelectedAsanas.length > 0 ? 1 : 0.5 },
            ]}
            onPress={handleComplete}
            disabled={tempSelectedAsanas.length === 0}
          >
            <Text style={styles.completeButtonText}>
              선택 완료 ({tempSelectedAsanas.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* 검색창 */}
        <View style={styles.searchContainer}>
          <TamaguiInputComponent
            placeholder="아사나 이름을 검색하세요"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
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

        {/* 검색 결과 */}
        <View style={styles.resultsContainer}>
          {searching ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>검색 중...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderAsanaCard}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              numColumns={2}
              columnWrapperStyle={styles.asanaRow}
              contentContainerStyle={styles.asanaList}
              showsVerticalScrollIndicator={false}
              onEndReached={loadMoreAsanas}
              onEndReachedThreshold={0.1}
              ListFooterComponent={
                loadingMore ? (
                  <View style={styles.loadingMoreContainer}>
                    <Text style={styles.loadingMoreText}>
                      더 불러오는 중...
                    </Text>
                  </View>
                ) : null
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery || selectedCategories.length > 0
                  ? "검색 결과가 없습니다."
                  : "아사나 목록을 불러오는 중..."}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceDark,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  completeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  categoryContainer: {
    paddingHorizontal: 24,
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
    textAlign: "center",
    lineHeight: 18,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  asanaList: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  asanaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 12, // 카드 사이 간격
  },
  asanaCardWrapper: {
    width: cardWidth,
    marginBottom: 10,
  },
  asanaCheckmark: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  asanaCheckmarkText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingMoreText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
