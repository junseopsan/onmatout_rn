import { Image } from "expo-image";
import React from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { CATEGORIES } from "../../constants/categories";
import { Asana } from "../../lib/api/asanas";
import { AsanaCategory } from "../../types/asana";

interface FavoriteAsanasModalProps {
  visible: boolean;
  onClose: () => void;
  favoriteAsanas: Asana[];
  onAsanaPress: (asana: Asana) => void;
}

export default function FavoriteAsanasModal({
  visible,
  onClose,
  favoriteAsanas,
  onAsanaPress,
}: FavoriteAsanasModalProps) {
  const screenWidth = Dimensions.get("window").width;

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

  const renderAsanaCard = ({ item }: { item: Asana }) => {
    const categoryInfo = getCategoryInfo(item.category_name_en);

    return (
      <TouchableOpacity
        style={styles.asanaCard}
        onPress={() => onAsanaPress(item)}
      >
        {/* 이미지 영역 */}
        <View style={styles.imageContainer}>
          {item.image_number ? (
            <Image
              source={{ uri: getImageUrl(item.image_number) }}
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
            {item.sanskrit_name_kr}
          </Text>
          <Text style={styles.englishName} numberOfLines={1}>
            {item.sanskrit_name_en}
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
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>즐겨찾기 아사나</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 아사나 목록 */}
        <FlatList
          data={favoriteAsanas}
          renderItem={renderAsanaCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.asanaRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* 빈 상태 */}
        {favoriteAsanas.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>💝</Text>
            <Text style={styles.emptyTitle}>즐겨찾기 아사나가 없어요</Text>
            <Text style={styles.emptyDescription}>
              아사나 탭에서 마음에 드는 아사나를 즐겨찾기 해보세요!
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceDark,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceDark,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 16,
  },
  asanaRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  asanaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: "48%",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
