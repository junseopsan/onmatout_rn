import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Button, Card, Text, XStack, YStack } from "tamagui";
import { COLORS } from "../constants/Colors";
import { CATEGORIES } from "../constants/categories";
import { Asana, asanasAPI } from "../lib/api/asanas";
import { AsanaCategory } from "../types/asana";

interface AsanaCardProps {
  asana: Asana;
  onPress: (asana: Asana) => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (asanaId: string, isFavorite: boolean) => void;
  showFavoriteIndicator?: boolean; // 즐겨찾기 표시 여부
  compact?: boolean; // 컴팩트 모드 (대시보드용)
}

export function AsanaCard({
  asana,
  onPress,
  isFavorite = false,
  onFavoriteToggle,
  showFavoriteIndicator = true,
  compact = false,
}: AsanaCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [isLoading, setIsLoading] = useState(false);

  // 즐겨찾기 상태가 변경될 때 업데이트
  useEffect(() => {
    setFavorite(isFavorite);
  }, [isFavorite]);

  const handleFavoriteToggle = async (e: any) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지

    if (isLoading) return;

    setIsLoading(true);

    try {
      const result = await asanasAPI.toggleFavorite(asana.id);

      if (result.success) {
        const newFavoriteState = !favorite;
        setFavorite(newFavoriteState);
        onFavoriteToggle?.(asana.id, newFavoriteState);
      }
    } catch (error) {
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

  const getImageUrl = (imageNumber: string) => {
    // image_number를 3자리 숫자로 포맷팅 (예: 1 -> 001)
    const formattedNumber = imageNumber.padStart(3, "0");
    return `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/thumbnail/${formattedNumber}.png`;
  };

  const categoryInfo = getCategoryInfo(asana.category_name_en);

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
        {asana.image_number ? (
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            backgroundColor="#FFFFFF"
          >
            <Image
              source={{ uri: getImageUrl(asana.image_number) }}
              style={{
                width: "80%",
                height: "80%",
                maxWidth: 120,
                maxHeight: 100,
              }}
              contentFit="contain"
              placeholder="이미지 로딩 중..."
              placeholderContentFit="contain"
              onError={() => {
                console.log(`이미지 로딩 실패: ${asana.image_number}`);
              }}
            />
          </YStack>
        ) : (
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            backgroundColor="#9A9A9A"
          >
            <Text fontSize={28} fontWeight="bold" color="$textSecondary">
              이미지 없음
            </Text>
          </YStack>
        )}

        {/* 카테고리 배지를 이미지 영역 좌측 상단에 배치 */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Button
            backgroundColor={categoryInfo.color}
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius={0}
            borderTopLeftRadius={0}
            borderTopRightRadius={8}
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
}
