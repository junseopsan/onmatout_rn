import { Image } from "expo-image";
import React from "react";
import { Button, Card, Text, XStack, YStack } from "tamagui";
import { COLORS } from "../constants/Colors";
import { CATEGORIES } from "../constants/categories";
import { Asana } from "../lib/api/asanas";
import { AsanaCategory } from "../types/asana";

interface AsanaCardProps {
  asana: Asana;
  onPress: (asana: Asana) => void;
}

export function AsanaCard({ asana, onPress }: AsanaCardProps) {
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
      <YStack height={160} backgroundColor="#9A9A9A">
        {asana.image_number ? (
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            backgroundColor="#AAAAAA"
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
      </YStack>

      {/* 내용 영역 */}
      <YStack padding="$3" paddingTop="$3.5">
        {/* 한국어 이름과 카테고리를 한 행에 배치 */}
        <XStack
          justifyContent="space-between"
          alignItems="center"
          marginBottom="$1"
        >
          <Text
            fontSize={16}
            fontWeight="bold"
            color="$text"
            flex={1}
            marginRight="$2"
            numberOfLines={1}
          >
            {asana.sanskrit_name_kr}
          </Text>

          {/* 카테고리 배지를 우측 끝에 배치 */}
          <Button
            backgroundColor={categoryInfo.color}
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$5"
            marginLeft="$2"
            disabled
            height="auto"
            minHeight={24}
          >
            <Text fontSize={11} fontWeight="bold" color="white">
              {categoryInfo.label}
            </Text>
          </Button>
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
