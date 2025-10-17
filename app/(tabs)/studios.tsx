import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StudioCardSkeleton } from "../../components/ui/SkeletonLoader";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { useStudioSearch } from "../../hooks/useStudios";
import { Studio } from "../../lib/api/studio";

// 지역 데이터
const REGIONS = {
  seoul: {
    name: "서울",
    districts: [
      "강남구",
      "서초구",
      "송파구",
      "강동구",
      "마포구",
      "서대문구",
      "종로구",
      "중구",
      "동대문구",
      "성동구",
      "중랑구",
      "성북구",
      "강북구",
      "도봉구",
      "노원구",
      "은평구",
      "양천구",
      "구로구",
      "금천구",
      "영등포구",
      "동작구",
      "관악구",
    ],
  },
  gyeonggi: {
    name: "경기",
    districts: [
      "수원시",
      "성남시",
      "의정부시",
      "안양시",
      "부천시",
      "광명시",
      "평택시",
      "과천시",
      "오산시",
      "시흥시",
      "군포시",
      "의왕시",
      "하남시",
      "용인시",
      "파주시",
      "이천시",
      "안성시",
      "김포시",
      "화성시",
      "광주시",
      "여주시",
      "양평군",
      "가평군",
      "연천군",
    ],
  },
  busan: {
    name: "부산",
    districts: [
      "중구",
      "서구",
      "동구",
      "영도구",
      "부산진구",
      "동래구",
      "남구",
      "북구",
      "해운대구",
      "사하구",
      "금정구",
      "강서구",
      "연제구",
      "수영구",
      "사상구",
      "기장군",
    ],
  },
  incheon: {
    name: "인천",
    districts: [
      "중구",
      "동구",
      "미추홀구",
      "연수구",
      "남동구",
      "부평구",
      "계양구",
      "서구",
      "강화군",
      "옹진군",
    ],
  },
  daegu: {
    name: "대구",
    districts: [
      "중구",
      "동구",
      "서구",
      "남구",
      "북구",
      "수성구",
      "달서구",
      "달성군",
    ],
  },
  gwangju: {
    name: "광주",
    districts: ["동구", "서구", "남구", "북구", "광산구"],
  },
  daejeon: {
    name: "대전",
    districts: ["동구", "중구", "서구", "유성구", "대덕구"],
  },
  ulsan: {
    name: "울산",
    districts: ["중구", "남구", "동구", "북구", "울주군"],
  },
};

type RegionKey = keyof typeof REGIONS;

export default function StudiosScreen() {
  const { isAuthenticated, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<RegionKey | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);

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
    setSelectedRegion(regionKey);
    setSelectedDistrict(null);
    setShowRegionModal(false);
  };

  // 구/군 선택 핸들러
  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
    setShowDistrictModal(false);
  };

  // 필터 초기화
  const handleFilterReset = () => {
    setSelectedRegion(null);
    setSelectedDistrict(null);
  };

  // 지역 드롭다운 열기
  const openRegionModal = () => {
    setShowRegionModal(true);
  };

  // 구/군 드롭다운 열기
  const openDistrictModal = () => {
    if (selectedRegion) {
      setShowDistrictModal(true);
    }
  };

  // 카카오 지도 링크 열기
  const openKakaoMap = async (mapUrl: string) => {
    try {
      const canOpen = await Linking.canOpenURL(mapUrl);
      if (canOpen) {
        await Linking.openURL(mapUrl);
      } else {
        Alert.alert("오류", "카카오 지도를 열 수 없습니다.");
      }
    } catch (error) {
      Alert.alert("오류", "카카오 지도를 열 수 없습니다.");
    }
  };

  // 요가원 제목에서 태그 추출
  const getStudioTags = (studioName: string) => {
    const tags = [];
    const name = studioName.toLowerCase();

    // 요가 관련 키워드
    if (name.includes("요가") || name.includes("yoga")) {
      tags.push("요가");
    }

    // 필라테스 관련 키워드
    if (name.includes("필라테스") || name.includes("pilates")) {
      tags.push("필라테스");
    }

    // 명상 관련 키워드
    if (
      name.includes("명상") ||
      name.includes("meditation") ||
      name.includes("명상")
    ) {
      tags.push("명상");
    }

    // 헬스/운동 관련 키워드
    if (
      name.includes("헬스") ||
      name.includes("health") ||
      name.includes("fitness")
    ) {
      tags.push("헬스");
    }

    // 댄스 관련 키워드
    if (
      name.includes("댄스") ||
      name.includes("dance") ||
      name.includes("춤")
    ) {
      tags.push("댄스");
    }

    // 스트레칭 관련 키워드
    if (name.includes("스트레칭") || name.includes("stretching")) {
      tags.push("스트레칭");
    }

    // 마사지 관련 키워드
    if (name.includes("마사지") || name.includes("massage")) {
      tags.push("마사지");
    }

    // 태그가 없으면 기본 태그 표시
    if (tags.length === 0) {
      tags.push("요가");
    }

    return tags;
  };

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading || !isAuthenticated) {
    return (
      <View style={styles.container}>{/* 빈 화면 - 배경색만 표시 */}</View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 검색 및 필터 바 */}
      <View style={styles.headerContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="요가원 검색..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          {/* 지역 드롭다운 */}
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={openRegionModal}
          >
            <Text style={styles.dropdownText}>
              {selectedRegion ? REGIONS[selectedRegion].name : "지역"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          {/* 구/군 드롭다운 */}
          <TouchableOpacity
            style={[
              styles.dropdownButton,
              !selectedRegion && styles.dropdownButtonDisabled,
            ]}
            onPress={openDistrictModal}
            disabled={!selectedRegion}
          >
            <Text
              style={[
                styles.dropdownText,
                !selectedRegion && styles.dropdownTextDisabled,
              ]}
            >
              {selectedDistrict || "구/군"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={
                !selectedRegion ? COLORS.textSecondary : COLORS.textSecondary
              }
            />
          </TouchableOpacity>
        </View>

        {/* 선택된 필터와 개수 표시 */}
        <View style={styles.filterAndCountContainer}>
          <View style={styles.filterTags}>
            {selectedRegion && (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>
                  {REGIONS[selectedRegion].name}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedRegion(null);
                    setSelectedDistrict(null);
                  }}
                >
                  <Ionicons
                    name="close"
                    size={14}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}
            {selectedDistrict && (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>{selectedDistrict}</Text>
                <TouchableOpacity onPress={() => setSelectedDistrict(null)}>
                  <Ionicons
                    name="close"
                    size={14}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.countText}>{studios.length}개</Text>
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
        {loadingStudios ? (
          <View style={styles.skeletonContainer}>
            {Array(5)
              .fill(null)
              .map((_, index) => (
                <StudioCardSkeleton key={`skeleton-${index}`} />
              ))}
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
            <View key={studio.id} style={styles.studioCard}>
              <View style={styles.studioHeader}>
                <View style={styles.studioTitleContainer}>
                  <Text style={styles.studioName}>{studio.name}</Text>
                  <View style={styles.studioLocation}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={COLORS.primary}
                    />
                    <Text style={styles.studioLocationText}>
                      {studio.address}
                    </Text>
                  </View>
                </View>
                {studio.url && (
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => openKakaoMap(studio.url!)}
                  >
                    <Ionicons name="map-outline" size={20} color="white" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.studioContent}>
                {studio.phone && (
                  <View style={styles.studioPhone}>
                    <Ionicons
                      name="call-outline"
                      size={16}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.studioPhoneText}>{studio.phone}</Text>
                  </View>
                )}

                {studio.description && (
                  <Text style={styles.studioDescription}>
                    {studio.description}
                  </Text>
                )}

                <View style={styles.studioTags}>
                  {getStudioTags(studio.name).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 지역 선택 모달 */}
      <Modal
        visible={showRegionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRegionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>지역 선택</Text>
              <TouchableOpacity
                onPress={() => setShowRegionModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {Object.keys(REGIONS).map((regionKey) => (
                <TouchableOpacity
                  key={regionKey}
                  style={[
                    styles.modalItem,
                    selectedRegion === regionKey && styles.modalItemSelected,
                  ]}
                  onPress={() => handleRegionSelect(regionKey as RegionKey)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedRegion === regionKey &&
                        styles.modalItemTextSelected,
                    ]}
                  >
                    {REGIONS[regionKey as RegionKey].name}
                  </Text>
                  {selectedRegion === regionKey && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 구/군 선택 모달 */}
      <Modal
        visible={showDistrictModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedRegion ? REGIONS[selectedRegion].name : ""} 구/군 선택
              </Text>
              <TouchableOpacity
                onPress={() => setShowDistrictModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {selectedRegion &&
                REGIONS[selectedRegion].districts.map((district) => (
                  <TouchableOpacity
                    key={district}
                    style={[
                      styles.modalItem,
                      selectedDistrict === district && styles.modalItemSelected,
                    ]}
                    onPress={() => handleDistrictSelect(district)}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedDistrict === district &&
                          styles.modalItemTextSelected,
                      ]}
                    >
                      {district}
                    </Text>
                    {selectedDistrict === district && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  skeletonContainer: {
    padding: 16,
  },
  headerContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    height: 44, // 드롭다운 버튼과 동일한 높이
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
  filterAndCountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 24,
    paddingRight: 16,
    paddingTop: 4,
    paddingBottom: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
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
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  studioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 16,
  },
  studioTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  studioName: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  studioLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  studioLocationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  mapButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 48,
    minHeight: 48,
  },
  studioContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  studioPhone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  studioPhoneText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  studioDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  studioTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
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
  // 새로운 드롭다운 스타일
  searchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 100,
    height: 44, // 검색 입력창과 동일한 높이
  },
  dropdownButtonDisabled: {
    backgroundColor: COLORS.background,
    opacity: 0.5,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.text,
    marginRight: 4,
    flex: 1,
  },
  dropdownTextDisabled: {
    color: COLORS.textSecondary,
  },
  filterTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  filterTagText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemSelected: {
    backgroundColor: COLORS.background,
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  modalItemTextSelected: {
    fontWeight: "600",
    color: COLORS.primary,
  },
});
