import React, { useState } from "react";
import {
  Alert,
  FlatList,
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

// 지역 데이터
const REGIONS = {
  seoul: {
    name: "서울",
    districts: [
      "강남구", "서초구", "송파구", "강동구", "마포구", "서대문구", 
      "종로구", "중구", "동대문구", "성동구", "중랑구", "성북구", 
      "강북구", "도봉구", "노원구", "은평구", "양천구", "구로구", 
      "금천구", "영등포구", "동작구", "관악구"
    ]
  },
  gyeonggi: {
    name: "경기",
    districts: [
      "수원시", "성남시", "의정부시", "안양시", "부천시", "광명시", 
      "평택시", "과천시", "오산시", "시흥시", "군포시", "의왕시", 
      "하남시", "용인시", "파주시", "이천시", "안성시", "김포시", 
      "화성시", "광주시", "여주시", "양평군", "가평군", "연천군"
    ]
  },
  busan: {
    name: "부산",
    districts: [
      "중구", "서구", "동구", "영도구", "부산진구", "동래구", 
      "남구", "북구", "해운대구", "사하구", "금정구", "강서구", 
      "연제구", "수영구", "사상구", "기장군"
    ]
  },
  incheon: {
    name: "인천",
    districts: [
      "중구", "동구", "미추홀구", "연수구", "남동구", "부평구", 
      "계양구", "서구", "강화군", "옹진군"
    ]
  },
  daegu: {
    name: "대구",
    districts: [
      "중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군"
    ]
  },
  gwangju: {
    name: "광주",
    districts: ["동구", "서구", "남구", "북구", "광산구"]
  },
  daejeon: {
    name: "대전",
    districts: ["동구", "중구", "서구", "유성구", "대덕구"]
  },
  ulsan: {
    name: "울산",
    districts: ["중구", "남구", "동구", "북구", "울주군"]
  }
};

type RegionKey = keyof typeof REGIONS;

export default function StudiosScreen() {
  const { isAuthenticated, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<RegionKey | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [showDistricts, setShowDistricts] = useState(false);

  // React Query로 요가원 데이터 가져오기
  const {
    data: filteredStudios = [],
    isLoading: loadingStudios,
    isError,
    error,
    refetch,
  } = useStudioSearch(searchQuery);

  // 타입 안전성을 위한 변수
  const allStudios: Studio[] = Array.isArray(filteredStudios)
    ? filteredStudios
    : [];

  // 지역 필터링된 요가원
  const studios = allStudios.filter((studio) => {
    if (!selectedRegion && !selectedDistrict) return true;
    
    const address = studio.address || "";
    
    if (selectedDistrict) {
      return address.includes(selectedDistrict);
    }
    
    if (selectedRegion) {
      const regionName = REGIONS[selectedRegion].name;
      return address.includes(regionName);
    }
    
    return true;
  });

  // 검색 기능
  const handleSearch = (query: string) => {
    console.log("=== 요가원 탭 검색 디버깅 ===");
    console.log("입력된 검색어:", query);
    setSearchQuery(query);
  };

  // 지역 선택 핸들러
  const handleRegionSelect = (regionKey: RegionKey) => {
    if (selectedRegion === regionKey) {
      // 같은 지역을 다시 클릭하면 선택 해제
      setSelectedRegion(null);
      setSelectedDistrict(null);
      setShowDistricts(false);
    } else {
      setSelectedRegion(regionKey);
      setSelectedDistrict(null);
      setShowDistricts(true);
    }
  };

  // 구/군 선택 핸들러
  const handleDistrictSelect = (district: string) => {
    if (selectedDistrict === district) {
      setSelectedDistrict(null);
    } else {
      setSelectedDistrict(district);
    }
  };

  // 필터 초기화
  const handleFilterReset = () => {
    setSelectedRegion(null);
    setSelectedDistrict(null);
    setShowDistricts(false);
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
        
        {/* 필터 초기화 버튼 */}
        {(selectedRegion || selectedDistrict) && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleFilterReset}
          >
            <Text style={styles.resetButtonText}>필터 초기화</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 지역 필터 */}
      <View style={styles.regionContainer}>
        <Text style={styles.regionTitle}>지역 선택</Text>
        <FlatList
          data={Object.keys(REGIONS) as RegionKey[]}
          renderItem={({ item }) => {
            const isSelected = selectedRegion === item;
            return (
              <TouchableOpacity
                style={[
                  styles.regionButton,
                  isSelected && styles.regionButtonSelected,
                ]}
                onPress={() => handleRegionSelect(item)}
              >
                <Text
                  style={[
                    styles.regionButtonText,
                    isSelected && styles.regionButtonTextSelected,
                  ]}
                >
                  {REGIONS[item].name}
                </Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.regionScrollView}
        />
      </View>

      {/* 구/군 필터 (지역 선택 시에만 표시) */}
      {showDistricts && selectedRegion && (
        <View style={styles.districtContainer}>
          <Text style={styles.districtTitle}>
            {REGIONS[selectedRegion].name} 구/군 선택
          </Text>
          <FlatList
            data={REGIONS[selectedRegion].districts}
            renderItem={({ item }) => {
              const isSelected = selectedDistrict === item;
              return (
                <TouchableOpacity
                  style={[
                    styles.districtButton,
                    isSelected && styles.districtButtonSelected,
                  ]}
                  onPress={() => handleDistrictSelect(item)}
                >
                  <Text
                    style={[
                      styles.districtButtonText,
                      isSelected && styles.districtButtonTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.districtScrollView}
          />
        </View>
      )}

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
  // 지역 필터 스타일
  regionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  regionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  regionScrollView: {
    gap: 8,
  },
  regionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  regionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  regionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  regionButtonTextSelected: {
    color: "white",
  },
  // 구/군 필터 스타일
  districtContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
  },
  districtTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  districtScrollView: {
    gap: 6,
  },
  districtButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  districtButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  districtButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.text,
  },
  districtButtonTextSelected: {
    color: "white",
  },
  // 필터 초기화 버튼
  resetButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  resetButtonText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },
});
