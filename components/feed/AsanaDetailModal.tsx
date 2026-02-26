import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  ScrollView as RNScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { COLORS } from "../../constants/Colors";
import { CATEGORIES } from "../../constants/categories";
import { Asana } from "../../lib/api/asanas";
import { getAsanaThumbnailSource } from "../../lib/asanaImages";
import { ASANA_DETAIL_IMAGES } from "../../app/asanas/detailImages";

const { width: screenWidth } = Dimensions.get("window");
const modalMaxWidth = Math.min(screenWidth - 48, 400);
const modalContentWidth = modalMaxWidth - 40;
const modalImageHeight = Math.min(modalContentWidth * 0.85, 260);

interface AsanaDetailModalProps {
  visible: boolean;
  onClose: () => void;
  asana: Asana | null;
}

function getLevelText(level: string) {
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
}

function getCategoryLabel(categoryNameEn: string) {
  const category = CATEGORIES[categoryNameEn as keyof typeof CATEGORIES];
  return category?.label ?? categoryNameEn;
}

export default function AsanaDetailModal({
  visible,
  onClose,
  asana,
}: AsanaDetailModalProps) {
  const imageScrollRef = useRef<RNScrollView>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 팝업 열릴 때마다 첫 번째 사진으로 초기화
  useEffect(() => {
    if (visible && asana) {
      setCurrentImageIndex(0);
      setTimeout(() => {
        imageScrollRef.current?.scrollTo({ x: 0, animated: false });
      }, 0);
    }
  }, [visible, asana?.id]);

  if (!asana) return null;

  const key = asana.image_number?.padStart(3, "0") ?? "";
  const localImages = key ? ASANA_DETAIL_IMAGES[key] : undefined;
  const hasLocalImages = localImages && localImages.length > 0;

  const fallbackImageSource = getAsanaThumbnailSource(asana.image_number);

  const categoryLabel =
    asana.category_name_en &&
    asana.category_name_en !== "nan" &&
    asana.category_name_en !== "" &&
    asana.category_name_en !== null
      ? getCategoryLabel(asana.category_name_en)
      : null;

  const categoryColor = categoryLabel
    ? CATEGORIES[asana.category_name_en as keyof typeof CATEGORIES]?.color ??
      COLORS.textSecondary
    : COLORS.textSecondary;

  const updateIndex = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / modalContentWidth);
    const clamped = Math.max(
      0,
      Math.min(index, localImages ? localImages.length - 1 : 0)
    );
    setCurrentImageIndex(clamped);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalBox}>
          {/* 헤더: 닫기만 */}
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close-circle" size={28} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* 이미지 영역: 아사나 상세와 동일하게 가로 ScrollView만 터치 처리 */}
          <View style={styles.imageSection} pointerEvents="box-none">
            <View style={styles.imageWrapper} pointerEvents="box-none">
              {hasLocalImages && localImages.length > 1 ? (
                <GHScrollView
                  ref={imageScrollRef as any}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={updateIndex}
                  nestedScrollEnabled={Platform.OS === "android"}
                  style={styles.imageScroll}
                  contentContainerStyle={styles.imageScrollContent}
                >
                  {localImages.map((source, index) => (
                    <View key={index} style={styles.slidePage}>
                      <Image
                        source={source}
                        style={styles.mainImage}
                        contentFit="contain"
                      />
                    </View>
                  ))}
                </GHScrollView>
              ) : hasLocalImages && localImages.length === 1 ? (
                <Image
                  source={localImages[0]}
                  style={styles.mainImage}
                  contentFit="contain"
                />
              ) : fallbackImageSource ? (
                <Image
                  source={fallbackImageSource}
                  style={styles.mainImage}
                  contentFit="contain"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.placeholderEmoji}>🧘</Text>
                </View>
              )}
              {categoryLabel && (
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: categoryColor },
                  ]}
                >
                  <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
                </View>
              )}
            </View>
            {hasLocalImages && localImages.length > 1 && (
              <View style={styles.dotsRow}>
                {localImages.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      currentImageIndex === index && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* 텍스트 영역만 세로 스크롤 */}
          <RNScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 이름·난이도 */}
            <View style={styles.titleRow}>
              <Text style={styles.nameKr} numberOfLines={1}>
                {asana.sanskrit_name_kr || "아사나"}
              </Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>
                  {getLevelText(asana.level || "1")}
                </Text>
              </View>
            </View>
            <Text style={styles.nameEn} numberOfLines={1}>
              {asana.sanskrit_name_en || ""}
            </Text>

            {/* 카테고리 */}
            {categoryLabel && (
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>카테고리</Text>
                <Text style={styles.infoValue}>{categoryLabel}</Text>
              </View>
            )}

            {/* 아사나 의미 */}
            {asana.asana_meaning && (
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>아사나 의미</Text>
                <Text style={styles.infoValue}>{asana.asana_meaning}</Text>
              </View>
            )}

            {/* 효과 */}
            {asana.effect && (
              <View style={styles.infoBlock}>
                <Text style={styles.effectTitle}>효과</Text>
                <Text style={styles.effectText}>{asana.effect}</Text>
              </View>
            )}

            <View style={styles.bottomSpacer} />
          </RNScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    width: "100%",
    maxWidth: modalMaxWidth,
    height: "85%",
    maxHeight: "85%",
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 44,
  },
  headerSpacer: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  scroll: {
    flex: 1,
    maxHeight: 400,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 24,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageWrapper: {
    height: modalImageHeight,
    width: modalContentWidth,
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  imageScroll: {
    width: modalContentWidth,
    height: modalImageHeight,
  },
  imageScrollContent: {},
  slidePage: {
    width: modalContentWidth,
    height: modalImageHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  dotActive: {
    backgroundColor: COLORS.primary,
  },
  mainImage: {
    width: "85%",
    height: "85%",
  },
  imagePlaceholder: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  categoryBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomRightRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  nameKr: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    flex: 1,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.text,
  },
  levelText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },
  nameEn: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    marginBottom: 16,
  },
  infoBlock: {
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  effectTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  effectText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 20,
  },
});
