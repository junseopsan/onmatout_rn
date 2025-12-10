import { Image } from "expo-image";
import React, { useEffect, useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Button, Card, Text, XStack, YStack } from "tamagui";
import { COLORS } from "../constants/Colors";
import { CATEGORIES } from "../constants/categories";
import { Asana, asanasAPI } from "../lib/api/asanas";
import { AsanaCategory } from "../types/asana";

// 로컬 썸네일 매핑 (001 ~ 182)
export const ASANA_THUMBNAILS: Record<string, any> = {
  "001": require("../assets/images/asanas/thumbnail/001.png"),
  "002": require("../assets/images/asanas/thumbnail/002.png"),
  "003": require("../assets/images/asanas/thumbnail/003.png"),
  "004": require("../assets/images/asanas/thumbnail/004.png"),
  "005": require("../assets/images/asanas/thumbnail/005.png"),
  "006": require("../assets/images/asanas/thumbnail/006.png"),
  "007": require("../assets/images/asanas/thumbnail/007.png"),
  "008": require("../assets/images/asanas/thumbnail/008.png"),
  "009": require("../assets/images/asanas/thumbnail/009.png"),
  "010": require("../assets/images/asanas/thumbnail/010.png"),
  "011": require("../assets/images/asanas/thumbnail/011.png"),
  "012": require("../assets/images/asanas/thumbnail/012.png"),
  "013": require("../assets/images/asanas/thumbnail/013.png"),
  "014": require("../assets/images/asanas/thumbnail/014.png"),
  "015": require("../assets/images/asanas/thumbnail/015.png"),
  "016": require("../assets/images/asanas/thumbnail/016.png"),
  "017": require("../assets/images/asanas/thumbnail/017.png"),
  "018": require("../assets/images/asanas/thumbnail/018.png"),
  "019": require("../assets/images/asanas/thumbnail/019.png"),
  "020": require("../assets/images/asanas/thumbnail/020.png"),
  "021": require("../assets/images/asanas/thumbnail/021.png"),
  "022": require("../assets/images/asanas/thumbnail/022.png"),
  "023": require("../assets/images/asanas/thumbnail/023.png"),
  "024": require("../assets/images/asanas/thumbnail/024.png"),
  "025": require("../assets/images/asanas/thumbnail/025.png"),
  "026": require("../assets/images/asanas/thumbnail/026.png"),
  "027": require("../assets/images/asanas/thumbnail/027.png"),
  "028": require("../assets/images/asanas/thumbnail/028.png"),
  "029": require("../assets/images/asanas/thumbnail/029.png"),
  "030": require("../assets/images/asanas/thumbnail/030.png"),
  "031": require("../assets/images/asanas/thumbnail/031.png"),
  "032": require("../assets/images/asanas/thumbnail/032.png"),
  "033": require("../assets/images/asanas/thumbnail/033.png"),
  "034": require("../assets/images/asanas/thumbnail/034.png"),
  "035": require("../assets/images/asanas/thumbnail/035.png"),
  "036": require("../assets/images/asanas/thumbnail/036.png"),
  "037": require("../assets/images/asanas/thumbnail/037.png"),
  "038": require("../assets/images/asanas/thumbnail/038.png"),
  "039": require("../assets/images/asanas/thumbnail/039.png"),
  "040": require("../assets/images/asanas/thumbnail/040.png"),
  "041": require("../assets/images/asanas/thumbnail/041.png"),
  "042": require("../assets/images/asanas/thumbnail/042.png"),
  "043": require("../assets/images/asanas/thumbnail/043.png"),
  "044": require("../assets/images/asanas/thumbnail/044.png"),
  "045": require("../assets/images/asanas/thumbnail/045.png"),
  "046": require("../assets/images/asanas/thumbnail/046.png"),
  "047": require("../assets/images/asanas/thumbnail/047.png"),
  "048": require("../assets/images/asanas/thumbnail/048.png"),
  "049": require("../assets/images/asanas/thumbnail/049.png"),
  "050": require("../assets/images/asanas/thumbnail/050.png"),
  "051": require("../assets/images/asanas/thumbnail/051.png"),
  "052": require("../assets/images/asanas/thumbnail/052.png"),
  "053": require("../assets/images/asanas/thumbnail/053.png"),
  "054": require("../assets/images/asanas/thumbnail/054.png"),
  "055": require("../assets/images/asanas/thumbnail/055.png"),
  "056": require("../assets/images/asanas/thumbnail/056.png"),
  "057": require("../assets/images/asanas/thumbnail/057.png"),
  "058": require("../assets/images/asanas/thumbnail/058.png"),
  "059": require("../assets/images/asanas/thumbnail/059.png"),
  "060": require("../assets/images/asanas/thumbnail/060.png"),
  "061": require("../assets/images/asanas/thumbnail/061.png"),
  "062": require("../assets/images/asanas/thumbnail/062.png"),
  "063": require("../assets/images/asanas/thumbnail/063.png"),
  "064": require("../assets/images/asanas/thumbnail/064.png"),
  "065": require("../assets/images/asanas/thumbnail/065.png"),
  "066": require("../assets/images/asanas/thumbnail/066.png"),
  "067": require("../assets/images/asanas/thumbnail/067.png"),
  "068": require("../assets/images/asanas/thumbnail/068.png"),
  "069": require("../assets/images/asanas/thumbnail/069.png"),
  "070": require("../assets/images/asanas/thumbnail/070.png"),
  "071": require("../assets/images/asanas/thumbnail/071.png"),
  "072": require("../assets/images/asanas/thumbnail/072.png"),
  "073": require("../assets/images/asanas/thumbnail/073.png"),
  "074": require("../assets/images/asanas/thumbnail/074.png"),
  "075": require("../assets/images/asanas/thumbnail/075.png"),
  "076": require("../assets/images/asanas/thumbnail/076.png"),
  "077": require("../assets/images/asanas/thumbnail/077.png"),
  "078": require("../assets/images/asanas/thumbnail/078.png"),
  "079": require("../assets/images/asanas/thumbnail/079.png"),
  "080": require("../assets/images/asanas/thumbnail/080.png"),
  "081": require("../assets/images/asanas/thumbnail/081.png"),
  "082": require("../assets/images/asanas/thumbnail/082.png"),
  "083": require("../assets/images/asanas/thumbnail/083.png"),
  "084": require("../assets/images/asanas/thumbnail/084.png"),
  "085": require("../assets/images/asanas/thumbnail/085.png"),
  "086": require("../assets/images/asanas/thumbnail/086.png"),
  "087": require("../assets/images/asanas/thumbnail/087.png"),
  "088": require("../assets/images/asanas/thumbnail/088.png"),
  "089": require("../assets/images/asanas/thumbnail/089.png"),
  "090": require("../assets/images/asanas/thumbnail/090.png"),
  "091": require("../assets/images/asanas/thumbnail/091.png"),
  "092": require("../assets/images/asanas/thumbnail/092.png"),
  "093": require("../assets/images/asanas/thumbnail/093.png"),
  "094": require("../assets/images/asanas/thumbnail/094.png"),
  "095": require("../assets/images/asanas/thumbnail/095.png"),
  "096": require("../assets/images/asanas/thumbnail/096.png"),
  "097": require("../assets/images/asanas/thumbnail/097.png"),
  "098": require("../assets/images/asanas/thumbnail/098.png"),
  "099": require("../assets/images/asanas/thumbnail/099.png"),
  "100": require("../assets/images/asanas/thumbnail/100.png"),
  "101": require("../assets/images/asanas/thumbnail/101.png"),
  "102": require("../assets/images/asanas/thumbnail/102.png"),
  "103": require("../assets/images/asanas/thumbnail/103.png"),
  "104": require("../assets/images/asanas/thumbnail/104.png"),
  "105": require("../assets/images/asanas/thumbnail/105.png"),
  "106": require("../assets/images/asanas/thumbnail/106.png"),
  "107": require("../assets/images/asanas/thumbnail/107.png"),
  "108": require("../assets/images/asanas/thumbnail/108.png"),
  "109": require("../assets/images/asanas/thumbnail/109.png"),
  "110": require("../assets/images/asanas/thumbnail/110.png"),
  "111": require("../assets/images/asanas/thumbnail/111.png"),
  "112": require("../assets/images/asanas/thumbnail/112.png"),
  "113": require("../assets/images/asanas/thumbnail/113.png"),
  "114": require("../assets/images/asanas/thumbnail/114.png"),
  "115": require("../assets/images/asanas/thumbnail/115.png"),
  "116": require("../assets/images/asanas/thumbnail/116.png"),
  "117": require("../assets/images/asanas/thumbnail/117.png"),
  "118": require("../assets/images/asanas/thumbnail/118.png"),
  "119": require("../assets/images/asanas/thumbnail/119.png"),
  "120": require("../assets/images/asanas/thumbnail/120.png"),
  "121": require("../assets/images/asanas/thumbnail/121.png"),
  "122": require("../assets/images/asanas/thumbnail/122.png"),
  "123": require("../assets/images/asanas/thumbnail/123.png"),
  "124": require("../assets/images/asanas/thumbnail/124.png"),
  "125": require("../assets/images/asanas/thumbnail/125.png"),
  "126": require("../assets/images/asanas/thumbnail/126.png"),
  "127": require("../assets/images/asanas/thumbnail/127.png"),
  "128": require("../assets/images/asanas/thumbnail/128.png"),
  "129": require("../assets/images/asanas/thumbnail/129.png"),
  "130": require("../assets/images/asanas/thumbnail/130.png"),
  "131": require("../assets/images/asanas/thumbnail/131.png"),
  "132": require("../assets/images/asanas/thumbnail/132.png"),
  "133": require("../assets/images/asanas/thumbnail/133.png"),
  "134": require("../assets/images/asanas/thumbnail/134.png"),
  "135": require("../assets/images/asanas/thumbnail/135.png"),
  "136": require("../assets/images/asanas/thumbnail/136.png"),
  "137": require("../assets/images/asanas/thumbnail/137.png"),
  "138": require("../assets/images/asanas/thumbnail/138.png"),
  "139": require("../assets/images/asanas/thumbnail/139.png"),
  "140": require("../assets/images/asanas/thumbnail/140.png"),
  "141": require("../assets/images/asanas/thumbnail/141.png"),
  "142": require("../assets/images/asanas/thumbnail/142.png"),
  "143": require("../assets/images/asanas/thumbnail/143.png"),
  "144": require("../assets/images/asanas/thumbnail/144.png"),
  "145": require("../assets/images/asanas/thumbnail/145.png"),
  "146": require("../assets/images/asanas/thumbnail/146.png"),
  "147": require("../assets/images/asanas/thumbnail/147.png"),
  "148": require("../assets/images/asanas/thumbnail/148.png"),
  "149": require("../assets/images/asanas/thumbnail/149.png"),
  "150": require("../assets/images/asanas/thumbnail/150.png"),
  "151": require("../assets/images/asanas/thumbnail/151.png"),
  "152": require("../assets/images/asanas/thumbnail/152.png"),
  "153": require("../assets/images/asanas/thumbnail/153.png"),
  "154": require("../assets/images/asanas/thumbnail/154.png"),
  "155": require("../assets/images/asanas/thumbnail/155.png"),
  "156": require("../assets/images/asanas/thumbnail/156.png"),
  "157": require("../assets/images/asanas/thumbnail/157.png"),
  "158": require("../assets/images/asanas/thumbnail/158.png"),
  "159": require("../assets/images/asanas/thumbnail/159.png"),
  "160": require("../assets/images/asanas/thumbnail/160.png"),
  "161": require("../assets/images/asanas/thumbnail/161.png"),
  "162": require("../assets/images/asanas/thumbnail/162.png"),
  "163": require("../assets/images/asanas/thumbnail/163.png"),
  "164": require("../assets/images/asanas/thumbnail/164.png"),
  "165": require("../assets/images/asanas/thumbnail/165.png"),
  "166": require("../assets/images/asanas/thumbnail/166.png"),
  "167": require("../assets/images/asanas/thumbnail/167.png"),
  "168": require("../assets/images/asanas/thumbnail/168.png"),
  "169": require("../assets/images/asanas/thumbnail/169.png"),
  "170": require("../assets/images/asanas/thumbnail/170.png"),
  "171": require("../assets/images/asanas/thumbnail/171.png"),
  "172": require("../assets/images/asanas/thumbnail/172.png"),
  "173": require("../assets/images/asanas/thumbnail/173.png"),
  "174": require("../assets/images/asanas/thumbnail/174.png"),
  "175": require("../assets/images/asanas/thumbnail/175.png"),
  "176": require("../assets/images/asanas/thumbnail/176.png"),
  "177": require("../assets/images/asanas/thumbnail/177.png"),
  "178": require("../assets/images/asanas/thumbnail/178.png"),
  "179": require("../assets/images/asanas/thumbnail/179.png"),
  "180": require("../assets/images/asanas/thumbnail/180.png"),
  "181": require("../assets/images/asanas/thumbnail/181.png"),
  "182": require("../assets/images/asanas/thumbnail/182.png"),
};

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

    // 로컬 썸네일 소스 (image_number → assets 매핑)
    // image_number가 없거나 매핑이 없으면 null을 반환해서 "스켈레톤"을 표시
    const imageSource = useMemo(() => {
      if (!asana.image_number) {
        return null;
      }
      const formattedNumber = asana.image_number.padStart(3, "0");
      return ASANA_THUMBNAILS[formattedNumber] || null;
    }, [asana.image_number]);

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
