import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { IconBadge } from "../../components/ui/IconBadge";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { Sheet } from "../../components/ui/Sheet";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { COLORS } from "../../constants/Colors";
import { CATEGORIES } from "../../constants/categories";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { teacherApi } from "../../lib/api/teacher";
import { getAsanaThumbnailSource } from "../../lib/asanaImages";
import { RootStackParamList } from "../../navigation/types";
import type { AsanaCategory } from "../../types/asana";

const GRID_COLS = 3;
const ARROW_W = 22;
const SCREEN_W = Dimensions.get("window").width;
const CARD_SIZE = Math.floor(
  (SCREEN_W - SPACING.lg * 2 - ARROW_W * (GRID_COLS - 1)) / GRID_COLS,
);
import type {
  Class,
  Routine,
  RoutineItem,
  RoutineShare,
  StudentProfile,
} from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "TeacherRoutineDetail">;

type ItemWithAsana = RoutineItem & {
  asanas: {
    id: string;
    sanskrit_name_kr: string;
    sanskrit_name_en: string;
    image_number: string | null;
    category_name_en: string | null;
  };
};

type ShareWithLabel = RoutineShare & {
  classes: { title: string } | null;
  student_profiles: { name: string } | null;
};

export default function TeacherRoutineDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { routineId } = route.params;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [items, setItems] = useState<ItemWithAsana[]>([]);
  const [shares, setShares] = useState<ShareWithLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    const [{ routine: r, items: it }, sh] = await Promise.all([
      teacherApi.getRoutine(routineId),
      teacherApi.listRoutineShares(routineId),
    ]);
    setRoutine(r);
    setItems(it as ItemWithAsana[]);
    setShares(sh);
  }, [routineId]);

  useEffect(() => {
    let mounted = true;
    load()
      .catch((e) => console.warn("[RoutineDetail] load failed", e))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [load]);

  const isOwner = routine?.teacher_id === user?.id;
  const isPublic = (routine as any)?.visibility === "public";

  const togglePublic = async (next: boolean) => {
    if (!routine) return;
    setVisibilitySaving(true);
    try {
      await teacherApi.setRoutineVisibility(routine.id, next ? "public" : "private");
      setRoutine({ ...(routine as any), visibility: next ? "public" : "private" });
    } catch (e: any) {
      Alert.alert("변경 실패", e?.message ?? "다시 시도해 주세요.");
    } finally {
      setVisibilitySaving(false);
    }
  };

  const confirmDelete = () => {
    if (!routine) return;
    Alert.alert(
      "시퀀스 삭제",
      `"${routine.title}" 시퀀스를 삭제할까요? 공유 내역과 아사나 구성이 모두 사라지며 되돌릴 수 없어요.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await teacherApi.deleteRoutine(routine.id);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert("삭제 실패", e?.message ?? "다시 시도해 주세요.");
            }
          },
        },
      ],
    );
  };

  const cloneToMyRoutines = async () => {
    if (!routine) return;
    try {
      const newId = await teacherApi.cloneRoutine(routine.id);
      Alert.alert("복제 완료", "내 시퀀스으로 가져왔어요.", [
        {
          text: "보기",
          onPress: () =>
            navigation.replace("TeacherRoutineDetail", { routineId: newId }),
        },
        { text: "닫기", style: "cancel" },
      ]);
    } catch (e: any) {
      Alert.alert("복제 실패", e?.message ?? "다시 시도해 주세요.");
    }
  };

  if (loading || !routine) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DetailHeader onBack={() => navigation.goBack()} title="시퀀스" serif={false} />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title={routine.title}
        serif={false}
        trailing={
          isOwner
            ? {
                kind: "icon",
                icon: "ellipsis-horizontal",
                onPress: () => setMenuOpen(true),
              }
            : { kind: "icon", icon: "copy-outline", onPress: cloneToMyRoutines }
        }
      />

      <ScrollView
        contentContainerStyle={[styles.content, styles.contentGrow]}
        showsVerticalScrollIndicator={false}
      >
        {routine.description ? (
          <SurfaceCard style={styles.card}>
            <Text style={styles.description}>{routine.description}</Text>
          </SurfaceCard>
        ) : null}

        <View style={styles.sectionTight}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.shareMiniHeader}>
              아사나 시퀀스 {items.length}
            </Text>
            {isOwner ? (
              <View style={styles.segWrap}>
                <TouchableOpacity
                  onPress={() =>
                    isPublic && !visibilitySaving && togglePublic(false)
                  }
                  disabled={visibilitySaving || !isPublic}
                  activeOpacity={0.7}
                  style={[styles.segBtn, !isPublic && styles.segBtnActive]}
                >
                  <Text
                    style={[styles.segText, !isPublic && styles.segTextActive]}
                  >
                    비공개
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    !isPublic && !visibilitySaving && togglePublic(true)
                  }
                  disabled={visibilitySaving || isPublic}
                  activeOpacity={0.7}
                  style={[styles.segBtn, isPublic && styles.segBtnActive]}
                >
                  <Text
                    style={[styles.segText, isPublic && styles.segTextActive]}
                  >
                    공개
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
          {items.length === 0 ? (
            <EmptyState
              icon="🧘"
              title="아사나가 비어 있어요"
              description="편집 화면에서 아사나를 순서대로 추가해 보세요."
              style={{ paddingVertical: SPACING.xl }}
            />
          ) : (
            <View style={styles.grid}>
              {(() => {
                const rows: ItemWithAsana[][] = [];
                for (let i = 0; i < items.length; i += GRID_COLS) {
                  rows.push(items.slice(i, i + GRID_COLS));
                }
                return rows.map((row, rowIdx) => {
                const isReverse = rowIdx % 2 === 1;
                const isLastRow = rowIdx === rows.length - 1;
                return (
                  <React.Fragment key={`row-${rowIdx}`}>
                    <View
                      style={[
                        styles.gridRow,
                        isReverse && { flexDirection: "row-reverse" },
                      ]}
                    >
                      {row.map((it, ci) => {
                        const thumb = getAsanaThumbnailSource(
                          it.asanas.image_number,
                        );
                        const cat = it.asanas.category_name_en
                          ? CATEGORIES[
                              it.asanas.category_name_en as AsanaCategory
                            ]
                          : null;
                        const isLastInRow = ci === row.length - 1;
                        return (
                          <React.Fragment key={it.id}>
                            <View style={styles.gridCard}>
                              {cat ? (
                                <View
                                  style={[
                                    styles.gridCatBadge,
                                    { backgroundColor: `${cat.color}CC` },
                                  ]}
                                >
                                  <Text
                                    style={styles.gridCatText}
                                    numberOfLines={1}
                                  >
                                    {cat.label}
                                  </Text>
                                </View>
                              ) : null}
                              <View style={styles.gridImgWrap}>
                                {thumb ? (
                                  <Image
                                    source={thumb}
                                    style={styles.gridImg}
                                    contentFit="contain"
                                  />
                                ) : (
                                  <Text style={styles.gridFallback}>
                                    {it.asanas.sanskrit_name_kr.charAt(0)}
                                  </Text>
                                )}
                              </View>
                              <Text style={styles.gridName} numberOfLines={1}>
                                {it.asanas.sanskrit_name_kr}
                              </Text>
                            </View>
                            {!isLastInRow ? (
                              <View style={styles.gridArrow}>
                                <Ionicons
                                  name={
                                    isReverse
                                      ? "chevron-back"
                                      : "chevron-forward"
                                  }
                                  size={18}
                                  color={COLORS.text}
                                />
                              </View>
                            ) : null}
                          </React.Fragment>
                        );
                      })}
                    </View>
                    {!isLastRow ? (
                      <View style={styles.gridDownRow}>
                        <View style={styles.gridDownCell}>
                          {isReverse ? (
                            <Ionicons
                              name="chevron-down"
                              size={18}
                              color={COLORS.text}
                            />
                          ) : null}
                        </View>
                        <View style={{ width: ARROW_W }} />
                        <View style={styles.gridDownCell} />
                        <View style={{ width: ARROW_W }} />
                        <View style={styles.gridDownCell}>
                          {!isReverse ? (
                            <Ionicons
                              name="chevron-down"
                              size={18}
                              color={COLORS.text}
                            />
                          ) : null}
                        </View>
                      </View>
                    ) : null}
                  </React.Fragment>
                );
                });
              })()}
            </View>
          )}
        </View>

        {isOwner ? <View style={styles.flexSpacer} /> : null}

        {isOwner ? (
          <View style={styles.shareMini}>
            <Text style={styles.shareMiniHeader}>
              공유 내역 {shares.length}
            </Text>
            {shares.length === 0 ? (
              <Text style={styles.shareEmpty}>
                아직 공유한 곳이 없어요. 아래 공유하기로 클래스나 회원에게 보내보세요.
              </Text>
            ) : null}
            {shares.map((s) => (
              <View key={s.id} style={styles.shareMiniRow}>
                <IconBadge
                  name={s.classes ? "library-outline" : "person-outline"}
                  size={22}
                  color={s.classes ? COLORS.primary : COLORS.info}
                />
                <Text style={styles.shareMiniText} numberOfLines={1}>
                  {s.classes
                    ? s.classes.title
                    : s.student_profiles?.name ?? "공유 대상"}
                </Text>
                <Text style={styles.shareMiniDate}>
                  {s.shared_at.slice(5, 10).replace("-", ".")}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {isOwner ? (
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, SPACING.md) },
          ]}
        >
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => setShareOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons
              name="share-social-outline"
              size={18}
              color={COLORS.white}
            />
            <Text style={styles.shareBtnText}>공유하기</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 더보기 메뉴 (수정 / 삭제) */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setMenuOpen(false)}
        >
          <View style={[styles.menuCard, { top: insets.top + 44 }]}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate("TeacherRoutineCreate", {
                  routineId: routine.id,
                });
              }}
            >
              <Ionicons name="create-outline" size={18} color={COLORS.text} />
              <Text style={styles.menuItemText}>수정</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                setMenuOpen(false);
                setTimeout(confirmDelete, 250);
              }}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              <Text style={[styles.menuItemText, { color: COLORS.error }]}>
                삭제
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        routineId={routineId}
        teacherId={user?.id ?? ""}
        existingShares={shares}
        onShared={async () => {
          await load();
          setShareOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

function ShareSheet({
  visible,
  onClose,
  routineId,
  teacherId,
  existingShares,
  onShared,
}: {
  visible: boolean;
  onClose: () => void;
  routineId: string;
  teacherId: string;
  existingShares: ShareWithLabel[];
  onShared: () => void;
}) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !teacherId) return;
    setLoading(true);
    Promise.all([
      teacherApi.listMyClasses(teacherId),
      teacherApi.listMyStudents(teacherId),
    ])
      .then(([cs, ss]) => {
        setClasses(cs as any);
        setStudents(ss);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [visible, teacherId]);

  const sharedClassIds = new Set(
    existingShares.filter((s) => s.class_id).map((s) => s.class_id as string),
  );
  const sharedStudentIds = new Set(
    existingShares.filter((s) => s.student_id).map((s) => s.student_id as string),
  );

  const share = async (target: { classId?: string; studentId?: string }) => {
    const key = target.classId ?? target.studentId ?? "";
    setSubmitting(key);
    try {
      await teacherApi.shareRoutine({
        routineId,
        teacherId,
        classId: target.classId ?? null,
        studentId: target.studentId ?? null,
      });
      onShared();
    } catch (e: any) {
      Alert.alert("공유 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="시퀀스 공유"
      description="클래스 단위 또는 특정 회원에게 보낼 수 있어요."
    >
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.xl }} />
      ) : (
        <>
          {classes.length > 0 ? (
            <View style={{ marginBottom: SPACING.lg }}>
              <SectionLabel>클래스</SectionLabel>
              {classes.map((c) => {
                const alreadyShared = sharedClassIds.has(c.id);
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.targetRow, alreadyShared && styles.targetRowMuted]}
                    disabled={submitting === c.id || alreadyShared}
                    onPress={() => share({ classId: c.id })}
                    activeOpacity={0.85}
                  >
                    <IconBadge name="library-outline" size={28} color={COLORS.primary} />
                    <Text style={styles.targetText}>{c.title}</Text>
                    {alreadyShared ? (
                      <Text style={styles.targetTag}>공유됨</Text>
                    ) : submitting === c.id ? (
                      <ActivityIndicator color={COLORS.primary} size="small" />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          {students.length > 0 ? (
            <View>
              <SectionLabel>특정 회원</SectionLabel>
              {students.map((s) => {
                const alreadyShared = sharedStudentIds.has(s.id);
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.targetRow, alreadyShared && styles.targetRowMuted]}
                    disabled={submitting === s.id || alreadyShared}
                    onPress={() => share({ studentId: s.id })}
                    activeOpacity={0.85}
                  >
                    <IconBadge name="person-outline" size={28} color={COLORS.info} />
                    <Text style={styles.targetText}>{s.name}</Text>
                    {alreadyShared ? (
                      <Text style={styles.targetTag}>공유됨</Text>
                    ) : submitting === s.id ? (
                      <ActivityIndicator color={COLORS.primary} size="small" />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          {classes.length === 0 && students.length === 0 ? (
            <EmptyState
              icon="🤝"
              title="공유 대상이 없어요"
              description="먼저 클래스를 만들거나 회원을 등록해 주세요."
            />
          ) : null}
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.lg },
  contentGrow: { flexGrow: 1 },
  flexSpacer: { flex: 1, minHeight: SPACING.lg },
  card: { marginBottom: SPACING.md },
  section: { marginTop: SPACING.lg },
  sectionTight: {
    marginTop: SPACING.sm,
    paddingHorizontal: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemsCard: { overflow: "hidden" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  toggleTitle: { ...TEXT.bodyMed, color: COLORS.text, marginBottom: 4 },
  toggleDesc: { ...TEXT.caption, color: COLORS.textSecondary, lineHeight: 18 },
  description: { ...TEXT.body, color: COLORS.text, lineHeight: 22 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: 12,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  rowIndex: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
    width: 22,
    textAlign: "center",
  },
  rowName: { ...TEXT.bodyMed, color: COLORS.text },
  rowEn: { ...TEXT.caption, color: COLORS.textSecondary, marginTop: 2 },
  duration: { ...TEXT.caption, color: COLORS.textSecondary },
  grid: {
    width: "100%",
  },
  gridRow: {
    flexDirection: "row",
    width: "100%",
  },
  gridArrow: {
    width: ARROW_W,
    height: CARD_SIZE + 18,
    alignItems: "center",
    justifyContent: "center",
  },
  gridDownRow: {
    width: "100%",
    flexDirection: "row",
    paddingVertical: 4,
  },
  gridDownCell: {
    width: CARD_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  gridCard: {
    width: CARD_SIZE,
    height: CARD_SIZE + 18,
    borderRadius: 12,
    backgroundColor: "#F5F0E8",
    padding: 6,
    position: "relative",
    overflow: "hidden",
  },
  gridImgWrap: {
    flex: 1,
    width: "100%",
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  gridImg: { width: "100%", height: "100%" },
  gridFallback: {
    color: "#2D2421",
    fontSize: 28,
    fontWeight: "600",
  },
  gridName: {
    color: "#2D2421",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    paddingTop: 2,
    paddingHorizontal: 2,
  },
  gridCatBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 60,
    zIndex: 2,
  },
  gridCatText: { color: COLORS.white, fontSize: 9, fontWeight: "700" },
  muted: { ...TEXT.body, color: COLORS.textSecondary, lineHeight: 22 },
  inlinePrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
  },
  inlinePrimaryText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: 10,
  },
  shareMini: {
    marginTop: SPACING.lg,
    paddingHorizontal: 4,
  },
  shareMiniHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  shareMiniHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  shareEmpty: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 4,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  menuCard: {
    position: "absolute",
    right: SPACING.lg,
    minWidth: 150,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  shareBtn: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  shareBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  shareMiniRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  shareMiniText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  shareMiniDate: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  segWrap: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 999,
    padding: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  segBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  segBtnActive: {
    backgroundColor: COLORS.primary,
  },
  segText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },
  segTextActive: {
    color: COLORS.white,
  },
  shareGroupHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 6,
    backgroundColor: COLORS.surfaceDark,
  },
  shareGroupHeaderText: {
    ...TEXT.micro,
    color: COLORS.textSecondary,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  shareTarget: { ...TEXT.bodyMed, color: COLORS.text, flex: 1 },
  shareDate: { ...TEXT.caption, color: COLORS.textMuted },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceDark,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  targetRowMuted: { opacity: 0.55 },
  targetText: { ...TEXT.bodyMed, color: COLORS.text, flex: 1 },
  targetTag: {
    ...TEXT.micro,
    color: COLORS.primary,
    fontWeight: "700",
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
});
