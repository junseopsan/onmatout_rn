import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
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
  }, [asana]);

  const generateImageUrls = (imageNumber: string) => {
    const urls: string[] = [];
    const baseNumber = imageNumber.padStart(3, "0");

    // 최대 10개까지 이미지가 있을 수 있다고 가정
    for (let i = 1; i <= 10; i++) {
      const imageUrl = `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/${baseNumber}_${i
        .toString()
        .padStart(3, "0")}.png`;
      urls.push(imageUrl);
    }

    setImageUrls(urls);
  };

  const checkImageExists = async (url: string) => {
    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  };

  const loadValidImages = async (imageNumber: string) => {
    setImageLoading(true);
    const urls: string[] = [];
    const baseNumber = imageNumber.padStart(3, "0");

    // 첫 번째 이미지는 항상 존재한다고 가정하고 즉시 추가
    const firstImageUrl = `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/${baseNumber}_001.png`;
    urls.push(firstImageUrl);
    setImageUrls(urls); // 첫 번째 이미지를 즉시 표시

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
      setImageUrls([...urls, ...additionalUrls]);
    }

    setImageLoading(false);
  };

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

  const getImageUrl = (imageNumber: string) => {
    // image_number를 3자리 숫자로 포맷팅 (예: 1 -> 001)
    const formattedNumber = imageNumber.padStart(3, "0");
    return `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/thumbnail/${formattedNumber}.png`;
  };

  const nextImage = () => {
    if (currentImageIndex < imageUrls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
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
                  onPress={() => {
                    if (imageUrls.length > 1) {
                      if (currentImageIndex < imageUrls.length - 1) {
                        nextImage();
                      } else {
                        setCurrentImageIndex(0);
                      }
                    }
                  }}
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

                {/* 슬라이드 네비게이션 */}
                {imageUrls.length > 1 && !imageLoading && (
                  <XStack
                    position="absolute"
                    bottom={10}
                    left={0}
                    right={0}
                    justifyContent="center"
                    alignItems="center"
                    paddingHorizontal="$5"
                  >
                    <XStack gap="$1">
                      {imageUrls.map((_, index) => (
                        <YStack
                          key={index}
                          width={8}
                          height={8}
                          borderRadius="$10"
                          backgroundColor={
                            currentImageIndex === index
                              ? "#333333"
                              : "rgba(0,0,0,0.3)"
                          }
                        />
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
        <YStack padding="$6">
          {/* 제목 */}
          <Text fontSize={32} fontWeight="bold" color="$text" marginBottom="$2">
            {asana.sanskrit_name_kr}
          </Text>
          <Text
            fontSize={18}
            color="$textSecondary"
            fontStyle="italic"
            marginBottom="$6"
          >
            {asana.sanskrit_name_en}
          </Text>

          {/* 레벨 */}
          <YStack marginBottom="$6">
            <Text
              fontSize={18}
              fontWeight="bold"
              color="$text"
              marginBottom="$2"
            >
              난이도
            </Text>
            <Button
              backgroundColor={getLevelColor(asana.level)}
              alignSelf="flex-start"
              paddingHorizontal="$4"
              paddingVertical="$2"
              borderRadius="$5"
              disabled
              height="auto"
              minHeight={32}
            >
              <Text fontSize={14} fontWeight="bold" color="white">
                {getLevelText(asana.level)}
              </Text>
            </Button>
          </YStack>

          {/* 카테고리 */}
          <YStack marginBottom="$6">
            <Text
              fontSize={18}
              fontWeight="bold"
              color="$text"
              marginBottom="$2"
            >
              카테고리
            </Text>
            <Text fontSize={16} color="$textSecondary" lineHeight={24}>
              {asana.category_name_en &&
              asana.category_name_en !== "nan" &&
              asana.category_name_en !== "" &&
              asana.category_name_en !== null
                ? getCategoryLabel(asana.category_name_en)
                : "카테고리 정보 없음"}
            </Text>
          </YStack>

          {/* 의미 */}
          {asana.asana_meaning && (
            <YStack marginBottom="$6">
              <Text
                fontSize={18}
                fontWeight="bold"
                color="$text"
                marginBottom="$2"
              >
                의미
              </Text>
              <Text fontSize={16} color="$textSecondary" lineHeight={24}>
                {asana.asana_meaning}
              </Text>
            </YStack>
          )}

          {/* 효과 */}
          {asana.effect && (
            <YStack marginBottom="$6">
              <Text
                fontSize={18}
                fontWeight="bold"
                color="$text"
                marginBottom="$2"
              >
                효과
              </Text>
              <Text fontSize={16} color="$textSecondary" lineHeight={24}>
                {asana.effect}
              </Text>
            </YStack>
          )}

          {/* 하단 여백 */}
          <YStack height={40} />
        </YStack>
      </ScrollView>
    </View>
  );
}
