import { Image } from "expo-image";
import React, { useEffect, useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Button, Card, Text, XStack, YStack } from "tamagui";
import { COLORS } from "../constants/Colors";
import { CATEGORIES } from "../constants/categories";
import { getAsanaThumbnailSource } from "../lib/asanaImages";
import { Asana, asanasAPI } from "../lib/api/asanas";
import { AsanaCategory } from "../types/asana";

interface AsanaCardProps {
  asana: Asana;
  onPress: (asana: Asana) => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (asanaId: string, isFavorite: boolean) => void;
  showFavoriteIndicator?: boolean; // 즐겨찾기 표시 여부
  compact?: boolean; // 컴팩트 모드 (대시보드용)
  userId?: string; // 사용자 ID 추가
}

export const AsanaCard = React.memo(
  function AsanaCard({
    asana,
    onPress,
    isFavorite = false,
    onFavoriteToggle,
    showFavoriteIndicator = true,
    compact = false,
    userId,
  }: AsanaCardProps) {
    const [favorite, setFavorite] = useState(isFavorite);
    const [isLoading, setIsLoading] = useState(false);

    // 즐겨찾기 상태가 변경될 때 업데이트 (아사나 ID도 함께 확인)
    useEffect(() => {
      setFavorite(isFavorite);
    }, [isFavorite, asana.id]);

    const handleFavoriteToggle = async (e: any) => {
      e.stopPropagation(); // 카드 클릭 이벤트 전파 방지

      if (isLoading) return;

      console.log("즐겨찾기 토글 시작:", asana.id, "현재 상태:", favorite);
      setIsLoading(true);

      try {
        const result = await asanasAPI.toggleFavorite(asana.id, userId);
        console.log("즐겨찾기 API 결과:", result);

        if (result.success) {
          const newFavoriteState = !favorite;
          setFavorite(newFavoriteState);
          console.log("즐겨찾기 상태 변경:", newFavoriteState);
          onFavoriteToggle?.(asana.id, newFavoriteState);
        } else {
          console.error("즐겨찾기 토글 실패:", result.message);
        }
      } catch (error) {
        console.error("즐겨찾기 토글 에러:", error);
      } finally {
        setIsLoading(false);
      }
    };
    const getCategoryInfo = (categoryName: string) => {
      const category = CATEGORIES[categoryName as AsanaCategory];
      if (category) {
        return {
          label: category.label,
          color: category.color,
        };
      }
      return {
        label: "기타",
        color: COLORS.textSecondary,
      };
    };

    // 로컬 썸네일 소스 (lib/asanaImages, 001~183)
    const imageSource = useMemo(
      () => getAsanaThumbnailSource(asana.image_number),
      [asana.image_number]
    );

    const categoryInfo = useMemo(
      () => getCategoryInfo(asana.category_name_en),
      [asana.category_name_en]
    );

    return (
      <Card
        backgroundColor="#4A4A4A"
        borderRadius="$4"
        overflow="hidden"
        shadowColor="$shadow"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.1}
        shadowRadius={4}
        elevation={3}
        width="100%"
        pressStyle={{ opacity: 0.8 }}
        onPress={() => onPress(asana)}
      >
        {/* 이미지 영역 */}
        <YStack height={160} backgroundColor="#9A9A9A" position="relative">
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            backgroundColor="#FFFFFF"
          >
            {imageSource ? (
              <Image
                source={imageSource}
                style={{
                  width: "80%",
                  height: "80%",
                  maxWidth: 120,
                  maxHeight: 100,
                }}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={0}
              />
            ) : (
              // 아사나 이미지가 없을 때 표시할 스켈레톤 박스
              <View
                style={{
                  width: "70%",
                  height: "65%",
                  borderRadius: 12,
                  backgroundColor: "#E0E0E0",
                }}
              />
            )}
          </YStack>

          {/* 카테고리 배지를 이미지 영역 좌측 상단에 배치 */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <Button
              backgroundColor={categoryInfo.color}
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius={0}
              borderTopLeftRadius={0}
              borderTopRightRadius={0}
              borderBottomLeftRadius={0}
              borderBottomRightRadius={8}
              disabled
              height="auto"
              minHeight={24}
            >
              <Text fontSize={11} fontWeight="bold" color="white">
                {categoryInfo.label}
              </Text>
            </Button>
          </View>
        </YStack>

        {/* 내용 영역 */}
        <YStack padding="$3" paddingTop="$1">
          {/* 한국어 이름과 즐겨찾기 버튼을 한 행에 배치 */}
          <XStack
            justifyContent="space-between"
            alignItems="center"
            marginBottom="$1"
          >
            <Text
              fontSize={14}
              fontWeight="bold"
              color="$text"
              flex={1}
              marginRight="$2"
              numberOfLines={1}
            >
              {asana.sanskrit_name_kr}
            </Text>

            {/* 즐겨찾기 버튼을 우측 끝에 배치 */}
            {showFavoriteIndicator && onFavoriteToggle && (
              <TouchableOpacity
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "transparent",
                  justifyContent: "center",
                  alignItems: "center",
                  marginLeft: 8,
                }}
                onPress={handleFavoriteToggle}
                disabled={isLoading}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: favorite ? "#FF6B6B" : "#B0B0B0",
                  }}
                >
                  {favorite ? "♥" : "♡"}
                </Text>
              </TouchableOpacity>
            )}

            {/* 즐겨찾기 표시 (읽기 전용) */}
            {showFavoriteIndicator && !onFavoriteToggle && (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "transparent",
                  justifyContent: "center",
                  alignItems: "center",
                  marginLeft: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: "#FF6B6B",
                  }}
                >
                  ♥
                </Text>
              </View>
            )}
          </XStack>

          {/* 영어 이름은 별도 행에 배치 */}
          <Text
            fontSize={12}
            color="$textSecondary"
            fontStyle="italic"
            numberOfLines={1}
          >
            {asana.sanskrit_name_en}
          </Text>
        </YStack>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // 메모이제이션 비교 함수: 즐겨찾기 상태와 아사나 ID만 비교
    return (
      prevProps.asana.id === nextProps.asana.id &&
      prevProps.isFavorite === nextProps.isFavorite &&
      prevProps.asana.image_number === nextProps.asana.image_number &&
      prevProps.asana.category_name_en === nextProps.asana.category_name_en &&
      prevProps.asana.sanskrit_name_kr === nextProps.asana.sanskrit_name_kr &&
      prevProps.asana.sanskrit_name_en === nextProps.asana.sanskrit_name_en
    );
  }
);
