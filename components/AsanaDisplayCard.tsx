import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";
import { Button, Card, YStack } from "tamagui";
import { COLORS } from "../constants/Colors";
import { CATEGORIES } from "../constants/categories";
import { AsanaCategory } from "../types/asana";

interface AsanaDisplayCardProps {
  asana: {
    id?: string;
    sanskrit_name_kr: string;
    sanskrit_name_en: string;
    image_number?: string;
    category_name_en?: string;
  };
}

/**
 * 아사나 표시 전용 카드 컴포넌트
 * 피드 상세, 기록 상세 등에서 아사나를 표시할 때 사용
 */
export default function AsanaDisplayCard({ asana }: AsanaDisplayCardProps) {
  // 이미지 URL 생성
  const getImageUrl = (imageNumber?: string) => {
    if (!imageNumber) return null;
    const formattedNumber = imageNumber.padStart(3, "0");
    return `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/thumbnail/${formattedNumber}.png`;
  };

  // 카테고리 정보 가져오기
  const getCategoryInfo = (categoryName?: string) => {
    if (!categoryName) {
      return {
        label: "기타",
        color: COLORS.textSecondary,
      };
    }
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

  const imageUrl = getImageUrl(asana.image_number);
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
      width="48%"
    >
      {/* 이미지 영역 */}
      <YStack height={160} backgroundColor="#9A9A9A" position="relative">
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          backgroundColor="#FFFFFF"
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
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
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "white" }}>
              {categoryInfo.label}
            </Text>
          </Button>
        </View>
      </YStack>

      {/* 내용 영역 */}
      <YStack padding="$3" paddingTop="$1">
        {/* 한국어 이름 */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: "#FFFFFF",
            marginBottom: 4,
          }}
          numberOfLines={1}
        >
          {asana.sanskrit_name_kr}
        </Text>

        {/* 영어 이름 */}
        <Text
          style={{
            fontSize: 12,
            color: "#E0E0E0",
            fontStyle: "italic",
          }}
          numberOfLines={1}
        >
          {asana.sanskrit_name_en}
        </Text>
      </YStack>
    </Card>
  );
}

