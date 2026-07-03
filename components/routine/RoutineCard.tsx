import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { getAsanaThumbnailSource } from "../../lib/asanaImages";
import { haptics } from "../../lib/haptics";
import { RoutineCommentsSheet } from "./RoutineCommentsSheet";

export type RoutineCardRoutine = {
  id: string;
  title: string;
  description?: string | null;
  created_at: string;
  teacher_id: string;
  visibility?: string | null;
  teacher_studio_name: string | null;
  creator_name?: string | null;
  like_count: number;
  liked_by_me: boolean;
  comment_count: number;
  preview: {
    order_index: number;
    asanas: {
      id: string;
      sanskrit_name_kr: string;
      image_number: string | null;
    } | null;
  }[];
};

interface RoutineCardProps {
  routine: RoutineCardRoutine;
  // 아사나 개수 — 호출부마다 데이터 형태가 달라 외부에서 계산해 전달.
  itemCount: number;
  currentUserId?: string;
  shared?: boolean;
  // 작성자 스튜디오명이 없을 때 보여줄 기본 라벨 ("선생님" / "내 시퀀스" 등)
  creatorFallback?: string;
  onPress: () => void;
  onToggleLike: (
    routineId: string,
    userId: string,
  ) => Promise<{ liked: boolean; like_count: number }>;
}

const PREVIEW_MAX = 5;

// 시퀀스 목록 카드 — 수련생/선생님 목록에서 공통으로 사용.
export function RoutineCard({
  routine,
  itemCount,
  currentUserId,
  shared = false,
  creatorFallback = "선생님",
  onPress,
  onToggleLike,
}: RoutineCardProps) {
  const previewItems = (routine.preview ?? [])
    .filter((p) => p.asanas)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .slice(0, PREVIEW_MAX);
  const remaining = Math.max(0, itemCount - previewItems.length);
  const hasItems = previewItems.length > 0;
  const isPublic = routine.visibility === "public";

  const [liked, setLiked] = useState(!!routine.liked_by_me);
  const [likeCount, setLikeCount] = useState(routine.like_count ?? 0);
  const [busyLike, setBusyLike] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(routine.comment_count ?? 0);

  const onToggleLikePress = async () => {
    if (!currentUserId || busyLike) return;
    setBusyLike(true);
    const prev = { liked, likeCount };
    setLiked(!liked);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      haptics.light();
      const res = await onToggleLike(routine.id, currentUserId);
      setLiked(res.liked);
      setLikeCount(res.like_count);
    } catch {
      setLiked(prev.liked);
      setLikeCount(prev.likeCount);
    } finally {
      setBusyLike(false);
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      <View style={styles.hero}>
        {isPublic ? (
          <View style={styles.publicBadgeRow}>
            <View style={styles.publicBadge}>
              <Text style={styles.publicBadgeText}>공개</Text>
            </View>
          </View>
        ) : null}
        {hasItems ? (
          <View style={styles.heroRow}>
            {previewItems.map((p, idx) => {
              const a = p.asanas!;
              const thumb = getAsanaThumbnailSource(a.image_number);
              return (
                <View key={`${a.id}-${idx}`} style={styles.heroThumb}>
                  {thumb ? (
                    <Image
                      source={thumb}
                      style={styles.heroImg}
                      contentFit="contain"
                    />
                  ) : (
                    <Text style={styles.heroFallback}>
                      {a.sanskrit_name_kr.charAt(0)}
                    </Text>
                  )}
                </View>
              );
            })}
            {remaining > 0 ? (
              <View style={[styles.heroThumb, styles.heroMore]}>
                <Text style={styles.heroMoreText}>+{remaining}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.heroEmpty}>
            <Ionicons name="leaf-outline" size={22} color="#9A7B5A" />
            <Text style={styles.heroEmptyText}>아사나 없음</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.creatorRow}>
          <Ionicons name="person-circle" size={16} color={COLORS.primary} />
          <Text style={styles.creatorText} numberOfLines={1}>
            {routine.teacher_studio_name ?? routine.creator_name ?? creatorFallback}
          </Text>
        </View>
        <View style={styles.titleRow}>
          {itemCount > 0 ? (
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>{itemCount}개의 아사나</Text>
            </View>
          ) : null}
          <Text style={[styles.title, { flexShrink: 1 }]} numberOfLines={1}>
            {routine.title}
          </Text>
          {shared ? (
            <View style={styles.sharedChip}>
              <Ionicons name="share-social" size={10} color={COLORS.info} />
              <Text style={styles.sharedChipText}>공유받음</Text>
            </View>
          ) : null}
        </View>
        {routine.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {routine.description}
          </Text>
        ) : null}
        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={onToggleLikePress}
            disabled={!currentUserId || busyLike}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.likeBtn}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={17}
              color={liked ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.likeText, liked && styles.likeTextActive]}>
              {likeCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCommentsOpen(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.commentStat}
          >
            <Ionicons
              name="chatbubble-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.commentStatText}>{commentCount}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <Text style={styles.dateBottomRight}>
            {routine.created_at.slice(0, 10)}
          </Text>
        </View>
      </View>

      <RoutineCommentsSheet
        visible={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        routineId={routine.id}
        currentUserId={currentUserId}
        ownerId={routine.teacher_id}
        onCountChange={setCommentCount}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    paddingBottom: 12,
  },
  hero: { position: "relative", marginBottom: 12 },
  heroRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  heroThumb: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 72,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImg: { width: "100%", height: "100%" },
  heroFallback: { color: "#2D2421", fontSize: 18, fontWeight: "800" },
  heroMore: {
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroMoreText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "800" },
  heroEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
  },
  heroEmptyText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700" },
  publicBadgeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  publicBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(139, 92, 246, 0.92)",
  },
  publicBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  body: { gap: 4 },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  creatorText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    maxWidth: 160,
  },
  creatorDivider: {
    width: 1,
    height: 10,
    backgroundColor: COLORS.border,
    marginHorizontal: 6,
  },
  metaText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "600" },
  countChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.45)",
    backgroundColor: "rgba(139, 92, 246, 0.14)",
  },
  countChipText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  sharedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(96, 165, 250, 0.16)",
  },
  sharedChipText: { color: COLORS.info, fontSize: 10, fontWeight: "800" },
  desc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  likeBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  likeText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700" },
  likeTextActive: { color: COLORS.primary },
  commentStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 14,
  },
  commentStatText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  dateBottomRight: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "right",
  },
});
