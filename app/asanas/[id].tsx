import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ScrollView, Text, XStack, YStack } from "tamagui";
import { COLORS } from "../../constants/Colors";
import { CATEGORIES } from "../../constants/categories";
import { useAsanaDetail } from "../../hooks/useAsanas";
import { RootStackParamList } from "../../navigation/types";

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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [showIndicators, setShowIndicators] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(
    new Set()
  );

  // 스와이프 애니메이션을 위한 ref
  const gestureX = useRef(new Animated.Value(0)).current;
  const screenWidthValue = useRef(new Animated.Value(screenWidth)).current;

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
      const baseNumber = imageNumber.padStart(3, "0");

      // 첫 번째 이미지는 항상 존재한다고 가정하고 즉시 추가 및 표시
      const firstImageUrl = `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/${baseNumber}_001.png`;
      setImageUrls([firstImageUrl]); // 첫 번째 이미지를 즉시 표시
      
      // 첫 번째 이미지 로딩 시작 (비동기, 블로킹하지 않음)
      preloadImage(firstImageUrl).then(() => {
        // 첫 번째 이미지 로딩 완료 후 로딩 상태 해제
        setImageLoading(false);
      });

      // 추가 이미지들 확인 및 미리 로딩 (백그라운드에서 병렬 처리)
      // 첫 번째 이미지 표시를 차단하지 않도록 비동기로 실행
      (async () => {
        const additionalUrls: string[] = [];
        
        // 병렬로 이미지 존재 여부 확인 (최대 9개 동시 확인)
        const checkPromises: Promise<{ index: number; exists: boolean; url: string }>[] = [];
        for (let i = 2; i <= 10; i++) {
          const imageUrl = `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/${baseNumber}_${i
            .toString()
            .padStart(3, "0")}.png`;
          
          checkPromises.push(
            checkImageExists(imageUrl).then((exists) => ({
              index: i,
              exists,
              url: imageUrl,
            }))
          );
        }

        // 모든 확인 작업 완료 대기
        const results = await Promise.all(checkPromises);
        
        // 연속된 이미지만 추가 (중간에 없는 이미지가 있으면 중단)
        for (const result of results) {
          if (result.exists) {
            additionalUrls.push(result.url);
          } else {
            // 연속되지 않는 이미지가 있으면 중단
            break;
          }
        }

        // 추가 이미지들이 있으면 전체 URL 배열 업데이트
        if (additionalUrls.length > 0) {
          const allUrls = [firstImageUrl, ...additionalUrls];
          setImageUrls(allUrls);

          // 인디케이터 표시 (이미지가 2개 이상인 경우)
          setShowIndicators(true);

          // 추가 이미지들을 백그라운드에서 병렬로 미리 로딩
          // 첫 번째 이미지는 이미 로딩 중이므로 제외
          preloadAllImages(additionalUrls).catch((error) => {
            console.log("추가 이미지 미리 로딩 중 일부 실패:", error);
          });
        }
      })().catch((error) => {
        console.log("추가 이미지 확인 중 오류:", error);
        // 에러가 발생해도 첫 번째 이미지는 이미 표시되었으므로 로딩 상태 해제
        setImageLoading(false);
      });
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

  const nextImage = useCallback(() => {
    if (imageUrls.length > 1) {
      const newIndex =
        currentImageIndex < imageUrls.length - 1 ? currentImageIndex + 1 : 0;

      // 다음 이미지가 미리 로딩되었는지 확인
      const nextImageUrl = imageUrls[newIndex];
      if (preloadedImages.has(nextImageUrl)) {
        // 인덱스만 변경 (gestureX 리셋은 호출하는 쪽에서 처리)
        setCurrentImageIndex(newIndex);
      } else {
        // 미리 로딩되지 않은 경우 즉시 로딩
        preloadImage(nextImageUrl).then(() => {
          setCurrentImageIndex(newIndex);
        });
      }
    }
  }, [imageUrls, currentImageIndex, preloadedImages, preloadImage]);

  const prevImage = useCallback(() => {
    if (imageUrls.length > 1) {
      const newIndex =
        currentImageIndex > 0 ? currentImageIndex - 1 : imageUrls.length - 1;

      // 이전 이미지가 미리 로딩되었는지 확인
      const prevImageUrl = imageUrls[newIndex];
      if (preloadedImages.has(prevImageUrl)) {
        // 인덱스만 변경 (gestureX 리셋은 호출하는 쪽에서 처리)
        setCurrentImageIndex(newIndex);
      } else {
        // 미리 로딩되지 않은 경우 즉시 로딩
        preloadImage(prevImageUrl).then(() => {
          setCurrentImageIndex(newIndex);
        });
      }
    }
  }, [imageUrls, currentImageIndex, preloadedImages, preloadImage]);

  const goToImage = useCallback(
    (index: number) => {
    if (index >= 0 && index < imageUrls.length) {
      const targetImageUrl = imageUrls[index];
      if (preloadedImages.has(targetImageUrl)) {
          gestureX.setValue(0);
        setCurrentImageIndex(index);
      } else {
        // 미리 로딩되지 않은 경우 즉시 로딩
        preloadImage(targetImageUrl).then(() => {
            gestureX.setValue(0);
          setCurrentImageIndex(index);
        });
      }
    }
    },
    [imageUrls, preloadedImages, preloadImage, gestureX]
  );

  // 다음/이전 이미지 인덱스 계산
  const nextIndex =
    imageUrls.length > 1 && currentImageIndex < imageUrls.length - 1
      ? currentImageIndex + 1
      : currentImageIndex;
  const prevIndex =
    imageUrls.length > 1 && currentImageIndex > 0
      ? currentImageIndex - 1
      : currentImageIndex;

  // 다음 이미지 위치 계산 (왼쪽으로 스와이프할 때 오른쪽에서 나타남)
  const nextImageTranslateX = Animated.add(gestureX, screenWidthValue);

  // 이전 이미지 위치 계산 (오른쪽으로 스와이프할 때 왼쪽에서 나타남)
  const negativeScreenWidth = useRef(new Animated.Value(-screenWidth)).current;
  const prevImageTranslateX = Animated.add(gestureX, negativeScreenWidth);

  // 스와이프 제스처 핸들러 - 실시간 업데이트
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: gestureX } }],
    { useNativeDriver: true }
  );

  // 스와이프 종료 핸들러
  const onHandlerStateChange = useCallback(
    (event: any) => {
    const { translationX, state } = event.nativeEvent;

      if (state === State.BEGAN) {
        // 제스처 시작 시 gestureX를 리셋하여 깜빡임 방지
        gestureX.setValue(0);
      }
    
    if (state === State.END) {
      const threshold = 50; // 스와이프 임계값
      
        if (translationX > threshold && currentImageIndex > 0) {
        // 오른쪽으로 스와이프 - 이전 이미지
          Animated.timing(gestureX, {
            toValue: screenWidth,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // 인덱스 변경과 동시에 gestureX를 리셋하되, 이미지가 보이지 않도록 처리
            const newIndex =
              currentImageIndex > 0
                ? currentImageIndex - 1
                : imageUrls.length - 1;
            // 인덱스를 먼저 변경
            setCurrentImageIndex(newIndex);
            // 다음 프레임에서 gestureX 리셋 (인덱스 변경 후 리셋하여 깜빡임 방지)
            setTimeout(() => {
              gestureX.setValue(0);
            }, 0);
          });
        } else if (
          translationX < -threshold &&
          currentImageIndex < imageUrls.length - 1
        ) {
        // 왼쪽으로 스와이프 - 다음 이미지
          Animated.timing(gestureX, {
            toValue: -screenWidth,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // 인덱스 변경과 동시에 gestureX를 리셋하되, 이미지가 보이지 않도록 처리
            const newIndex =
              currentImageIndex < imageUrls.length - 1
                ? currentImageIndex + 1
                : 0;
            // 인덱스를 먼저 변경
            setCurrentImageIndex(newIndex);
            // 다음 프레임에서 gestureX 리셋 (인덱스 변경 후 리셋하여 깜빡임 방지)
            setTimeout(() => {
              gestureX.setValue(0);
            }, 0);
          });
        } else {
          // 임계값 미만이면 원래 위치로 복귀
          Animated.spring(gestureX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        }
      }
    },
    [currentImageIndex, imageUrls.length, gestureX]
  );

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
                <PanGestureHandler
                  onGestureEvent={onGestureEvent}
                  onHandlerStateChange={onHandlerStateChange}
                  minPointers={1}
                  maxPointers={1}
                  activeOffsetX={[-10, 10]}
                >
                  <Animated.View
                    style={{
                      flex: 1,
                      width: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                      overflow: "hidden",
                    }}
                  >
                    {/* 이전 이미지 (오른쪽으로 스와이프할 때) */}
                    {imageUrls.length > 1 && currentImageIndex > 0 && (
                      <Animated.View
                        style={{
                          position: "absolute",
                          width: "85%",
                          height: "85%",
                          maxWidth: 280,
                          maxHeight: 220,
                          justifyContent: "center",
                          alignItems: "center",
                          transform: [{ translateX: prevImageTranslateX }],
                        }}
                  >
                    <Image
                          source={{ uri: imageUrls[prevIndex] }}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                          contentFit="contain"
                          placeholder="🖼️"
                          placeholderContentFit="contain"
                          priority="normal"
                          cachePolicy="memory-disk"
                          allowDownscaling={true}
                        />
                      </Animated.View>
                    )}

                    {/* 현재 이미지 */}
                    <Animated.View
                      style={{
                        width: "85%",
                        height: "85%",
                        maxWidth: 280,
                        maxHeight: 220,
                        justifyContent: "center",
                        alignItems: "center",
                        transform: [{ translateX: gestureX }],
                      }}
                    >
                      <TouchableOpacity
                        style={{
                          width: "100%",
                          height: "100%",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        onPress={nextImage}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{ uri: imageUrls[currentImageIndex] }}
                          style={{
                            width: "100%",
                            height: "100%",
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
                          transition={0}
                      allowDownscaling={true}
                          recyclingKey={imageUrls[currentImageIndex]}
                    />
                  </TouchableOpacity>
                    </Animated.View>

                    {/* 다음 이미지 (왼쪽으로 스와이프할 때) */}
                    {imageUrls.length > 1 &&
                      currentImageIndex < imageUrls.length - 1 && (
                        <Animated.View
                          style={{
                            position: "absolute",
                            width: "85%",
                            height: "85%",
                            maxWidth: 280,
                            maxHeight: 220,
                            justifyContent: "center",
                            alignItems: "center",
                            transform: [{ translateX: nextImageTranslateX }],
                          }}
                        >
                          <Image
                            source={{ uri: imageUrls[nextIndex] }}
                            style={{
                              width: "100%",
                              height: "100%",
                            }}
                            contentFit="contain"
                            placeholder="🖼️"
                            placeholderContentFit="contain"
                            priority="normal"
                            cachePolicy="memory-disk"
                            allowDownscaling={true}
                          />
                        </Animated.View>
                      )}
                  </Animated.View>
                </PanGestureHandler>

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
                    <ShimmerSkeleton
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                    />
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

          {/* 하단 여백 */}
          <YStack height={60} />
        </YStack>
      </ScrollView>
    </View>
  );
}
