import { Image } from "expo-image";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/Colors";
import { CATEGORIES } from "../constants/categories";
import { Asana, asanasAPI } from "../lib/api/asanas";
import { getAsanaThumbnailSource } from "../lib/asanaImages";
import { haptics } from "../lib/haptics";
import { AsanaCategory } from "../types/asana";

interface AsanaCardProps {
  asana: Asana;
  onPress: (asana: Asana) => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (asanaId: string, isFavorite: boolean) => void;
  showFavoriteIndicator?: boolean;
  compact?: boolean;
  userId?: string;
}

// 시퀀스 빌더의 카드 디자인과 동일 — 따뜻한 베이지 카드 + 카테고리 pill + serif 한글 + uppercase 영문
export const AsanaCard = React.memo(
  function AsanaCard({
    asana,
    onPress,
    isFavorite = false,
    onFavoriteToggle,
    showFavoriteIndicator = true,
    userId,
  }: AsanaCardProps) {
    const [favorite, setFavorite] = useState(isFavorite);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      setFavorite(isFavorite);
    }, [isFavorite, asana.id]);

    const handleFavoriteToggle = async (e: any) => {
      e.stopPropagation();
      if (isLoading) return;
      haptics.light();
      setIsLoading(true);
      try {
        const result = await asanasAPI.toggleFavorite(asana.id, userId);
        if (result.success) {
          const next = !favorite;
          setFavorite(next);
          onFavoriteToggle?.(asana.id, next);
        }
      } catch (err) {
        console.error("즐겨찾기 토글 에러:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const imageSource = useMemo(
      () => getAsanaThumbnailSource(asana.image_number),
      [asana.image_number],
    );

    const categoryInfo = useMemo(() => {
      const c = CATEGORIES[asana.category_name_en as AsanaCategory];
      if (c) return { label: c.label, color: c.color };
      return { label: "기타", color: COLORS.textSecondary };
    }, [asana.category_name_en]);

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
        onPress={() => onPress(asana)}
      >
        {/* 카테고리 pill */}
        <View
          style={[
            styles.catBadge,
            // 80% alpha — 살짝 비치는 톤
            { backgroundColor: `${categoryInfo.color}CC` },
          ]}
        >
          <Text style={styles.catBadgeText} numberOfLines={1}>
            {categoryInfo.label}
          </Text>
        </View>

        {/* 즐겨찾기 하트 */}
        {showFavoriteIndicator && onFavoriteToggle ? (
          <TouchableOpacity
            style={styles.favBtn}
            onPress={handleFavoriteToggle}
            disabled={isLoading}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.favIcon, favorite && styles.favIconActive]}>
              {favorite ? "♥" : "♡"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* 이미지 */}
        <View style={styles.imageWrap}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.image}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={0}
            />
          ) : (
            <View style={styles.imageFallback}>
              <Text style={styles.imageFallbackText}>
                {asana.sanskrit_name_kr.charAt(0)}
              </Text>
            </View>
          )}
        </View>

        {/* 푸터 — 한글 (serif) + 영문 (uppercase) */}
        <View style={styles.footer}>
          <Text style={styles.name} numberOfLines={1}>
            {asana.sanskrit_name_kr}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {asana.sanskrit_name_en}
          </Text>
        </View>
      </Pressable>
    );
  },
  (prev, next) =>
    prev.asana.id === next.asana.id &&
    prev.isFavorite === next.isFavorite &&
    prev.asana.image_number === next.asana.image_number &&
    prev.asana.category_name_en === next.asana.category_name_en &&
    prev.asana.sanskrit_name_kr === next.asana.sanskrit_name_kr &&
    prev.asana.sanskrit_name_en === next.asana.sanskrit_name_en,
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F5F0E8", // 따뜻한 베이지 — 요가 매트 톤
    borderRadius: 20,
    overflow: "hidden",
    padding: 14,
    position: "relative",
    minHeight: 220,
  },
  catBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  catBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  favIcon: { fontSize: 18, color: "#B0A89D" },
  favIconActive: { color: "#EF4444" },
  imageWrap: {
    flex: 1,
    width: "100%",
    minHeight: 110,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  image: { width: "100%", height: "100%" },
  imageFallback: {
    width: "70%",
    height: "70%",
    borderRadius: 12,
    backgroundColor: "#E8DFD2",
    alignItems: "center",
    justifyContent: "center",
  },
  imageFallbackText: { color: "#7B6F65", fontSize: 32, fontWeight: "300" },
  footer: { alignItems: "center", paddingTop: 10 },
  name: {
    color: "#2D2421",
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "Georgia",
    textAlign: "center",
  },
  sub: {
    color: "#7B6F65",
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontWeight: "600",
    textAlign: "center",
  },
});
