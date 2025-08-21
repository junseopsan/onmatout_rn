import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { CATEGORIES } from "../../constants/categories";
import { Asana } from "../../lib/api/asanas";
import { AsanaCategory } from "../../types/asana";

interface FavoriteAsanaCardProps {
  asana: Asana;
  onPress: (asana: Asana) => void;
}

export default function FavoriteAsanaCard({
  asana,
  onPress,
}: FavoriteAsanaCardProps) {
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
    const formattedNumber = imageNumber.padStart(3, "0");
    return `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/thumbnail/${formattedNumber}.png`;
  };

  const categoryInfo = getCategoryInfo(asana.category_name_en);

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(asana)}>
      {/* 이미지 영역 */}
      <View style={styles.imageContainer}>
        {asana.image_number ? (
          <Image
            source={{ uri: getImageUrl(asana.image_number) }}
            style={styles.asanaImage}
            contentFit="contain"
            placeholder="🖼️"
            placeholderContentFit="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📝</Text>
          </View>
        )}

        {/* 즐겨찾기 표시 */}
        <View style={styles.favoriteIndicator}>
          <Text style={styles.favoriteIcon}>♥</Text>
        </View>
      </View>

      {/* 내용 영역 */}
      <View style={styles.content}>
        <Text style={styles.koreanName} numberOfLines={1}>
          {asana.sanskrit_name_kr}
        </Text>
        <Text style={styles.englishName} numberOfLines={1}>
          {asana.sanskrit_name_en}
        </Text>

        {/* 카테고리 배지 */}
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: categoryInfo.color },
          ]}
        >
          <Text style={styles.categoryText}>{categoryInfo.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 140,
  },
  imageContainer: {
    position: "relative",
    height: 120,
    backgroundColor: "#AAAAAA",
    justifyContent: "center",
    alignItems: "center",
  },
  asanaImage: {
    width: "80%",
    height: "80%",
    maxWidth: 80,
    maxHeight: 80,
  },
  imagePlaceholder: {
    width: "80%",
    height: "80%",
    maxWidth: 80,
    maxHeight: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#9A9A9A",
  },
  imagePlaceholderText: {
    fontSize: 24,
  },
  favoriteIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteIcon: {
    fontSize: 12,
    color: "#FF6B6B",
  },
  content: {
    padding: 12,
  },
  koreanName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  englishName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "white",
  },
});
