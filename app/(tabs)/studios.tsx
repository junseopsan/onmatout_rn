import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { Studio, studioAPI } from "../../lib/api/studio";

const { height: screenHeight } = Dimensions.get("window");

export default function StudiosScreen() {
  const { isAuthenticated, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [studios, setStudios] = useState<Studio[]>([]);
  const [filteredStudios, setFilteredStudios] = useState<Studio[]>([]);
  const [loadingStudios, setLoadingStudios] = useState(true);

  // 요가원 데이터 가져오기
  useEffect(() => {
    loadStudios();
  }, []);

  const loadStudios = async () => {
    try {
      setLoadingStudios(true);
      const response = await studioAPI.getAllStudios();

      if (response.success && response.data) {
        setStudios(response.data);
        setFilteredStudios(response.data);
      } else {
        console.error("요가원 로드 실패:", response.message);
      }
    } catch (error) {
      console.error("요가원 로드 에러:", error);
    } finally {
      setLoadingStudios(false);
    }
  };

  // 검색 기능
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredStudios(studios);
    } else {
      const filtered = studios.filter(
        (studio) =>
          studio.name.toLowerCase().includes(query.toLowerCase()) ||
          studio.address.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredStudios(filtered);
    }
  };

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading || !isAuthenticated) {
    return null;
  }

  // 요가원 로딩 중
  if (loadingStudios) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>요가원 정보를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 검색 바 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="요가원 검색..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* 요가원 리스트 */}
      <ScrollView style={styles.studiosList}>
        <Text style={styles.listTitle}>
          주변 요가원 ({filteredStudios.length}개)
        </Text>

        {filteredStudios.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
          </View>
        ) : (
          filteredStudios.map((studio) => (
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

                {/* <View style={styles.studioMeta}>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingStar}>⭐</Text>
                    <Text style={styles.ratingText}>4.5</Text>
                  </View>
                  <Text style={styles.studioPrice}>₩25,000</Text>
                </View> */}

                {/* <View style={styles.studioTypes}>
                  <View style={styles.typeTag}>
                    <Text style={styles.typeText}>하타</Text>
                  </View>
                  <View style={styles.typeTag}>
                    <Text style={styles.typeText}>빈야사</Text>
                  </View>
                </View> */}
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
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
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
});
