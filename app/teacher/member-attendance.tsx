import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import { teacherApi, type AttendanceWithClass } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";
import type { Attendance } from "../../types/teacher";

const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${DOW_KO[d.getDay()]})`;
}

// 출석 행의 수업 시간 — 그 날짜 요일에 해당하는 스케줄에서 추출
function classTimeFor(a: AttendanceWithClass): string | null {
  const dow = new Date(a.attendance_date + "T00:00:00").getDay();
  const sched =
    a.classes?.class_schedules?.find((s) => s.day_of_week === dow) ??
    a.classes?.class_schedules?.[0];
  if (!sched) return null;
  return `${sched.start_time.slice(0, 5)} – ${sched.end_time.slice(0, 5)}`;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "TeacherMemberAttendance">;

// 출석 / 결석 두 가지로만 표시 (지각, 보강은 출석으로 묶고, 취소는 결석으로 묶음)
const STATUS_LABEL: Record<Attendance["status"], string> = {
  present: "출석",
  late: "출석",
  makeup: "출석",
  absent: "결석",
  canceled: "결석",
};
const STATUS_COLOR: Record<Attendance["status"], string> = {
  present: COLORS.success,
  late: COLORS.success,
  makeup: COLORS.success,
  absent: COLORS.error,
  canceled: COLORS.error,
};

function isPresent(s: Attendance["status"]) {
  return s === "present" || s === "late" || s === "makeup";
}

export default function TeacherMemberAttendanceScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { studentProfileId } = route.params;

  const [items, setItems] = useState<AttendanceWithClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    teacherApi
      .listStudentAttendance(studentProfileId, 200)
      .then((data) => mounted && setItems(data))
      .catch((e) => console.warn("[MemberAttendance] failed", e))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [studentProfileId]);

  const stats = useMemo(() => {
    const out = { present: 0, late: 0, makeup: 0, absent: 0, canceled: 0 };
    for (const a of items) out[a.status] += 1;
    return out;
  }, [items]);

  const presentTotal = stats.present + stats.late + stats.makeup;
  const absentTotal = stats.absent + stats.canceled;
  const total = presentTotal + absentTotal;
  const rate = total > 0 ? Math.round((presentTotal / total) * 100) : 0;

  // 최근 6개월 출석 추이
  const trend = useMemo(() => {
    const now = new Date();
    const buckets: {
      key: string;
      label: string;
      present: number;
      total: number;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: `${d.getMonth() + 1}월`,
        present: 0,
        total: 0,
      });
    }
    const byKey = new Map(buckets.map((b) => [b.key, b]));
    for (const a of items) {
      const b = byKey.get(a.attendance_date.slice(0, 7));
      if (!b) continue;
      b.total += 1;
      if (isPresent(a.status)) b.present += 1;
    }
    return buckets;
  }, [items]);

  const maxPresent = Math.max(1, ...trend.map((b) => b.present));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title="출석 현황"
        serif={false}
      />

      {/* 출석률 + 집계 */}
      <View style={styles.summaryCard}>
        <View style={styles.rateBlock}>
          <Text style={styles.rateValue}>{rate}%</Text>
          <Text style={styles.rateLabel}>출석률</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.countsRow}>
          <Stat
            icon="checkmark-circle"
            label="출석"
            value={presentTotal}
            color={COLORS.success}
          />
          <Stat
            icon="close-circle"
            label="결석"
            value={absentTotal}
            color={COLORS.error}
          />
          <Stat
            icon="people-outline"
            label="전체"
            value={total}
            color={COLORS.textSecondary}
          />
        </View>
      </View>

      {/* 최근 6개월 추이 */}
      {total > 0 ? (
        <View style={styles.trendCard}>
          <Text style={styles.trendTitle}>최근 6개월 출석 추이</Text>
          <View style={styles.trendBars}>
            {trend.map((b) => (
              <View key={b.key} style={styles.trendCol}>
                <Text style={styles.trendCount}>{b.present || ""}</Text>
                <View style={styles.trendBarTrack}>
                  <View
                    style={[
                      styles.trendBarFill,
                      {
                        height: `${Math.round((b.present / maxPresent) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.trendLabel}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="📋"
          title="출석 기록이 없어요"
          description="출석체크가 시작되면 이곳에 기록이 쌓여요."
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          <SurfaceCard padded={false}>
            {items.map((a, idx) => (
              <View
                key={a.id}
                style={[styles.row, idx > 0 && styles.rowBorder]}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: STATUS_COLOR[a.status] },
                  ]}
                />
                <View style={styles.rowMain}>
                  <Text style={styles.date}>{fmtDate(a.attendance_date)}</Text>
                  <View style={styles.classLine}>
                    {a.classes?.title ? (
                      <Text style={styles.className} numberOfLines={1}>
                        {a.classes.title}
                      </Text>
                    ) : null}
                    {classTimeFor(a) ? (
                      <Text style={styles.classTime}>{classTimeFor(a)}</Text>
                    ) : null}
                  </View>
                </View>
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: `${STATUS_COLOR[a.status]}26` },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: STATUS_COLOR[a.status] },
                    ]}
                  >
                    {STATUS_LABEL[a.status]}
                  </Text>
                </View>
                {a.deducted ? (
                  <View style={styles.deductedMini}>
                    <Ionicons name="ticket" size={10} color={COLORS.primary} />
                    <Text style={styles.deductedMiniText}>−1</Text>
                  </View>
                ) : (
                  <View style={{ width: 28 }} />
                )}
              </View>
            ))}
          </SurfaceCard>
          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.statBlock}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  rateBlock: { alignItems: "center", minWidth: 64 },
  rateValue: {
    color: COLORS.primary,
    fontSize: 26,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  rateLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "600" },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: COLORS.border,
  },
  countsRow: { flex: 1, flexDirection: "row" },
  trendCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  trendTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12,
  },
  trendBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 88,
  },
  trendCol: { flex: 1, alignItems: "center", gap: 4 },
  trendCount: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
    height: 12,
  },
  trendBarTrack: {
    width: 18,
    flex: 1,
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 5,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  trendBarFill: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    minHeight: 3,
  },
  trendLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: "600" },
  statBlock: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 16, fontWeight: "800", marginTop: 2 },
  statLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: "600" },
  list: { paddingHorizontal: SPACING.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    gap: 10,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  dot: { width: 6, height: 6, borderRadius: 3, alignSelf: "flex-start", marginTop: 5 },
  rowMain: { flex: 1, gap: 3 },
  date: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  classLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  className: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    maxWidth: 150,
  },
  classTime: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: { fontSize: 11, fontWeight: "800" },
  deductedMini: { flexDirection: "row", alignItems: "center", gap: 2 },
  deductedMiniText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
  },
});
