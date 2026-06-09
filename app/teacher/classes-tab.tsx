import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AttendanceSheet } from "../../components/teacher/AttendanceSheet";
import { ClassCard } from "../../components/teacher/ClassCard";
import { StudioSwitcher } from "../../components/teacher/StudioSwitcher";
import { EmptyState } from "../../components/ui/EmptyState";
import { FabButton } from "../../components/ui/FabButton";
import { ListSkeleton } from "../../components/ui/ListSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { usePivotStudios } from "../../hooks/usePivotStudios";
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";
import {
  DAY_OF_WEEK_LABELS_KO,
  type Class,
  type ClassSchedule,
} from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ClassWithSchedules = Class & { class_schedules: ClassSchedule[] };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function dowToday() {
  return new Date().getDay();
}

export default function TeacherClassesTabScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { activeStudio, isDirectorOfActive } = usePivotStudios();
  const [classes, setClasses] = useState<ClassWithSchedules[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceClassId, setAttendanceClassId] = useState<string | null>(
    null,
  );

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await teacherApi.listMyClasses(user.id, activeStudio?.id ?? null);
      setClasses(data as ClassWithSchedules[]);
    } catch (e) {
      console.warn("[ClassesTab] failed", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeStudio?.id]);

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

  const dow = dowToday();
  const todayClasses = useMemo(
    () =>
      classes.filter(
        (c) =>
          c.is_active &&
          (c.class_schedules ?? []).some((s) => s.day_of_week === dow),
      ),
    [classes, dow],
  );

  const otherClasses = classes.filter((c) => !todayClasses.includes(c));
  const activeCount = classes.filter((c) => c.is_active).length;

  const todayLabel = `${DAY_OF_WEEK_LABELS_KO[dow]}요일`;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageHeader eyebrowSlot={<StudioSwitcher />} />

      {loading ? (
        <ListSkeleton count={4} rowHeight={110} />
      ) : classes.length === 0 ? (
        <EmptyState
          icon="🗓️"
          title="아직 클래스가 없어요"
          description={
            isDirectorOfActive
              ? "첫 클래스를 만들고 요일, 시간 스케줄을 묶어 보세요.\n오늘 출석 체크가 한 번에 해결됩니다."
              : "원장이 클래스를 등록하면 여기에 표시돼요.\n지도자는 출석 체크와 수련생 관리를 도와줄 수 있어요."
          }
          action={
            isDirectorOfActive
              ? {
                  label: "클래스 만들기",
                  onPress: () => navigation.navigate("TeacherClassCreate"),
                }
              : undefined
          }
        />
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
          <SectionLabel>오늘, {todayLabel}</SectionLabel>
          {todayClasses.length === 0 ? (
            <View style={styles.todayEmpty}>
              <View style={styles.todayEmptyIcon}>
                <Ionicons
                  name="sunny-outline"
                  size={24}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.todayEmptyTitle}>
                오늘은 예정된 클래스가 없어요
              </Text>
              <Text style={styles.todayEmptySub}>
                여유롭게 쉬어가는 날이에요
              </Text>
            </View>
          ) : (
            todayClasses.map((c) => (
              <View key={c.id} style={styles.todayCardWrap}>
                <ClassCard
                  cls={c}
                  onPress={() =>
                    navigation.navigate("TeacherClassDetail", { classId: c.id })
                  }
                />
                <TouchableOpacity
                  style={styles.attendBtn}
                  activeOpacity={0.9}
                  onPress={() => setAttendanceClassId(c.id)}
                >
                  <Ionicons name="checkmark-done" size={18} color={COLORS.white} />
                  <Text style={styles.attendBtnText}>오늘 출석 체크</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {otherClasses.length > 0 ? (
            <View style={{ marginTop: SPACING.xl }}>
              <SectionLabel>전체 클래스 ({activeCount} 활성)</SectionLabel>
              {otherClasses.map((c) => (
                <ClassCard
                  key={c.id}
                  cls={c}
                  onPress={() =>
                    navigation.navigate("TeacherClassDetail", { classId: c.id })
                  }
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}

      {isDirectorOfActive ? (
        <FabButton
          label="클래스"
          onPress={() => navigation.navigate("TeacherClassCreate")}
          style={styles.fab}
        />
      ) : null}

      <AttendanceSheet
        visible={attendanceClassId !== null}
        onClose={() => setAttendanceClassId(null)}
        classId={attendanceClassId}
        initialDate={todayISO()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  todayCardWrap: { marginBottom: SPACING.md },
  attendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    marginTop: -SPACING.xs,
    marginHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  attendBtnText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
  muted: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  mutedText: { ...TEXT.body, color: COLORS.textSecondary },
  todayEmpty: {
    alignItems: "center",
    gap: 6,
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  todayEmptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(139, 92, 246, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  todayEmptyTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  todayEmptySub: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  fab: {
    position: "absolute",
    right: SPACING.lg,
    bottom: SPACING.lg + 8,
    opacity: 0.94,
  },
});
