import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import MapView, { Marker } from "react-native-maps";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";

const { height: screenHeight } = Dimensions.get("window");
const BOTTOM_SHEET_MIN_HEIGHT = 120;
const BOTTOM_SHEET_MAX_HEIGHT = screenHeight * 0.7;

// 임시 요가원 데이터 (위도/경도 포함)
const MOCK_STUDIOS = [
  {
    id: "1",
    name: "요가스튜디오 나마스떼",
    location: "강남구 역삼동",
    rating: 4.8,
    price: "₩25,000",
    image: "https://via.placeholder.com/300x200/4A4A4A/FFFFFF?text=Yoga+Studio",
    types: ["하타", "빈야사"],
    distance: "0.3km",
    latitude: 37.5665,
    longitude: 127.0018,
  },
  {
    id: "2",
    name: "마음의 요가",
    location: "서초구 서초동",
    rating: 4.6,
    price: "₩30,000",
    image: "https://via.placeholder.com/300x200/4A4A4A/FFFFFF?text=Mind+Yoga",
    types: ["아쉬탕가", "요가테라피"],
    distance: "0.8km",
    latitude: 37.5013,
    longitude: 127.0246,
  },
  {
    id: "3",
    name: "평화 요가센터",
    location: "마포구 합정동",
    rating: 4.9,
    price: "₩22,000",
    image: "https://via.placeholder.com/300x200/4A4A4A/FFFFFF?text=Peace+Yoga",
    types: ["하타", "아이엔가"],
    distance: "1.2km",
    latitude: 37.5492,
    longitude: 126.9134,
  },
  {
    id: "4",
    name: "에너지 요가",
    location: "용산구 이태원동",
    rating: 4.7,
    price: "₩28,000",
    image: "https://via.placeholder.com/300x200/4A4A4A/FFFFFF?text=Energy+Yoga",
    types: ["빈야사", "파워요가"],
    distance: "1.5km",
    latitude: 37.5344,
    longitude: 126.9942,
  },
];

export default function StudiosScreen() {
  const { isAuthenticated, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStudios, setFilteredStudios] = useState(MOCK_STUDIOS);

  // 바텀 시트 애니메이션 값
  const translateY = useSharedValue(0);
  const context = useRef({ startY: 0 });

  // 초기 바텀 시트 위치 설정
  React.useEffect(() => {
    translateY.value = 0;
  }, []);

  // 검색 기능
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredStudios(MOCK_STUDIOS);
    } else {
      const filtered = MOCK_STUDIOS.filter(
        (studio) =>
          studio.name.toLowerCase().includes(query.toLowerCase()) ||
          studio.location.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredStudios(filtered);
    }
  };

  // 제스처 핸들러
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      const newTranslateY = ctx.startY + event.translationY;
      // 위로 드래그할 때는 최대 높이까지, 아래로 드래그할 때는 최소 높이까지
      translateY.value = Math.max(
        -BOTTOM_SHEET_MAX_HEIGHT + BOTTOM_SHEET_MIN_HEIGHT,
        Math.min(0, newTranslateY)
      );
    },
    onEnd: (event) => {
      const currentTranslateY = translateY.value;
      const threshold = -BOTTOM_SHEET_MAX_HEIGHT / 2;

      // 속도가 빠르거나 중간 지점을 넘었으면 완전히 펼치기
      const shouldSnapToTop =
        event.velocityY < -300 || currentTranslateY < threshold;

      const targetY = shouldSnapToTop
        ? -BOTTOM_SHEET_MAX_HEIGHT + BOTTOM_SHEET_MIN_HEIGHT
        : 0;

      translateY.value = withSpring(targetY, {
        damping: 25,
        stiffness: 100,
      });
    },
  });

  // 바텀 시트 애니메이션 스타일
  const bottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 지도 영역 */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 37.5665,
            longitude: 127.0018,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {filteredStudios.map((studio) => (
            <Marker
              key={studio.id}
              coordinate={{
                latitude: studio.latitude,
                longitude: studio.longitude,
              }}
              title={studio.name}
              description={`${studio.price} • ${studio.rating}⭐`}
            />
          ))}
        </MapView>

        {/* 검색 바 */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="요가원 검색..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterButtonText}>필터</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 바텀 시트 */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.bottomSheet, bottomSheetStyle]}>
          {/* 드래그 핸들 */}
          <View style={styles.dragHandle}>
            <View style={styles.dragIndicator} />
          </View>

          {/* 헤더 */}
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>
              주변 요가원 ({filteredStudios.length}개)
            </Text>
          </View>

          {/* 요가원 리스트 */}
          <ScrollView
            style={styles.studiosList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {filteredStudios.map((studio) => (
              <TouchableOpacity key={studio.id} style={styles.studioCard}>
                <Image
                  source={{ uri: studio.image }}
                  style={styles.studioImage}
                />
                <View style={styles.studioInfo}>
                  <View style={styles.studioHeader}>
                    <Text style={styles.studioName}>{studio.name}</Text>
                    <TouchableOpacity style={styles.favoriteButton}>
                      <Text style={styles.favoriteIcon}>♡</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.studioDetails}>
                    <Text style={styles.studioLocation}>
                      📍 {studio.location}
                    </Text>
                    <Text style={styles.studioDistance}>{studio.distance}</Text>
                  </View>

                  <View style={styles.studioMeta}>
                    <View style={styles.ratingContainer}>
                      <Text style={styles.ratingStar}>⭐</Text>
                      <Text style={styles.ratingText}>{studio.rating}</Text>
                    </View>
                    <Text style={styles.studioPrice}>{studio.price}</Text>
                  </View>

                  <View style={styles.studioTypes}>
                    {studio.types.map((type, index) => (
                      <View key={index} style={styles.typeTag}>
                        <Text style={styles.typeText}>{type}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapContainer: {
    flex: 1,
    paddingTop: 60, // 상태바 높이 + 여백
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: "absolute",
    top: 100, // 상태바 높이 + 여백
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    zIndex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  filterButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BOTTOM_SHEET_MAX_HEIGHT,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1,
  },
  dragHandle: {
    alignItems: "center",
    paddingVertical: 10,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#666666",
    borderRadius: 2,
  },
  bottomSheetHeader: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  studiosList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  studioCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studioImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  studioInfo: {
    flex: 1,
    padding: 10,
  },
  studioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  studioName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    flex: 1,
  },
  favoriteButton: {
    padding: 5,
  },
  favoriteIcon: {
    fontSize: 24,
    color: COLORS.primary,
  },
  studioDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  studioLocation: {
    fontSize: 14,
    color: "#333333",
  },
  studioDistance: {
    fontSize: 14,
    color: "#333333",
  },
  studioMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
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
    color: "#000000",
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
    marginTop: 4,
  },
  typeTag: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 12,
    color: "#333333",
  },
});
