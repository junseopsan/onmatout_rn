import React, { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { useStudioSearch } from "../../hooks/useStudios";
import { Studio } from "../../lib/api/studio";

export default function StudiosScreen() {
  const { isAuthenticated, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // React Query로 요가원 데이터 가져오기
  const {
    data: filteredStudios = [],
    isLoading: loadingStudios,
    isError,
    error,
    refetch,
  } = useStudioSearch(searchQuery);

  // 타입 안전성을 위한 변수
  const studios: Studio[] = Array.isArray(filteredStudios)
    ? filteredStudios
    : [];

  // 검색 기능
  const handleSearch = (query: string) => {
    console.log("=== 요가원 탭 검색 디버깅 ===");
    console.log("입력된 검색어:", query);
    setSearchQuery(query);
  };

  // 인스타그램 링크 열기
  const openInstagram = async (instagramUrl: string) => {
    try {
      // URL이 @로 시작하는 경우 인스타그램 프로필 URL로 변환
      let url = instagramUrl;
      if (instagramUrl.startsWith("@")) {
        url = `https://www.instagram.com/${instagramUrl.substring(1)}/`;
      } else if (!instagramUrl.startsWith("http")) {
        url = `https://www.instagram.com/${instagramUrl}/`;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("오류", "인스타그램을 열 수 없습니다.");
      }
    } catch (error) {
      Alert.alert("오류", "인스타그램을 열 수 없습니다.");
    }
  };

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading || !isAuthenticated) {
    return (
      <View style={styles.container}>{/* 빈 화면 - 배경색만 표시 */}</View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 검색 바 */}
      <View style={styles.headerContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="요가원 검색..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* 에러 상태 */}
      {isError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error?.message || "요가원 정보를 불러오는데 실패했습니다."}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 메인 콘텐츠 - 요가원 목록 */}
      <ScrollView style={styles.studiosList}>
        <Text style={styles.listTitle}>주변 요가원 ({studios.length}개)</Text>

        {loadingStudios ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              요가원 정보를 불러오는 중...
            </Text>
          </View>
        ) : studios.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? "검색 결과가 없습니다."
                : "요가원 정보가 없습니다."}
            </Text>
          </View>
        ) : (
          studios.map((studio: Studio) => (
            <TouchableOpacity key={studio.id} style={styles.studioCard}>
              <Image
                source={{
                  uri:
                    studio.image_url ||
                    "https://via.placeholder.com/300x200/4A4A4A/FFFFFF?text=Yoga+Studio",
                }}
                style={styles.studioImage}
                resizeMode="cover"
              />
              <View style={styles.studioInfo}>
                <Text style={styles.studioName}>{studio.name}</Text>
                <Text style={styles.studioLocation}>📍 {studio.address}</Text>

                {studio.phone && (
                  <Text style={styles.studioPhone}>📞 {studio.phone}</Text>
                )}

                {studio.description && (
                  <Text style={styles.studioDescription} numberOfLines={2}>
                    {studio.description}
                  </Text>
                )}

                {studio.instagram && (
                  <TouchableOpacity
                    style={styles.instagramButton}
                    onPress={() => openInstagram(studio.instagram!)}
                  >
                    <Text style={styles.instagramText}>
                      @{studio.instagram}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60, // 상태바 높이 + 여백
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  headerContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  studiosList: {
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  studioCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  studioImage: {
    width: "100%",
    height: 150,
  },
  studioInfo: {
    padding: 16,
  },
  studioName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  studioLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  studioPhone: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  studioDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  studioMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingStar: {
    fontSize: 16,
    color: COLORS.primary,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginLeft: 4,
  },
  studioPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  studioTypes: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  typeTag: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  instagramButton: {
    backgroundColor: "#E4405F",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  instagramText: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
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
