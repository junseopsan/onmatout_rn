import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/ui/EmptyState";
import { ListSkeleton } from "../../components/ui/ListSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { getAsanaThumbnailSource } from "../../lib/asanaImages";
import { haptics } from "../../lib/haptics";
import {
  studentRoutinesApi,
  type RoutineSummary,
} from "../../lib/api/routines-student";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Tab = "shared" | "discover";

export default function StudentRoutineListScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("discover");
  const [shared, setShared] = useState<RoutineSummary[]>([]);
  const [discover, setDiscover] = useState<RoutineSummary[]>([]);
  const [loadingShared, setLoadingShared] = useState(true);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([
        studentRoutinesApi.listSharedRoutines(user?.id),
        studentRoutinesApi.listPublicRoutines(user?.id),
      ]);
      setShared(s);
      setDiscover(d);
    } catch (e) {
      console.warn("[StudentRoutineList] failed", e);
    } finally {
      setLoadingShared(false);
      setLoadingDiscover(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const isLoading = tab === "shared" ? loadingShared : loadingDiscover;
  const data = tab === "shared" ? shared : discover;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageHeader />

      <View style={styles.tabsRow}>
        <SegmentTab
          label="전체"
          icon="earth"
          active={tab === "discover"}
          onPress={() => { haptics.select(); setTab("discover"); }}
        />
        <SegmentTab
          label={`내 시퀀스${shared.length ? ` ${shared.length}` : ""}`}
          icon="bookmark"
          active={tab === "shared"}
          onPress={() => { haptics.select(); setTab("shared"); }}
        />
      </View>

      {isLoading ? (
        <ListSkeleton count={4} rowHeight={108} />
      ) : data.length === 0 ? (
        tab === "shared" ? (
          <EmptyState
            icon="📥"
            title="내 시퀀스가 없어요"
            description={
              "선생님이 클래스 또는 회원에게 시퀀스를 보내면 여기에 모입니다.\n전체에서 공개 시퀀스를 둘러볼 수도 있어요."
            }
            action={{
              label: "전체 보기",
              onPress: () => setTab("discover"),
            }}
          />
        ) : (
          <EmptyState
            icon="🌱"
            title="아직 공개된 시퀀스가 없어요"
            description="다른 선생님과 요가인들이 곧 공유할 예정이에요."
          />
        )
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {data.map((r, idx) => (
            <RoutineCard
              key={r.id}
              routine={r}
              currentUserId={user?.id}
              shared={tab === "shared" && r.teacher_id !== user?.id}
              delay={idx * 40}
              onPress={() =>
                navigation.navigate("StudentRoutineDetail", { routineId: r.id })
              }
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SegmentTab({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.segmentTab, active && styles.segmentTabActive]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={active ? COLORS.white : COLORS.textSecondary}
      />
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function RoutineCard({
  routine,
  onPress,
  currentUserId,
  shared = false,
  delay = 0,
}: {
  routine: RoutineSummary;
  onPress: () => void;
  currentUserId?: string;
  shared?: boolean;
  delay?: number;
}) {
  const previewItems = (routine.preview ?? [])
    .filter((p) => p.asanas)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .slice(0, 5);
  const remaining = Math.max(0, routine.item_count - previewItems.length);
  const hasItems = previewItems.length > 0;
  const isPublic = (routine as any).visibility === "public";
  const [liked, setLiked] = useState(routine.liked_by_me);
  const [likeCount, setLikeCount] = useState(routine.like_count);
  const [busyLike, setBusyLike] = useState(false);

  const onToggleLike = async () => {
    if (!currentUserId || busyLike) return;
    setBusyLike(true);
    const prev = { liked, likeCount };
    setLiked(!liked);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      haptics.light();
      const res = await studentRoutinesApi.toggleRoutineLike(
        routine.id,
        currentUserId,
      );
      setLiked(res.liked);
      setLikeCount(res.like_count);
    } catch (e) {
      setLiked(prev.liked);
      setLikeCount(prev.likeCount);
    } finally {
      setBusyLike(false);
    }
  };
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.card}
    >
      <View style={styles.hero}>
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
        {isPublic ? (
          <View style={styles.publicBadge}>
            <Ionicons name="earth" size={10} color={COLORS.white} />
            <Text style={styles.publicBadgeText}>공개</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.creatorRow}>
          <Ionicons
            name="person-circle"
            size={16}
            color={COLORS.primary}
          />
          <Text style={styles.creatorText} numberOfLines={1}>
            {routine.teacher_studio_name ?? "선생님"}
          </Text>
          <View style={styles.creatorDivider} />
          <Ionicons name="layers-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{routine.item_count}개 아사나</Text>
        </View>
        <View style={styles.titleRow}>
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
            onPress={onToggleLike}
            disabled={!currentUserId || busyLike}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.likeBtn}
          >
            <Ionicons
              name={liked ? "sparkles" : "sparkles-outline"}
              size={14}
              color={liked ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.likeText, liked && styles.likeTextActive]}>
              옴 {likeCount}
            </Text>
          </TouchableOpacity>
          <Text style={styles.dateBottomRight}>
            {routine.created_at.slice(0, 10)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  tabsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  segmentTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  segmentText: {
    ...TEXT.captionMed,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  segmentTextActive: { color: COLORS.white, fontWeight: "700" as const },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  card: {
    marginBottom: SPACING.md,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    paddingBottom: 12,
  },
  hero: {
    position: "relative",
    marginBottom: 12,
  },
  heroRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
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
  heroMoreText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "800",
  },
  heroEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
  },
  heroEmptyText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700" },
  publicBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
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
  body: {
    gap: 4,
  },
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
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  metaText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "600" },
  metaTextDim: { color: COLORS.textMuted, fontSize: 11 },
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
  dateBottomRight: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "right",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  likeTextActive: { color: COLORS.primary },
});
