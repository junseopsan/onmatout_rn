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
import { FabButton } from "../../components/ui/FabButton";
import { ListSkeleton } from "../../components/ui/ListSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { haptics } from "../../lib/haptics";
import { teacherApi } from "../../lib/api/teacher";
import { studentRoutinesApi } from "../../lib/api/routines-student";
import { RootStackParamList } from "../../navigation/types";
import type { Routine } from "../../types/teacher";
import { getAsanaThumbnailSource } from "../../lib/asanaImages";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RoutineWithCount = Routine & {
  routine_items: { count: number }[];
  preview: {
    order_index: number;
    asanas: {
      id: string;
      sanskrit_name_kr: string;
      image_number: string | null;
    } | null;
  }[];
  teacher_studio_name: string | null;
  like_count: number;
  liked_by_me: boolean;
  is_draft: boolean;
};

type Tab = "all" | "mine" | "drafts";

// 공개 루틴(RoutineSummary) → 카드(RoutineWithCount) 형태로 정규화
function adaptPublic(r: any): RoutineWithCount {
  return {
    ...r,
    routine_items: [{ count: r.item_count ?? 0 }],
  } as RoutineWithCount;
}

export default function TeacherRoutineListScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [routines, setRoutines] = useState<RoutineWithCount[]>([]);
  const [publicRoutines, setPublicRoutines] = useState<RoutineWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("all");

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [mine, pub] = await Promise.all([
        teacherApi.listMyRoutines(user.id),
        studentRoutinesApi.listPublicRoutines(user.id),
      ]);
      setRoutines(mine as RoutineWithCount[]);
      setPublicRoutines(pub.map(adaptPublic));
    } catch (e) {
      console.warn("[RoutineList] failed", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const mineR = routines.filter((r) => !r.is_draft);
  const drafts = routines.filter((r) => r.is_draft);
  const data = tab === "all" ? publicRoutines : tab === "mine" ? mineR : drafts;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageHeader />

      {tab !== "drafts" ? (
        <View style={styles.tabsRow}>
          <SegmentTab
            label="전체"
            icon="earth"
            active={tab === "all"}
            onPress={() => {
              haptics.select();
              setTab("all");
            }}
          />
          <SegmentTab
            label={`내 시퀀스${mineR.length ? ` ${mineR.length}` : ""}`}
            icon="bookmark"
            active={tab === "mine"}
            onPress={() => {
              haptics.select();
              setTab("mine");
            }}
          />
          {drafts.length > 0 ? (
            <TouchableOpacity
              style={styles.draftAccess}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                haptics.select();
                setTab("drafts");
              }}
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.draftAccessText}>임시저장</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.draftHeader}
          activeOpacity={0.7}
          onPress={() => {
            haptics.select();
            setTab("mine");
          }}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          <Text style={styles.draftHeaderText}>임시저장 {drafts.length}</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ListSkeleton count={4} rowHeight={108} />
      ) : data.length === 0 ? (
        tab === "drafts" ? (
          <EmptyState
            icon="✍️"
            title="임시저장된 시퀀스가 없어요"
            description="만들기 도중 임시저장하면 여기에 보관돼요."
          />
        ) : tab === "all" ? (
          <EmptyState
            icon="🌿"
            title="공개된 시퀀스가 없어요"
            description="다른 선생님과 요가인들이 공개한 시퀀스가 여기에 모여요."
          />
        ) : (
          <EmptyState
            icon="📋"
            title="내 시퀀스가 없어요"
            description={
              "아사나를 순서대로 묶어 첫 시퀀스를 만들어 보세요.\n클래스 단위 또는 특정 수련생에게 공유할 수 있어요."
            }
            action={{
              label: "+ 시퀀스 만들기",
              onPress: () => navigation.navigate("TeacherRoutineCreate"),
            }}
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
              shared={tab === "mine" && r.teacher_id !== user?.id}
              delay={idx * 40}
              onPress={() =>
                tab === "drafts"
                  ? navigation.navigate("TeacherRoutineCreate", {
                      routineId: r.id,
                    })
                  : navigation.navigate("TeacherRoutineDetail", {
                      routineId: r.id,
                    })
              }
            />
          ))}
        </ScrollView>
      )}

      <FabButton
        label="시퀀스"
        onPress={() => navigation.navigate("TeacherRoutineCreate")}
        style={styles.fab}
      />
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
        size={13}
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
  routine: RoutineWithCount;
  onPress: () => void;
  currentUserId?: string;
  shared?: boolean;
  delay?: number;
}) {
  const count = routine.routine_items?.[0]?.count ?? 0;
  const isPublic = (routine as any).visibility === "public";
  const previewItems = (routine.preview ?? [])
    .filter((p) => p.asanas)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .slice(0, 5);
  const remaining = Math.max(0, count - previewItems.length);
  const hasItems = previewItems.length > 0;
  const [liked, setLiked] = useState(!!routine.liked_by_me);
  const [likeCount, setLikeCount] = useState(routine.like_count ?? 0);
  const [busyLike, setBusyLike] = useState(false);

  const onToggleLike = async () => {
    if (!currentUserId || busyLike) return;
    setBusyLike(true);
    const prev = { liked, likeCount };
    setLiked(!liked);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      haptics.light();
      const res = await teacherApi.toggleRoutineLike(routine.id, currentUserId);
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
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.card}
    >
      {/* 베이지 hero — 아사나 미리보기 */}
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

      {/* 본문 */}
      <View style={styles.body}>
        <View style={styles.creatorRow}>
          <Ionicons
            name="person-circle"
            size={16}
            color={COLORS.primary}
          />
          <Text style={styles.creatorText} numberOfLines={1}>
            {routine.teacher_studio_name ?? "내 시퀀스"}
          </Text>
          <View style={styles.creatorDivider} />
          <Ionicons name="layers-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.metaText}>
            {count > 0 ? `${count}개 아사나` : "아사나 없음"}
          </Text>
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
  fab: {
    position: "absolute",
    right: SPACING.lg,
    bottom: SPACING.lg + 8,
    opacity: 0.9,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  draftAccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
    paddingVertical: 6,
    paddingLeft: 8,
  },
  draftAccessText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  draftHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  draftHeaderText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  segmentTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 12,
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
  heroEmptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
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
  sharedChipText: {
    color: COLORS.info,
    fontSize: 10,
    fontWeight: "800",
  },
  desc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
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
  metaRow: { flexDirection: "row" }, // legacy unused
  metaItem: { flexDirection: "row" }, // legacy unused
  dotSep: { width: 2, height: 2 }, // legacy unused
  eyebrow: { ...TEXT.eyebrow, color: COLORS.textSecondary },
  cardTopRow: { flexDirection: "row" }, // legacy, unused
  cardTopRight: { flexDirection: "row" }, // legacy, unused
  dateText: { color: COLORS.textMuted, fontSize: 11 },
  previewRow: { flexDirection: "row" }, // legacy, unused
  previewThumb: { width: 36, height: 36 }, // legacy
  previewImg: { width: "100%", height: "100%" },
  previewFallback: { color: "#2D2421", fontSize: 16, fontWeight: "700" },
  previewMore: { backgroundColor: COLORS.surfaceDark },
  previewMoreText: { color: COLORS.textSecondary, fontSize: 11 },
  meta: { ...TEXT.micro, color: COLORS.textMuted, fontSize: 12 },
  publicChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.35)",
  },
  publicChipText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
