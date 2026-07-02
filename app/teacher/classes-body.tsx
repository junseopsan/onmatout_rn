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
import { AttendanceSheet } from "../../components/teacher/AttendanceSheet";
import { ClassCard } from "../../components/teacher/ClassCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { FabButton } from "../../components/ui/FabButton";
import { ListSkeleton } from "../../components/ui/ListSkeleton";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
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

// 클래스 목록 본문 — 클래스 탭의 [수업] 세그먼트에서 렌더된다.
// (자체 SafeAreaView/헤더 없이 상위 래퍼의 공용 헤더를 공유)
export function ClassesBody() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { studios, activeStudio, isDirectorOfActive, loaded } =
    usePivotStudios();
  const hasNoStudio = loaded && studios.length === 0;
  const [classes, setClasses] = useState<ClassWithSchedules[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceClassId, setAttendanceClassId] = useState<string | null>(
    null,
  );

  const load = useCallback(async () => {
    if (!user?.id) return;
    // 스튜디오 로딩이 끝나기 전에는 조회하지 않는다. (activeStudio 가 잠깐 null 인
    // 순간 studio 필터 없이 조회돼 목록이 깜빡이며 사라지던 문제 방지)
    if (!loaded) return;
    try {
      const data = await teacherApi.listMyClasses(
        user.id,
        activeStudio?.id ?? null,
      );
      setClasses(data as ClassWithSchedules[]);
    } catch (e) {
      console.warn("[ClassesTab] failed", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeStudio?.id, loaded]);

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
    <View style={styles.fill}>
      {loading ? (
        <ListSkeleton count={4} rowHeight={110} />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={hasNoStudio ? "🏠" : "🗓️"}
          title={
            hasNoStudio ? "요가원을 만들어 시작하세요" : "아직 클래스가 없어요"
          }
          description={
            hasNoStudio
              ? "직접 요가원을 만들면 클래스, 수련생\n수업권을 관리할 수 있어요.\n또는 요가원을 만든 원장님의 초대를 받아 \n선생님으로 합류할 수도 있어요."
              : isDirectorOfActive
                ? "첫 클래스를 만들어 요일과 시간을 정해 보세요.\n수련생이 수업을 신청하고, 출석을 체크할 수 있어요."
                : "원장이 클래스를 등록하면 여기에 표시돼요.\n선생님은 출석 체크와 수련생 관리를 도와줄 수 있어요."
          }
          action={
            hasNoStudio
              ? {
                  label: "요가원 만들기",
                  onPress: () => navigation.navigate("TeacherStudioForm"),
                }
              : isDirectorOfActive
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
              <ClassCard
                key={c.id}
                cls={c}
                onPress={() =>
                  navigation.navigate("TeacherClassDetail", { classId: c.id })
                }
                footer={
                  <TouchableOpacity
                    style={styles.attendBtn}
                    activeOpacity={0.9}
                    onPress={() => setAttendanceClassId(c.id)}
                  >
                    <Ionicons
                      name="checkmark-done"
                      size={18}
                      color={COLORS.white}
                    />
                    <Text style={styles.attendBtnText}>출석 체크</Text>
                  </TouchableOpacity>
                }
              />
            ))
          )}

          {otherClasses.length > 0 ? (
            <View style={{ marginTop: SPACING.xl }}>
              <SectionLabel>전체 클래스 {activeCount}</SectionLabel>
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
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  attendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    gap: 8,
  },
  attendBtnText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
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
