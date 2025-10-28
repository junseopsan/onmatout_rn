import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ScrollView, Text, XStack, YStack } from "tamagui";
import { COLORS } from "../../constants/Colors";
import { CATEGORIES } from "../../constants/categories";
import { useAsanaDetail } from "../../hooks/useAsanas";
import { RootStackParamList } from "../../navigation/types";

const { width: screenWidth } = Dimensions.get("window");
const imageHeight = screenWidth * 0.85; // 화면 너비의 85% 높이로 증가

type AsanaDetailRouteProp = RouteProp<RootStackParamList, "AsanaDetail">;

export default function AsanaDetailScreen() {
  const route = useRoute<AsanaDetailRouteProp>();
  const navigation = useNavigation();
  const { id } = route.params;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [showIndicators, setShowIndicators] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(
    new Set()
  );

  // React Query로 아사나 상세 데이터 가져오기
  const {
    data: asana,
    isLoading: loading,
    isError,
    error,
  } = useAsanaDetail(id);

  useEffect(() => {
    if (asana?.image_number) {
      loadValidImages(asana.image_number);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asana]);

  const checkImageExists = async (url: string) => {
    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  };

  // 이미지 미리 로딩 함수
  const preloadImage = useCallback(async (url: string) => {
    try {
      // expo-image의 캐시를 활용한 미리 로딩
      await Image.prefetch(url);
      setPreloadedImages((prev) => new Set([...prev, url]));
      return true;
    } catch (error) {
      console.log("이미지 미리 로딩 실패:", url, error);
      return false;
    }
  }, []);

  // 모든 이미지 미리 로딩
  const preloadAllImages = useCallback(
    async (urls: string[]) => {
      const preloadPromises = urls.map((url) => preloadImage(url));
      await Promise.allSettled(preloadPromises);
    },
    [preloadImage]
  );

  const loadValidImages = useCallback(
    async (imageNumber: string) => {
      setImageLoading(true);
      setShowIndicators(false);
      const urls: string[] = [];
      const baseNumber = imageNumber.padStart(3, "0");

      // 첫 번째 이미지는 항상 존재한다고 가정하고 즉시 추가
      const firstImageUrl = `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/${baseNumber}_001.png`;
      urls.push(firstImageUrl);
      setImageUrls(urls); // 첫 번째 이미지를 즉시 표시

      // 첫 번째 이미지도 미리 로딩
      preloadImage(firstImageUrl);

      // 추가 이미지들 확인 (백그라운드에서)
      const additionalUrls: string[] = [];
      for (let i = 2; i <= 10; i++) {
        const imageUrl = `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/${baseNumber}_${i
          .toString()
          .padStart(3, "0")}.png`;
        const exists = await checkImageExists(imageUrl);
        if (exists) {
          additionalUrls.push(imageUrl);
        } else {
          break; // 연속되지 않는 이미지가 있으면 중단
        }
      }

      // 추가 이미지들이 있으면 전체 URL 배열 업데이트
      if (additionalUrls.length > 0) {
        const allUrls = [...urls, ...additionalUrls];
        setImageUrls(allUrls);

        // 모든 이미지 미리 로딩 (백그라운드에서)
        preloadAllImages(allUrls);
      }

      setImageLoading(false);
      // 인디케이터를 즉시 표시
      setShowIndicators(true);
    },
    [preloadImage, preloadAllImages]
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

    console.log("카테고리 디버깅:", {
      original: categoryNameEn,
      found: category?.label || categoryNameEn,
    });

    return category?.label || categoryNameEn;
  };

  const nextImage = () => {
    if (imageUrls.length > 1) {
      const newIndex =
        currentImageIndex < imageUrls.length - 1 ? currentImageIndex + 1 : 0;

      // 다음 이미지가 미리 로딩되었는지 확인
      const nextImageUrl = imageUrls[newIndex];
      if (preloadedImages.has(nextImageUrl)) {
        setCurrentImageIndex(newIndex);
      } else {
        // 미리 로딩되지 않은 경우 즉시 로딩
        preloadImage(nextImageUrl).then(() => {
          setCurrentImageIndex(newIndex);
        });
      }
    }
  };

  const prevImage = () => {
    if (imageUrls.length > 1) {
      const newIndex =
        currentImageIndex > 0 ? currentImageIndex - 1 : imageUrls.length - 1;

      // 이전 이미지가 미리 로딩되었는지 확인
      const prevImageUrl = imageUrls[newIndex];
      if (preloadedImages.has(prevImageUrl)) {
        setCurrentImageIndex(newIndex);
      } else {
        // 미리 로딩되지 않은 경우 즉시 로딩
        preloadImage(prevImageUrl).then(() => {
          setCurrentImageIndex(newIndex);
        });
      }
    }
  };

  const goToImage = (index: number) => {
    if (index >= 0 && index < imageUrls.length) {
      const targetImageUrl = imageUrls[index];
      if (preloadedImages.has(targetImageUrl)) {
        setCurrentImageIndex(index);
      } else {
        // 미리 로딩되지 않은 경우 즉시 로딩
        preloadImage(targetImageUrl).then(() => {
          setCurrentImageIndex(index);
        });
      }
    }
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
        {/* 이미지 슬라이드 영역 */}
        <YStack height={imageHeight} backgroundColor="white" marginTop={0}>
          {imageUrls.length > 0 ? (
            <YStack flex={1} position="relative">
              {/* 좌우 슬라이드 버튼 */}
              {imageUrls.length > 1 && (
                <>
                  {/* 왼쪽 버튼 */}
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      left: 15,
                      top: "50%",
                      transform: [{ translateY: -15 }],
                      zIndex: 10,
                      width: 30,
                      height: 30,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onPress={prevImage}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={20} color="black" />
                  </TouchableOpacity>

                  {/* 오른쪽 버튼 */}
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      right: 15,
                      top: "50%",
                      transform: [{ translateY: -15 }],
                      zIndex: 10,
                      width: 30,
                      height: 30,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onPress={nextImage}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-forward" size={20} color="black" />
                  </TouchableOpacity>
                </>
              )}

              <YStack
                flex={1}
                justifyContent="center"
                alignItems="center"
                backgroundColor="white"
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    width: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={nextImage}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: imageUrls[currentImageIndex] }}
                    style={{
                      width: "85%",
                      height: "85%",
                      maxWidth: 280,
                      maxHeight: 220,
                    }}
                    contentFit="contain"
                    placeholder="🖼️"
                    placeholderContentFit="contain"
                    onError={() => {
                      console.log(
                        `이미지 로딩 실패: ${imageUrls[currentImageIndex]}`
                      );
                    }}
                    priority="high"
                    cachePolicy="memory-disk"
                    onLoad={() => setImageLoading(false)}
                    transition={0} // 전환 애니메이션 제거로 즉시 표시
                    allowDownscaling={true}
                    recyclingKey={imageUrls[currentImageIndex]} // 고유 키로 캐시 최적화
                  />
                </TouchableOpacity>

                {/* 스켈레톤 로딩 */}
                {imageLoading && (
                  <YStack
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    justifyContent="center"
                    alignItems="center"
                    backgroundColor="white"
                    zIndex={1}
                  >
                    <View
                      style={{
                        width: "85%",
                        height: "85%",
                        maxWidth: 280,
                        maxHeight: 220,
                        backgroundColor: "#f0f0f0",
                        borderRadius: 8,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: "60%",
                          height: "60%",
                          backgroundColor: "#e0e0e0",
                          borderRadius: 4,
                        }}
                      />
                    </View>
                  </YStack>
                )}

                {/* 슬라이드 인디케이터 */}
                {imageUrls.length > 1 && showIndicators && (
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
                      {imageUrls.map((_: any, index: number) => (
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
            </YStack>
          ) : (
            <YStack
              flex={1}
              justifyContent="center"
              alignItems="center"
              backgroundColor="white"
            >
              <View
                style={{
                  width: "85%",
                  height: "85%",
                  maxWidth: 280,
                  maxHeight: 220,
                  backgroundColor: "#f0f0f0",
                  borderRadius: 8,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: "60%",
                    height: "60%",
                    backgroundColor: "#e0e0e0",
                    borderRadius: 4,
                  }}
                />
              </View>
            </YStack>
          )}
        </YStack>

        {/* 내용 영역 */}
        <YStack padding="$4" gap="$4">
          {/* 제목 카드 */}
          <YStack
            backgroundColor="white"
            borderRadius="$4"
            padding="$5"
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.1}
            shadowRadius={8}
            elevation={3}
          >
            <Text fontSize={24} fontWeight="bold" color="$text" marginBottom="$2">
              {asana?.sanskrit_name_kr || "아사나"}
            </Text>
            {asana?.sanskrit_name_en && (
              <Text fontSize={16} color="$textSecondary" fontStyle="italic" marginBottom="$3">
                {asana.sanskrit_name_en}
              </Text>
            )}
            
            {/* 산스크리트어 정보 */}
            <YStack gap="$2">
              {(asana as any)?.sanskrit_name && (
                <XStack alignItems="center" gap="$2">
                  <Ionicons name="language" size={16} color={COLORS.primary} />
                  <Text fontSize={14} color="$textSecondary">
                    {(asana as any).sanskrit_name}
                  </Text>
                </XStack>
              )}
              {(asana as any)?.sanskrit_meaning && (
                <XStack alignItems="center" gap="$2">
                  <Ionicons name="book" size={16} color={COLORS.primary} />
                  <Text fontSize={14} color="$textSecondary">
                    {(asana as any).sanskrit_meaning}
                  </Text>
                </XStack>
              )}
            </YStack>
          </YStack>

          {/* 기본 정보 카드 */}
          <YStack
            backgroundColor="white"
            borderRadius="$4"
            padding="$5"
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.1}
            shadowRadius={8}
            elevation={3}
            gap="$4"
          >
            {/* 난이도와 카테고리 */}
            <XStack gap="$4" flexWrap="wrap">
              <YStack flex={1} minWidth={120}>
                <XStack alignItems="center" gap="$2" marginBottom="$2">
                  <Ionicons name="trending-up" size={16} color={COLORS.primary} />
                  <Text fontSize={14} fontWeight="600" color="$text">
                    난이도
                  </Text>
                </XStack>
                <Button
                  backgroundColor={getLevelColor(asana?.level || "1")}
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderRadius="$3"
                  disabled
                  height="auto"
                  minHeight={28}
                >
                  <Text fontSize={12} fontWeight="bold" color="white">
                    {getLevelText(asana?.level || "1")}
                  </Text>
                </Button>
              </YStack>

              <YStack flex={1} minWidth={120}>
                <XStack alignItems="center" gap="$2" marginBottom="$2">
                  <Ionicons name="grid" size={16} color={COLORS.primary} />
                  <Text fontSize={14} fontWeight="600" color="$text">
                    카테고리
                  </Text>
                </XStack>
                <Text fontSize={14} color="$textSecondary" lineHeight={20}>
                  {asana?.category_name_en &&
                  asana.category_name_en !== "nan" &&
                  asana.category_name_en !== "" &&
                  asana.category_name_en !== null
                    ? getCategoryLabel(asana.category_name_en)
                    : "정보 없음"}
                </Text>
              </YStack>
            </XStack>
          </YStack>

          {/* 의미 카드 */}
          {asana?.asana_meaning && (
            <YStack
              backgroundColor="white"
              borderRadius="$4"
              padding="$5"
              shadowColor="#000"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.1}
              shadowRadius={8}
              elevation={3}
            >
              <XStack alignItems="center" gap="$2" marginBottom="$3">
                <Ionicons name="bulb" size={18} color={COLORS.primary} />
                <Text fontSize={16} fontWeight="600" color="$text">
                  의미
                </Text>
              </XStack>
              <Text fontSize={15} color="$textSecondary" lineHeight={22}>
                {asana.asana_meaning}
              </Text>
            </YStack>
          )}

          {/* 효과 카드 */}
          {asana?.effect && (
            <YStack
              backgroundColor="white"
              borderRadius="$4"
              padding="$5"
              shadowColor="#000"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.1}
              shadowRadius={8}
              elevation={3}
            >
              <XStack alignItems="center" gap="$2" marginBottom="$3">
                <Ionicons name="heart" size={18} color={COLORS.primary} />
                <Text fontSize={16} fontWeight="600" color="$text">
                  효과
                </Text>
              </XStack>
              <Text fontSize={15} color="$textSecondary" lineHeight={22}>
                {asana.effect}
              </Text>
            </YStack>
          )}

          {/* 하단 여백 */}
          <YStack height={20} />
        </YStack>
      </ScrollView>
    </View>
  );
}
