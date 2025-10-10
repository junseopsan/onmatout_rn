// 네이버 맵 제거됨
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { Studio } from "../../lib/api/studio";

const { width, height } = Dimensions.get("window");

interface StudioMapViewProps {
  studios: Studio[];
  searchQuery?: string;
  onStudioSelect?: (studio: Studio) => void;
}

export default function StudioMapView({
  studios,
  searchQuery = "",
  onStudioSelect,
}: StudioMapViewProps) {
  console.log("=== StudioMapView 렌더링 ===");
  console.log("받은 searchQuery:", searchQuery);
  console.log("받은 studios 개수:", studios.length);
  const [camera, setCamera] = useState({
    latitude: 37.5665, // 서울 기본 위치
    longitude: 126.978,
    zoom: 12,
  });
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [mapLoading, setMapLoading] = useState<boolean>(true);

  // 검색어에 따라 필터링된 요가원 계산
  const filteredStudios = React.useMemo(() => {
    console.log("=== 지도 검색 디버깅 ===");
    console.log("searchQuery:", searchQuery);
    console.log("전체 studios 개수:", studios.length);

    if (!searchQuery.trim()) {
      console.log("검색어 없음 - 전체 studios 반환");
      return studios;
    }

    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
    console.log("검색어 분리:", searchTerms);

    const filtered = studios.filter((studio) => {
      const name = studio.name.toLowerCase().trim();
      const address = studio.address.toLowerCase().trim();
      const description = (studio.description || "").toLowerCase().trim();

      const matches = searchTerms.every(
        (term) =>
          name.includes(term) ||
          address.includes(term) ||
          description.includes(term)
      );

      if (matches) {
        console.log("매칭된 studio:", studio.name);
      }

      return matches;
    });

    console.log("필터링된 결과 개수:", filtered.length);
    return filtered;
  }, [studios, searchQuery]);

  // 위치 권한 요청 및 현재 위치 가져오기
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      // 위치 권한 요청
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "위치 권한 필요",
          "주변 요가원을 찾기 위해 위치 권한이 필요합니다.",
          [{ text: "확인" }]
        );
        setLocationPermission(false);
        return;
      }

      setLocationPermission(true);

      // 현재 위치 가져오기
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setUserLocation({ latitude, longitude });

      // 지도 중심을 현재 위치로 이동
      setCamera({
        latitude,
        longitude,
        zoom: 15,
      });
    } catch (error) {
      console.log("기본 위치(서울)로 설정합니다.");

      // 위치 가져오기 실패 시 서울로 기본 설정
      setCamera({
        latitude: 37.5665,
        longitude: 126.978,
        zoom: 12,
      });
    }
  };

  const handleMarkerPress = (studio: Studio) => {
    if (onStudioSelect) {
      onStudioSelect(studio);
    }
  };

  const moveToUserLocation = () => {
    if (userLocation) {
      setCamera({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        zoom: 15,
      });
    } else {
      getCurrentLocation();
    }
  };

  return (
    <View style={styles.container}>
      {/* 요가원 리스트 */}
      <View style={styles.studioList}>
        {filteredStudios.map((studio) => (
          <TouchableOpacity
            key={studio.id}
            style={styles.studioItem}
            onPress={() => handleMarkerPress(studio)}
          >
            <View style={styles.studioIcon}>
              <Text style={styles.studioEmoji}>🧘‍♀️</Text>
            </View>
            <View style={styles.studioInfo}>
              <Text style={styles.studioName}>{studio.name}</Text>
              <Text style={styles.studioAddress}>{studio.address}</Text>
              {studio.phone && (
                <Text style={styles.studioPhone}>📞 {studio.phone}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 지도 오버레이 그라데이션 */}
      <View style={styles.mapOverlay} pointerEvents="none" />

      {/* 검색 결과 카운터 */}
      {searchQuery.trim() && (
        <View style={styles.searchResultContainer}>
          <Text style={styles.searchResultText}>
            &ldquo;{searchQuery}&rdquo; 검색 결과: {filteredStudios.length}개
          </Text>
          {filteredStudios.length === 0 && (
            <Text style={styles.noResultsText}>
              검색 결과가 없습니다. 다른 키워드를 시도해보세요.
            </Text>
          )}
        </View>
      )}

      {/* 검색어가 있을 때만 마커 표시 */}
      {searchQuery.trim() && filteredStudios.length === 0 && (
        <View style={styles.emptySearchContainer}>
          <Text style={styles.emptySearchText}>
            &ldquo;{searchQuery}&rdquo;에 대한 검색 결과가 없습니다.
          </Text>
          <Text style={styles.emptySearchSubtext}>
            요가원 이름, 주소, 설명에서 검색됩니다.
          </Text>
        </View>
      )}

      {/* 지도 로딩 상태 표시 */}
      {mapLoading && (
        <View style={styles.mapStatusContainer}>
          <Text style={styles.mapStatusText}>🗺️ 지도를 불러오는 중...</Text>
          <Text style={styles.mapStatusSubtext}>잠시만 기다려주세요.</Text>
        </View>
      )}

      {/* 현재 위치로 이동 버튼 */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={moveToUserLocation}
      >
        <Text style={styles.locationButtonText}>📍</Text>
      </TouchableOpacity>

      {/* 줌 컨트롤 버튼들 */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => {
            setCamera((prev) => ({
              ...prev,
              zoom: Math.min(prev.zoom + 1, 20),
            }));
          }}
        >
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => {
            setCamera((prev) => ({
              ...prev,
              zoom: Math.max(prev.zoom - 1, 1),
            }));
          }}
        >
          <Text style={styles.zoomButtonText}>-</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(248, 249, 250, 0.1)",
    pointerEvents: "none",
  },
  locationButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "white",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  locationButtonText: {
    fontSize: 16,
  },
  modernCallout: {
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  calloutContainer: {
    width: 220,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
  },
  calloutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },
  yogaIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  yogaEmoji: {
    fontSize: 16,
  },
  calloutAddress: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 6,
    lineHeight: 18,
  },
  calloutPhone: {
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 4,
    fontWeight: "500",
  },
  calloutInstagram: {
    fontSize: 12,
    color: "#E4405F",
    marginBottom: 8,
    fontWeight: "500",
  },
  calloutFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 8,
    marginTop: 4,
  },
  calloutAction: {
    fontSize: 11,
    color: "#666666",
    textAlign: "center",
    fontStyle: "italic",
  },
  searchResultContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  searchResultText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
  },
  noResultsText: {
    fontSize: 13,
    color: "#666666",
    textAlign: "center",
    marginTop: 4,
    fontStyle: "italic",
  },
  emptySearchContainer: {
    position: "absolute",
    top: "50%",
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  emptySearchText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  mapStatusContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  mapStatusText: {
    fontSize: 14,
    color: "#1a1a1a",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 4,
  },
  mapStatusSubtext: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
  zoomControls: {
    position: "absolute",
    bottom: 80,
    right: 20,
    flexDirection: "column",
  },
  zoomButton: {
    backgroundColor: "white",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  zoomButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#ff6b6b",
  },
  markerInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
  },
  markerEmoji: {
    fontSize: 16,
  },
  userLocationMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4285f4",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: "white",
  },
  userLocationText: {
    fontSize: 14,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    margin: 20,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  studioList: {
    flex: 1,
    padding: 16,
  },
  studioItem: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  studioIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  studioEmoji: {
    fontSize: 20,
  },
  studioInfo: {
    flex: 1,
    justifyContent: "center",
  },
  studioName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  studioAddress: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
    lineHeight: 20,
  },
  studioPhone: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "500",
  },
});
