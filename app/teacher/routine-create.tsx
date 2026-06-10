import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { SearchBar } from "../../components/ui/SearchBar";
import { COLORS } from "../../constants/Colors";
import { CATEGORIES } from "../../constants/categories";
import { useAuth } from "../../hooks/useAuth";
import { useAllAsanasForFeed } from "../../hooks/useAsanas";
import { getAsanaThumbnailSource } from "../../lib/asanaImages";
import type { Asana } from "../../lib/api/asanas";
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";
import type { AsanaCategory } from "../../types/asana";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "TeacherRoutineCreate">;

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.round(SCREEN_W * 0.62);
const CARD_H = Math.round(CARD_W * 1.45);
const SLOT_SIZE = 82;
const SIDE_PAD = (SCREEN_W - CARD_W) / 2;

type HistoryEntry = { items: Asana[] };

export default function TeacherRoutineCreateScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const editRoutineId = route.params?.routineId ?? null;
  const { user } = useAuth();
  const { data: asanas = [], isLoading } = useAllAsanasForFeed();

  const [title, setTitle] = useState(editRoutineId ? "" : "새 시퀀스");
  const [items, setItems] = useState<Asana[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([{ items: [] }]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState<AsanaCategory | "ALL">(
    "ALL",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [centerIndex, setCenterIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(editRoutineId);

  // 편집 모드: 기존 시퀀스 로드해서 초기값으로 설정
  useEffect(() => {
    if (!editRoutineId) return;
    let mounted = true;
    (async () => {
      try {
        const { routine, items: rItems } =
          await teacherApi.getRoutine(editRoutineId);
        if (!mounted) return;
        setTitle(routine.title);
        const loaded: Asana[] = rItems.map((it: any) => ({
          ...(it.asanas as any),
        }));
        setItems(loaded);
        setHistory([{ items: loaded }]);
        setHistoryIdx(0);
      } catch (e) {
        console.warn("[routine-create] load existing failed", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [editRoutineId]);

  const listRef = useRef<FlatList<Asana>>(null);
  const slotsRef = useRef<ScrollView>(null);

  // 화면 진입 시점에 한 번 셔플 — 같은 세션에선 순서 고정(스크롤/필터 시 흔들리지 않게)
  const shuffledAsanas = useMemo(() => {
    const arr = [...asanas];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [asanas]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let pool = shuffledAsanas;
    if (activeCategory !== "ALL") {
      pool = pool.filter((a) => a.category_name_en === activeCategory);
    }
    if (q.length === 0) return pool;
    return pool.filter((a) => {
      const kr = (a.sanskrit_name_kr ?? "").toLowerCase();
      const en = (a.sanskrit_name_en ?? "").toLowerCase();
      return kr.includes(q) || en.includes(q);
    });
  }, [shuffledAsanas, activeCategory, searchQuery]);

  // Reset carousel when filter or search changes
  useEffect(() => {
    setCenterIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [activeCategory, searchQuery]);

  const pushHistory = useCallback(
    (next: Asana[]) => {
      const newHistory = history.slice(0, historyIdx + 1);
      newHistory.push({ items: next });
      setHistory(newHistory);
      setHistoryIdx(newHistory.length - 1);
    },
    [history, historyIdx],
  );

  const addAsana = useCallback(
    (a: Asana) => {
      const next = [...items, a];
      setItems(next);
      pushHistory(next);
      // Scroll slots to end
      setTimeout(() => {
        slotsRef.current?.scrollToEnd({ animated: true });
      }, 50);
    },
    [items, pushHistory],
  );

  const removeAt = useCallback(
    (idx: number) => {
      const next = items.filter((_, i) => i !== idx);
      setItems(next);
      pushHistory(next);
    },
    [items, pushHistory],
  );

  const undo = useCallback(() => {
    if (historyIdx === 0) return;
    const newIdx = historyIdx - 1;
    setHistoryIdx(newIdx);
    setItems(history[newIdx].items);
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    const newIdx = historyIdx + 1;
    setHistoryIdx(newIdx);
    setItems(history[newIdx].items);
  }, [history, historyIdx]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / (CARD_W + 12));
      if (idx !== centerIndex) setCenterIndex(idx);
    },
    [centerIndex],
  );

  const canSubmit = title.trim().length > 0 && items.length > 0 && !submitting;
  const canDraft = title.trim().length > 0 && !savingDraft && !submitting;

  // isDraft=true → 임시저장(목록 숨김), false → 발행(목록 노출)
  const persist = async (isDraft: boolean) => {
    if (!user?.id) throw new Error("로그인이 필요해요");
    const itemRows = items.map((a) => ({ asana_id: a.id }));
    if (draftId) {
      await teacherApi.updateRoutine(draftId, {
        title: title.trim(),
        is_draft: isDraft,
      });
      await teacherApi.replaceRoutineItems(draftId, itemRows);
      return draftId;
    }
    const created = await teacherApi.createRoutine(
      {
        teacher_id: user.id,
        title: title.trim(),
        description: null,
        visibility: "private",
        is_draft: isDraft,
      },
      itemRows,
    );
    setDraftId(created.id);
    return created.id;
  };

  const handleSaveDraft = async () => {
    if (!canDraft) return;
    setSavingDraft(true);
    try {
      await persist(true);
      Alert.alert("임시저장 완료", "임시저장함에 보관했어요. 목록에는 보이지 않아요.", [
        { text: "계속 편집", style: "cancel" },
        { text: "닫기", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert("임시저장 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSave = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const id = await persist(false);
      navigation.replace("TeacherRoutineDetail", { routineId: id });
    } catch (e: any) {
      Alert.alert("발행 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const centerAsana = filtered[centerIndex] ?? null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backGlyph}>‹</Text>
        </TouchableOpacity>

        <View style={styles.titlePill}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.titleInput}
            placeholder="시퀀스 이름"
            placeholderTextColor={COLORS.textSecondary}
            maxLength={30}
          />
        </View>

        <View style={styles.iconGroup}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={undo}
            disabled={historyIdx === 0}
          >
            <Text
              style={[
                styles.iconText,
                historyIdx === 0 && { opacity: 0.3 },
              ]}
            >
              ↶
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={redo}
            disabled={historyIdx >= history.length - 1}
          >
            <Text
              style={[
                styles.iconText,
                historyIdx >= history.length - 1 && { opacity: 0.3 },
              ]}
            >
              ↷
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="아사나 이름 검색 (한글/영문)"
        />
      </View>

      {/* Filter chips */}
      <View style={styles.chipsRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          <FilterChip
            label="전체"
            color={COLORS.textSecondary}
            active={activeCategory === "ALL"}
            onPress={() => setActiveCategory("ALL")}
          />
          {(Object.keys(CATEGORIES) as AsanaCategory[]).map((cat) => (
            <FilterChip
              key={cat}
              label={CATEGORIES[cat].label}
              color={CATEGORIES[cat].color}
              active={activeCategory === cat}
              onPress={() => setActiveCategory(cat)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Sequence slots (drag to reorder, long-press) */}
      <View style={styles.slotsWrap}>
        <View style={styles.slotsHeader}>
          <Text style={styles.slotsLabel}>
            시퀀스 {items.length > 0 ? `, ${items.length}` : ""}
          </Text>
          {items.length > 1 ? (
            <Text style={styles.slotsHint}>꾹 눌러서 순서 바꾸기</Text>
          ) : null}
        </View>
        <GestureHandlerRootView style={{ height: SLOT_SIZE + 24 }}>
          <DraggableFlatList
            ref={slotsRef as any}
            data={items}
            horizontal
            keyExtractor={(a, idx) => `${a.id}-${idx}`}
            contentContainerStyle={styles.slotsContent}
            showsHorizontalScrollIndicator={false}
            onDragBegin={() => {
              // 햅틱은 라이브러리가 자체 제공하지 않아서 여기서
            }}
            onDragEnd={({ data }) => {
              setItems(data);
              pushHistory(data);
            }}
            ItemSeparatorComponent={() => (
              <View style={styles.slotArrowWrap}>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.text}
                />
              </View>
            )}
            ListFooterComponent={
              <View
                style={[
                  styles.slot,
                  styles.slotEmpty,
                  items.length > 0 && { marginLeft: 22 },
                ]}
              >
                <Ionicons name="add" size={22} color={COLORS.textMuted} />
                <Text style={styles.slotEmptyText}>아래에서 추가</Text>
              </View>
            }
            renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<Asana>) => {
              const idx = getIndex() ?? 0;
              const cat = item.category_name_en
                ? CATEGORIES[item.category_name_en as AsanaCategory]
                : null;
              return (
                <ScaleDecorator>
                  <Pressable
                    onLongPress={drag}
                    delayLongPress={150}
                    disabled={isActive}
                    style={[styles.slot, isActive && { opacity: 0.85 }]}
                  >
                    {cat ? (
                      <View
                        style={[
                          styles.slotCatBadge,
                          { backgroundColor: cat.color },
                        ]}
                      >
                        <Text
                          style={styles.slotCatBadgeText}
                          numberOfLines={1}
                        >
                          {cat.label}
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles.slotImgWrap}>
                      <SlotImage asana={item} />
                    </View>
                    <View style={styles.slotFooter}>
                      <Text style={styles.slotName} numberOfLines={1}>
                        {item.sanskrit_name_kr}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeAt(idx)}
                      style={styles.slotDelete}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={14} color={COLORS.white} />
                    </TouchableOpacity>
                  </Pressable>
                </ScaleDecorator>
              );
            }}
          />
        </GestureHandlerRootView>
      </View>

      {/* Carousel */}
      <View style={styles.carouselWrap}>
        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : filtered.length === 0 ? (
          <View style={styles.noResults}>
            <Ionicons name="search" size={28} color={COLORS.textMuted} />
            <Text style={styles.noResultsText}>
              {searchQuery.trim().length > 0
                ? `"${searchQuery}" 에 해당하는 아사나가 없어요`
                : "이 카테고리에 아사나가 없어요"}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={filtered}
            keyExtractor={(a) => a.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_W + 12}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: SIDE_PAD }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => (
              <AsanaCarouselCard
                asana={item}
                isCenter={index === centerIndex}
                onPress={() => addAsana(item)}
              />
            )}
          />
        )}
      </View>

      {/* Bottom action buttons */}
      <View style={styles.actionRow}>
        <Button
          title="임시저장"
          variant="secondary"
          size="large"
          onPress={handleSaveDraft}
          disabled={!canDraft}
          loading={savingDraft}
          style={{ flex: 1 }}
        />
        <Button
          title={`발행${items.length > 0 ? ` (${items.length})` : ""}`}
          variant="primary"
          size="large"
          onPress={handleSave}
          disabled={!canSubmit}
          loading={submitting}
          style={{ flex: 1.4 }}
        />
      </View>
    </SafeAreaView>
  );
}

function SlotImage({ asana }: { asana: Asana }) {
  const src = getAsanaThumbnailSource(asana.image_number);
  if (!src) {
    return (
      <View style={styles.slotFallback}>
        <Text style={styles.slotFallbackText}>
          {asana.sanskrit_name_kr.charAt(0)}
        </Text>
      </View>
    );
  }
  return <Image source={src} style={styles.slotImg} contentFit="contain" />;
}

function AsanaCarouselCard({
  asana,
  isCenter,
  onPress,
}: {
  asana: Asana;
  isCenter: boolean;
  onPress: () => void;
}) {
  const src = getAsanaThumbnailSource(asana.image_number);
  const cat = asana.category_name_en
    ? CATEGORIES[asana.category_name_en as AsanaCategory]
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          width: CARD_W,
          height: CARD_H,
          transform: [{ scale: isCenter ? 1 : 0.9 }],
          opacity: isCenter ? 1 : 0.55,
        },
      ]}
    >
      {cat ? (
        <View style={[styles.cardBadge, { backgroundColor: cat.color }]}>
          <Text style={styles.cardBadgeText}>{cat.label}</Text>
        </View>
      ) : null}
      {src ? (
        <Image source={src} style={styles.cardImg} contentFit="contain" />
      ) : (
        <View style={styles.cardImg}>
          <Text style={styles.cardFallbackText}>
            {asana.sanskrit_name_kr.charAt(0)}
          </Text>
        </View>
      )}
      <View style={styles.cardFooter}>
        <Text style={styles.cardName} numberOfLines={1}>
          {asana.sanskrit_name_kr}
        </Text>
        <Text style={styles.cardSub} numberOfLines={1}>
          {asana.sanskrit_name_en}
        </Text>
      </View>
    </Pressable>
  );
}

function FilterChip({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active && { backgroundColor: color, borderColor: color },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[styles.chipText, active && { color: COLORS.white, fontWeight: "700" }]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: COLORS.text, fontSize: 20, fontWeight: "500" },
  backGlyph: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: "300",
    lineHeight: 36,
    marginTop: -4,
  },
  iconGroup: { flexDirection: "row", gap: 6 },
  titlePill: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  titleInput: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    padding: 0,
  },
  slotsWrap: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  slotsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  slotsLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  slotsHint: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontStyle: "italic",
  },
  slotsContent: { paddingHorizontal: 16 },
  slotArrowWrap: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 12,
    backgroundColor: "#F5F0E8",
    position: "relative",
    overflow: "visible",
    padding: 6,
  },
  slotEmpty: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  slotEmptyText: { color: COLORS.textMuted, fontSize: 10 },
  slotImgWrap: {
    flex: 1,
    width: "100%",
    marginTop: 12,
  },
  slotImg: {
    width: "100%",
    height: "100%",
  },
  slotFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  slotFallbackText: { color: "#2D2421", fontSize: 24, fontWeight: "600" },
  slotFooter: {
    alignItems: "center",
    paddingTop: 2,
  },
  slotName: {
    color: "#2D2421",
    fontSize: 9,
    fontWeight: "700",
    paddingHorizontal: 2,
  },
  slotCatBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 56,
    zIndex: 2,
  },
  slotCatBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "700",
  },
  slotDelete: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  carouselWrap: { flex: 1, justifyContent: "center", paddingVertical: 12 },
  chipsRowWrap: { paddingBottom: 4 },
  noResults: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 32,
  },
  noResultsText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#F5F0E8",  // 따뜻한 베이지 (요가 매트 톤)
    borderRadius: 24,
    overflow: "hidden",
    padding: 16,
  },
  cardBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  cardBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
  cardImg: { flex: 1, width: "100%" },
  cardFallbackText: {
    color: COLORS.text,
    fontSize: 48,
    fontWeight: "300",
    textAlign: "center",
    marginTop: 60,
  },
  cardFooter: {
    paddingTop: 12,
    alignItems: "center",
  },
  cardName: { color: "#2D2421", fontSize: 17, fontWeight: "500", fontFamily: "Georgia" },
  cardSub: {
    color: "#7B6F65",
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  bottomBar: { paddingVertical: 8, paddingBottom: 12 },
  filtersScroll: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginRight: 8,
  },
  chipText: { color: COLORS.text, fontSize: 13 },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
});
