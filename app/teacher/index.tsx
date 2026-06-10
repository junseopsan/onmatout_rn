import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClassCard } from "../../components/teacher/ClassCard";
import { StudentRow } from "../../components/teacher/StudentRow";
import { SerifTitle } from "../../components/ui/SerifTitle";
import { COLORS } from "../../constants/Colors";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { useRoles } from "../../hooks/useRoles";
import { useRoleSwitch } from "../../hooks/useRoleSwitch";
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";
import type { Class, ClassSchedule, StudentProfile } from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TeacherHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { hasMultipleRoles } = useRoles();
  const { switchTo } = useRoleSwitch();

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [classes, setClasses] = useState<
    (Class & { class_schedules: ClassSchedule[] })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [s, c] = await Promise.all([
        teacherApi.listMyStudents(user.id),
        teacherApi.listMyClasses(user.id),
      ]);
      setStudents(s);
      setClasses(c);
    } catch (e) {
      console.warn("[TeacherHome] load failed", e);
    }
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await load();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const activeStudents = students.filter((s) => s.status === "active");
  const pausedStudents = students.filter((s) => s.status !== "active");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("TeacherProfileEdit")}
          activeOpacity={0.7}
        >
          <Text style={styles.eyebrow}>선생님 모드, 프로필 편집 ›</Text>
          <SerifTitle size="hero">오늘의 수련생</SerifTitle>
        </TouchableOpacity>
        {hasMultipleRoles ? (
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => switchTo("student")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="swap-horizontal"
              size={13}
              color={COLORS.primary}
            />
            <Text style={styles.toggleBtnCurrent}>선생님</Text>
            <Ionicons
              name="arrow-forward"
              size={10}
              color={COLORS.textMuted}
            />
            <Text style={styles.toggleBtnTarget}>수련생</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.text}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatBlock label="수련생" value={activeStudents.length} />
              <StatBlock label="클래스" value={classes.length} />
              <StatBlock label="휴면" value={pausedStudents.length} muted />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>수련생</Text>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => navigation.navigate("TeacherMemberCreate")}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryActionText}>+ 등록</Text>
              </TouchableOpacity>
            </View>

            {students.length === 0 ? (
              <EmptyHint
                icon="📒"
                title="아직 수련생이 없어요"
                description="우측 상단 [등록] 버튼으로 첫 수련생을 추가해 보세요. 등록 즉시 초대 코드가 자동 생성돼요."
              />
            ) : (
              <>
                {activeStudents.map((s) => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    onPress={() =>
                      navigation.navigate("TeacherMemberDetail", {
                        studentProfileId: s.id,
                      })
                    }
                  />
                ))}
                {pausedStudents.length > 0 ? (
                  <>
                    <Text style={styles.subSectionTitle}>
                      휴면 / 보관 ({pausedStudents.length})
                    </Text>
                    {pausedStudents.map((s) => (
                      <StudentRow
                        key={s.id}
                        student={s}
                        onPress={() =>
                          navigation.navigate("TeacherMemberDetail", {
                            studentProfileId: s.id,
                          })
                        }
                      />
                    ))}
                  </>
                ) : null}
              </>
            )}

            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={styles.sectionTitle}>클래스</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={styles.routineBtn}
                  onPress={() => navigation.navigate("TeacherRoutineList")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.routineBtnText}>📋 시퀀스</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={() => navigation.navigate("TeacherClassCreate")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryActionText}>+ 만들기</Text>
                </TouchableOpacity>
              </View>
            </View>
            {classes.length === 0 ? (
              <EmptyHint
                icon="🗓️"
                title="아직 클래스가 없어요"
                description="우측 상단 [만들기] 버튼으로 첫 클래스를 만들어 보세요. 요일, 시간 스케줄도 함께 설정할 수 있어요."
              />
            ) : (
              classes.map((c) => (
                <ClassCard
                  key={c.id}
                  cls={c}
                  onPress={() =>
                    navigation.navigate("TeacherClassDetail", { classId: c.id })
                  }
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBlock({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <View style={styles.statBlock}>
      <Text
        style={[
          styles.statValue,
          muted ? { color: COLORS.textSecondary } : null,
        ]}
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyHint({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  eyebrow: { ...TEXT.eyebrow, color: COLORS.textSecondary, marginBottom: 6 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "700" },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
    backgroundColor: "rgba(139, 92, 246, 0.12)",
  },
  toggleBtnText: { color: COLORS.text, fontSize: 13 },
  toggleBtnCurrent: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  toggleBtnTarget: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  scrollContent: { padding: 16, paddingBottom: 64 },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statBlock: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: "700" },
  statLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: "600" },
  subSectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 16,
    marginBottom: 8,
  },
  primaryAction: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
  },
  primaryActionText: { color: COLORS.white, fontSize: 13, fontWeight: "600" },
  routineBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceDark,
  },
  routineBtnText: { color: COLORS.text, fontSize: 13, fontWeight: "500" },
  emptyBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptyDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
