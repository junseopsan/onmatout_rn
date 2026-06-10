import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AttendanceSheet } from "../../components/teacher/AttendanceSheet";
import { StudentRow } from "../../components/teacher/StudentRow";
import { Button } from "../../components/ui/Button";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";
import {
  DAY_OF_WEEK_LABELS_KO,
  type Class,
  type ClassSchedule,
  type ClassStudent,
  type StudentProfile,
} from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "TeacherClassDetail">;

export default function TeacherClassDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { classId } = route.params;
  const { user } = useAuth();

  const [cls, setCls] = useState<
    (Class & { class_schedules: ClassSchedule[] }) | null
  >(null);
  const [members, setMembers] = useState<
    (ClassStudent & { student_profiles: StudentProfile })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);

  const load = useCallback(async () => {
    const [c, m] = await Promise.all([
      teacherApi.getClass(classId),
      teacherApi.listClassStudents(classId),
    ]);
    setCls(c);
    setMembers(m);
  }, [classId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await load();
      } catch (e) {
        console.warn("[ClassDetail] load failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAssign = async (studentIds: string[]) => {
    try {
      await teacherApi.assignStudentsToClass(classId, studentIds);
      await load();
      setPickerOpen(false);
    } catch (e: any) {
      Alert.alert("배정 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    }
  };

  if (loading || !cls) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DetailHeader onBack={() => navigation.goBack()} title="클래스" serif={false} />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const sortedSchedules = (cls.class_schedules ?? []).sort(
    (a, b) => a.day_of_week - b.day_of_week,
  );

  // 동일 시간대끼리 요일을 묶어서 표시 (예: 월수금 09:00–10:30 → 한 줄)
  const scheduleGroups = (() => {
    const byTime = new Map<
      string,
      { days: number[]; start: string; end: string }
    >();
    for (const s of sortedSchedules) {
      const start = s.start_time.slice(0, 5);
      const end = s.end_time.slice(0, 5);
      const key = `${start}-${end}`;
      const g = byTime.get(key);
      if (g) g.days.push(s.day_of_week);
      else byTime.set(key, { days: [s.day_of_week], start, end });
    }
    return Array.from(byTime.values())
      .map((g) => ({
        days: g.days.sort((a, b) => a - b),
        time: `${g.start}–${g.end}`,
      }))
      .sort((a, b) => a.days[0] - b.days[0]);
  })();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title={cls.title}
        serif={false}
        trailing={{
          kind: "text",
          label: "수정",
          tone: "primary",
          onPress: () =>
            navigation.navigate("TeacherClassEdit", { classId }),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.text}
          />
        }
      >
        {/* Hero Summary Card */}
        <View style={styles.heroCard}>
          {scheduleGroups.length > 0 ? (
            <View style={styles.schedBlock}>
              {scheduleGroups.map((g, i) => (
                <View key={i} style={styles.schedRow}>
                  <View style={styles.schedDays}>
                    {g.days.map((d) => (
                      <View key={d} style={styles.dayPill}>
                        <Text style={styles.dayPillText}>
                          {DAY_OF_WEEK_LABELS_KO[d]}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.schedTimeWrap}>
                    <Ionicons
                      name="time-outline"
                      size={13}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.schedTimeText}>{g.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>스케줄이 설정되지 않았어요.</Text>
          )}

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaItem}>
              <Ionicons
                name="people-outline"
                size={15}
                color={COLORS.primary}
              />
              <Text style={styles.heroMetaText}>
                정원 {cls.capacity ? `${cls.capacity}명` : "—"}
              </Text>
            </View>
            <View style={styles.heroMetaItem}>
              <Ionicons
                name="location-outline"
                size={15}
                color={COLORS.primary}
              />
              <Text style={styles.heroMetaText} numberOfLines={1}>
                {cls.location ?? "—"}
              </Text>
            </View>
          </View>

          {cls.description ? (
            <Text style={styles.heroDesc} numberOfLines={3}>
              {cls.description}
            </Text>
          ) : null}
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              등록된 수련생{" "}
              <Text style={styles.sectionCount}>{members.length}</Text>
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                title="오늘 출석"
                size="small"
                variant="outline"
                onPress={() => setAttendanceOpen(true)}
              />
              <Button
                title="+"
                size="small"
                onPress={() => setPickerOpen(true)}
              />
            </View>
          </View>

          {members.length === 0 ? (
            <View style={styles.emptyMembers}>
              <Ionicons
                name="people-outline"
                size={28}
                color={COLORS.textMuted}
              />
              <Text style={styles.muted}>아직 배정된 수련생이 없어요.</Text>
              <Text style={styles.mutedSub}>
                + 배정 으로 수련생을 추가해 보세요.
              </Text>
            </View>
          ) : (
            members.map((m) => (
              <StudentRow
                key={m.id}
                student={m.student_profiles}
                onPress={() =>
                  navigation.navigate("TeacherMemberDetail", {
                    studentProfileId: m.student_profiles.id,
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>

      <AssignStudentsModal
        visible={pickerOpen}
        teacherId={user?.id ?? null}
        excludeIds={members.map((m) => m.student_profiles.id)}
        onClose={() => setPickerOpen(false)}
        onSubmit={handleAssign}
      />

      <AttendanceSheet
        visible={attendanceOpen}
        onClose={() => setAttendanceOpen(false)}
        classId={classId}
      />
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function AssignStudentsModal({
  visible,
  teacherId,
  excludeIds,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  teacherId: string | null;
  excludeIds: string[];
  onClose: () => void;
  onSubmit: (ids: string[]) => void;
}) {
  const [all, setAll] = useState<StudentProfile[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !teacherId) return;
    setLoading(true);
    setPicked(new Set());
    teacherApi
      .listMyStudents(teacherId)
      .then((data) => setAll(data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [visible, teacherId]);

  const available = all.filter((s) => !excludeIds.includes(s.id));

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>수련생 배정</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>닫기</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : available.length === 0 ? (
          <Text style={styles.muted}>배정 가능한 수련생이 없어요.</Text>
        ) : (
          <ScrollView style={{ maxHeight: 360 }}>
            {available.map((s) => {
              const checked = picked.has(s.id);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.pickRow, checked && styles.pickRowActive]}
                  onPress={() => toggle(s.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                    {checked ? (
                      <Text style={styles.checkboxMark}>✓</Text>
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickName}>{s.name}</Text>
                    <Text style={styles.pickMeta}>
                      {s.phone ?? "전화번호 미수집"}, {s.invite_code}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <Button
          title={picked.size > 0 ? `${picked.size}명 배정` : "수련생을 선택해 주세요"}
          size="large"
          disabled={picked.size === 0}
          onPress={() => onSubmit(Array.from(picked))}
          style={{ margin: 16 }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  back: { color: COLORS.textSecondary, fontSize: 15 },
  editLink: { color: COLORS.primary, fontSize: 15, fontWeight: "600" },
  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "600",
    flexShrink: 1,
    maxWidth: "55%",
  },
  content: { padding: 16, paddingBottom: 64 },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  infoRow: { flexDirection: "row", paddingVertical: 6 },
  metaLabel: { color: COLORS.textSecondary, fontSize: 13, width: 60 },
  infoValue: { color: COLORS.text, fontSize: 14, flex: 1 },
  scheduleLine: {
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 4,
  },
  muted: { color: COLORS.textSecondary, fontSize: 13 },
  mutedSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  sectionCount: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  emptyMembers: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 16,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  schedBlock: {
    gap: 8,
  },
  schedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  schedDays: {
    flexDirection: "row",
    gap: 4,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  dayPill: {
    minWidth: 26,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.16)",
  },
  dayPillText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  schedTimeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  schedTimeText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  heroMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroMetaText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  heroDesc: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
    paddingTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  modalSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: { color: COLORS.text, fontSize: 17, fontWeight: "600" },
  modalCancel: { color: COLORS.textSecondary, fontSize: 14 },
  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
    marginBottom: 4,
  },
  pickRowActive: { backgroundColor: COLORS.surfaceDark },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxMark: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
  pickName: { color: COLORS.text, fontSize: 15, fontWeight: "500" },
  pickMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
});
