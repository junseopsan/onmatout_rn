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
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";
import type { Attendance } from "../../types/teacher";

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

  const [items, setItems] = useState<Attendance[]>([]);
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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title="출석 내역"
        serif={false}
      />

      {/* 통계 카드 */}
      <View style={styles.statsRow}>
        <Stat
          icon="checkmark-circle"
          label="출석"
          value={stats.present + stats.late + stats.makeup}
          color={COLORS.success}
        />
        <Stat
          icon="close-circle"
          label="결석"
          value={stats.absent + stats.canceled}
          color={COLORS.error}
        />
      </View>

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
                <Text style={styles.date}>{a.attendance_date}</Text>
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
  statsRow: {
    flexDirection: "row",
    gap: 4,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
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
  dot: { width: 6, height: 6, borderRadius: 3 },
  date: { color: COLORS.text, fontSize: 13, fontWeight: "600", flex: 1 },
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
