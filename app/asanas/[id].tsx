import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Image } from "expo-image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  AppState,
  Dimensions,
  ScrollView as RNScrollView,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ScrollView, Text, XStack, YStack } from "tamagui";
import { COLORS } from "../../constants/Colors";
import { CATEGORIES } from "../../constants/categories";
import { useAsanaDetail } from "../../hooks/useAsanas";
import { RootStackParamList } from "../../navigation/types";
import { ASANA_DETAIL_IMAGES } from "./detailImages";

const { width: screenWidth } = Dimensions.get("window");
const imageHeight = screenWidth * 0.85; // 화면 너비의 85% 높이로 증가

type AsanaDetailRouteProp = RouteProp<RootStackParamList, "AsanaDetail">;

// 공통으로 사용할 Shimmer 스켈레톤 컴포넌트
const ShimmerSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    loop.start();

    return () => {
      loop.stop();
    };
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    // 화면 전체를 기준으로 넉넉하게 좌 → 우로 이동하도록 설정
    outputRange: [-screenWidth, screenWidth],
  });

  return (
    <View
      style={[
        {
          backgroundColor: "#f0f0f0",
          borderRadius: 8,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          // 컨테이너보다 조금 넓게 해서 양 끝까지 자연스럽게 흐르게 함
          width: "60%",
          transform: [{ translateX }],
          backgroundColor: "#e6e6e6",
          opacity: 0.85,
        }}
      />
    </View>
  );
};

export default function AsanaDetailScreen() {
  const route = useRoute<AsanaDetailRouteProp>();
  const navigation = useNavigation();
  const { id } = route.params;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollRef = useRef<RNScrollView | null>(null);

  // React Query로 아사나 상세 데이터 가져오기
  const {
    data: asana,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useAsanaDetail(id);

  // 포그라운드 복귀 시 데이터 리프레시
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        AppState.currentState.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("[아사나 상세] 포그라운드 복귀 - 데이터 리프레시");
        // 포그라운드 복귀 시 데이터 강제 리프레시
        refetch().catch((err) => {
          console.log("[아사나 상세] 포그라운드 복귀 리프레시 실패:", err);
        });
      }
    });

    return () => subscription.remove();
  }, [refetch]);

  // 로컬 상세 이미지 배열 (예: 006_001, 006_002, 006_003 ...)
  const imageSources = useMemo(() => {
    if (!asana?.image_number) return [];
    const key = asana.image_number.padStart(3, "0");
    return ASANA_DETAIL_IMAGES[key] || [];
  }, [asana?.image_number]);

  const hasImages = imageSources.length > 0;

  const goToImage = useCallback(
    (index: number) => {
      if (index >= 0 && index < imageSources.length && scrollRef.current) {
        scrollRef.current.scrollTo({
          x: index * screenWidth,
          animated: true,
        });
        setCurrentImageIndex(index);
      }
    },
    [imageSources.length]
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case "1":
        return "#4CAF50"; // 초급: 밝은 초록색
      case "2":
        return "#FF9800"; // 중급: 주황색
      case "3":
        return "#F44336"; // 고급: 빨간색
      default:
        return COLORS.textSecondary;
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case "1":
        return "초급";
      case "2":
        return "중급";
      case "3":
        return "고급";
      default:
        return "미정";
    }
  };

  const getCategoryLabel = (categoryNameEn: string) => {
    // categories.ts의 CATEGORIES에서 매칭되는 카테고리 찾기
    const category = CATEGORIES[categoryNameEn as keyof typeof CATEGORIES];
    return category?.label || categoryNameEn;
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={COLORS.textSecondary} />
          <Text fontSize={16} color="$textSecondary" marginTop="$3">
            아사나 정보를 불러오는 중...
          </Text>
        </YStack>
      </SafeAreaView>
    );
  }

  if (isError || (!loading && !asana)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          padding="$6"
        >
          <Text
            fontSize={16}
            color="$error"
            textAlign="center"
            marginBottom="$6"
          >
            {error?.message || "아사나를 찾을 수 없습니다."}
          </Text>
          <Button
            backgroundColor="$primary"
            paddingVertical="$3"
            paddingHorizontal="$6"
            borderRadius="$2"
            onPress={() => navigation.goBack()}
          >
            <Text color="white" fontSize={16} fontWeight="bold">
              뒤로 가기
            </Text>
          </Button>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        {/* 이미지 슬라이드 영역: 로컬 상세 이미지 여러 장 또는 스켈레톤 */}
        <YStack height={imageHeight} backgroundColor="white" marginTop={0}>
          {hasImages ? (
            <YStack flex={1} position="relative">
              <RNScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const offsetX = event.nativeEvent.contentOffset.x;
                  const index = Math.round(offsetX / screenWidth);
                  setCurrentImageIndex(index);
                }}
              >
                {imageSources.map((source, index) => (
                  <YStack
                    key={index}
                    width={screenWidth}
                    height={imageHeight}
                    justifyContent="center"
                    alignItems="center"
                    backgroundColor="white"
                  >
                    <Image
                      source={source}
                      style={{
                        width: "85%",
                        height: "85%",
                        maxWidth: 280,
                        maxHeight: 220,
                      }}
                      contentFit="contain"
                      cachePolicy="memory-disk"
                      transition={0}
                    />
                  </YStack>
                ))}
              </RNScrollView>

              {/* 슬라이드 인디케이터 */}
              {imageSources.length > 1 && (
                <XStack
                  position="absolute"
                  bottom={20}
                  left={0}
                  right={0}
                  justifyContent="center"
                  alignItems="center"
                  paddingHorizontal="$5"
                >
                  <XStack gap="$2">
                    {imageSources.map((_, index: number) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => goToImage(index)}
                        activeOpacity={0.7}
                      >
                        <YStack
                          width={10}
                          height={10}
                          borderRadius="$10"
                          backgroundColor={
                            currentImageIndex === index
                              ? COLORS.primary
                              : "rgba(0,0,0,0.3)"
                          }
                        />
                      </TouchableOpacity>
                    ))}
                  </XStack>
                </XStack>
              )}
            </YStack>
          ) : (
            <YStack
              flex={1}
              justifyContent="center"
              alignItems="center"
              backgroundColor="white"
            >
              <ShimmerSkeleton
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            </YStack>
          )}
        </YStack>

        {/* 내용 영역 */}
        <YStack padding="$6" backgroundColor={COLORS.background}>
          {/* 제목 섹션 */}
          <YStack marginBottom="$8">
            {/* 아사나 이름과 난이도 */}
            <XStack
              justifyContent="space-between"
              alignItems="center"
              marginBottom="$3"
            >
              <Text fontSize={22} fontWeight="800" color="$text" flex={1}>
                {asana?.sanskrit_name_kr || "아사나"}
              </Text>
              <XStack
                backgroundColor="transparent"
                paddingHorizontal="$4"
                paddingVertical="$2"
                borderRadius="$3"
                borderWidth={1.5}
                borderColor="$text"
              >
                <Text fontSize={14} fontWeight="800" color="$text">
                  {getLevelText(asana?.level || "1")}
                </Text>
              </XStack>
            </XStack>

            <Text
              fontSize={18}
              color="$textSecondary"
              fontStyle="italic"
              marginBottom="$8"
            >
              {asana?.sanskrit_name_en || ""}
            </Text>

            {/* 정보 섹션 */}
            <YStack gap="$6" marginBottom="$8">
              {/* 카테고리 */}
              <YStack>
                <Text
                  fontSize={14}
                  fontWeight="600"
                  color="$textSecondary"
                  marginBottom="$2"
                >
                  카테고리
                </Text>
                <Text fontSize={16} color="$text" fontWeight="500">
                  {asana?.category_name_en &&
                  asana.category_name_en !== "nan" &&
                  asana.category_name_en !== "" &&
                  asana.category_name_en !== null
                    ? getCategoryLabel(asana.category_name_en)
                    : "정보 없음"}
                </Text>
              </YStack>

              {/* 산스크리트어 */}
              {(asana as any)?.sanskrit_name && (
                <YStack>
                  <Text
                    fontSize={14}
                    fontWeight="600"
                    color="$textSecondary"
                    marginBottom="$2"
                  >
                    산스크리트어
                  </Text>
                  <Text fontSize={20} color="$text" fontWeight="500">
                    {(asana as any).sanskrit_name}
                  </Text>
                </YStack>
              )}

              {/* 아사나 의미 */}
              {asana?.asana_meaning && (
                <YStack>
                  <Text
                    fontSize={14}
                    fontWeight="600"
                    color="$textSecondary"
                    marginBottom="$2"
                  >
                    아사나 의미
                  </Text>
                  <Text fontSize={16} color="$text" fontWeight="500">
                    {asana.asana_meaning}
                  </Text>
                </YStack>
              )}
            </YStack>
          </YStack>

          {/* 효과 */}
          {asana?.effect && (
            <YStack marginBottom="$8">
              <Text
                fontSize={20}
                fontWeight="700"
                color="$text"
                marginBottom="$4"
              >
                효과
              </Text>
              <Text fontSize={16} color="$textSecondary" lineHeight={26}>
                {asana.effect}
              </Text>
            </YStack>
          )}

          {/* 하단 여백 (너무 넓지 않게 적당히만 추가) */}
          <YStack height={60} />
        </YStack>
      </ScrollView>
    </View>
  );
}
