import { Image } from "expo-image";
import React from "react";
import { Button, Card, Text, XStack, YStack } from "tamagui";
import { COLORS } from "../constants/Colors";
import { Asana } from "../lib/api/asanas";

interface AsanaCardProps {
  asana: Asana;
  onPress: (asana: Asana) => void;
}

export function AsanaCard({ asana, onPress }: AsanaCardProps) {
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

  const getImageUrl = (imageNumber: string) => {
    // image_number를 3자리 숫자로 포맷팅 (예: 1 -> 001)
    const formattedNumber = imageNumber.padStart(3, "0");
    return `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/thumbnail/${formattedNumber}.png`;
  };

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
      <YStack height={160} backgroundColor="#5A5A5A">
        {asana.image_number ? (
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            backgroundColor="#6A6A6A"
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
            backgroundColor="#5A5A5A"
          >
            <Text fontSize={28} fontWeight="bold" color="$textSecondary">
              이미지 없음
            </Text>
          </YStack>
        )}
      </YStack>

      {/* 내용 영역 */}
      <YStack padding="$3" paddingTop="$3.5">
        {/* 한국어 이름과 레벨을 한 행에 배치 */}
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

          {/* 레벨 배지를 우측 끝에 배치 */}
          <Button
            backgroundColor={getLevelColor(asana.level)}
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$5"
            marginLeft="$2"
            disabled
            height="auto"
            minHeight={24}
          >
            <Text fontSize={11} fontWeight="bold" color="white">
              {getLevelText(asana.level)}
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
