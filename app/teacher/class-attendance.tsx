import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { COLORS } from "../../constants/Colors";
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";
import type {
  Attendance,
  AttendanceStatus,
  Class,
  ClassStudent,
  StudentProfile,
} from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "TeacherClassAttendance">;

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "present", label: "출석", color: COLORS.success },
  { value: "absent", label: "결석", color: COLORS.error },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
function fmtKorean(iso: string) {
  const d = new Date(iso);
  const week = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${week[d.getDay()]})`;
}

type BookingRow = {
  id: string;
  status: "booked" | "waitlisted" | "attended" | "canceled";
  booking_date: string;
  created_at: string;
  student: { id: string; name: string; phone: string | null } | null;
};

export default function TeacherClassAttendanceScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { classId, date: initialDate } = route.params;

  const [date, setDate] = useState(initialDate ?? todayISO());
  const [cls, setCls] = useState<Class | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [members, setMembers] = useState<
    (ClassStudent & { student_profiles: StudentProfile })[]
  >([]);
  const [attendance, setAttendance] = useState<Map<string, Attendance>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [c, m, a, b] = await Promise.all([
      teacherApi.getClass(classId),
      teacherApi.listClassStudents(classId),
      teacherApi.listClassAttendance(classId, date),
      teacherApi.listClassBookingsForDate(classId, date),
    ]);
    setCls(c);
    setMembers(m);
    const map = new Map<string, Attendance>();
    for (const row of a) {
      map.set(row.student_id, row);
    }
    setAttendance(map);
    setBookings(
      (b as any[]).map((r) => ({
        id: r.id,
        status: r.status,
        booking_date: r.booking_date,
        created_at: r.created_at,
        student: Array.isArray(r.student) ? r.student[0] : r.student,
      })),
    );
  }, [classId, date]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    load()
      .catch((e) => console.warn("[Attendance] load failed", e))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [load]);

  const handleMark = async (
    studentProfileId: string,
    status: AttendanceStatus,
  ) => {
    setSavingStudentId(studentProfileId);
    try {
      const updated = await teacherApi.markAttendance({
        classId,
        studentId: studentProfileId,
        date,
        status,
      });
      setAttendance((prev) => {
        const next = new Map(prev);
        next.set(studentProfileId, updated);
        return next;
      });
    } catch (e: any) {
      Alert.alert("저장 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSavingStudentId(null);
    }
  };

  const stats = useMemo(() => {
    let present = 0,
      late = 0,
      absent = 0,
      makeup = 0;
    attendance.forEach((a) => {
      if (a.status === "present") present++;
      else if (a.status === "late") late++;
      else if (a.status === "absent") absent++;
      else if (a.status === "makeup") makeup++;
    });
    return { present, late, absent, makeup, total: members.length };
  }, [attendance, members.length]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title={cls?.title ?? "출석"}
        serif={false}
      />

      <View style={styles.dateBar}>
        <TouchableOpacity
          style={styles.dateNav}
          onPress={() => setDate((d) => addDays(d, -1))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDate(todayISO())}
          style={styles.dateCenter}
          activeOpacity={0.7}
        >
          <Text style={styles.dateText}>{fmtKorean(date)}</Text>
          {date === todayISO() ? (
            <View style={styles.todayChip}>
              <Text style={styles.todayChipText}>오늘</Text>
            </View>
          ) : (
            <Text style={styles.dateHint}>탭하면 오늘</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.dateNav,
            date >= todayISO() && styles.dateNavDisabled,
          ]}
          onPress={() => setDate((d) => addDays(d, 1))}
          disabled={date >= todayISO()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={date >= todayISO() ? COLORS.textMuted : COLORS.text}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <Stat
          icon="checkmark-circle"
          label="출석"
          value={stats.present + stats.late + stats.makeup}
          color={COLORS.success}
        />
        <Stat
          icon="close-circle"
          label="결석"
          value={stats.absent}
          color={COLORS.error}
        />
        <Stat
          icon="people-outline"
          label="전체"
          value={stats.total}
          color={COLORS.textSecondary}
        />
      </View>

      {loading ? null : bookings.length > 0 ? (
        <View style={styles.bookingsBlock}>
          <Text style={styles.bookingsTitle}>
            신청 {bookings.filter((b) => b.status === "booked" || b.status === "attended").length}
            {bookings.some((b) => b.status === "waitlisted")
              ? `, 대기 ${bookings.filter((b) => b.status === "waitlisted").length}`
              : ""}
          </Text>
          <View style={styles.bookingsChips}>
            {bookings.map((b) => (
              <View
                key={b.id}
                style={[
                  styles.bookingChip,
                  b.status === "waitlisted" && styles.bookingChipWait,
                ]}
              >
                <Text
                  style={[
                    styles.bookingChipText,
                    b.status === "waitlisted" && styles.bookingChipWaitText,
                  ]}
                  numberOfLines={1}
                >
                  {b.student?.name ?? "수련생"}
                  {b.status === "waitlisted" ? ", 대기" : ""}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : members.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>이 클래스에 등록된 수련생이 없어요.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {members.map((m) => {
            const current = attendance.get(m.student_profiles.id);
            const saving = savingStudentId === m.student_profiles.id;
            const name = m.student_profiles.name;
            return (
              <View key={m.id} style={styles.row}>
                <View style={styles.rowHead}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                  {current?.deducted ? (
                    <View style={styles.deductedChip}>
                      <Ionicons
                        name="ticket"
                        size={11}
                        color={COLORS.primary}
                      />
                      <Text style={styles.deductedChipText}>−1회</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.optionsRow}>
                  {STATUS_OPTIONS.map((opt) => {
                    const active = current?.status === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.option,
                          active && {
                            backgroundColor: opt.color,
                            borderColor: opt.color,
                          },
                        ]}
                        disabled={saving}
                        onPress={() =>
                          handleMark(m.student_profiles.id, opt.value)
                        }
                      >
                        <Text
                          style={[
                            styles.optionText,
                            active ? styles.optionTextActive : null,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
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
  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "600",
    maxWidth: "60%",
  },
  dateBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateNav: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  dateNavDisabled: { opacity: 0.4 },
  dateCenter: { alignItems: "center", flex: 1, gap: 4 },
  dateText: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  dateHint: { color: COLORS.textSecondary, fontSize: 11 },
  todayChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  todayChipText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
  },
  statsBar: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginBottom: 4,
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statBlock: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 16, fontWeight: "800", marginTop: 2 },
  statLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: "600" },
  list: { padding: 12, paddingTop: 4 },
  row: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  name: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  deductedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(139, 92, 246, 0.16)",
  },
  deductedChipText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
  },
  optionsRow: { flexDirection: "row", gap: 6 },
  option: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  optionText: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  optionTextActive: { color: COLORS.white, fontWeight: "800" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
  bookingsBlock: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  bookingsTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  bookingsChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  bookingChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  bookingChipText: { color: COLORS.primary, fontSize: 12, fontWeight: "600" },
  bookingChipWait: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderColor: "rgba(245, 158, 11, 0.5)",
  },
  bookingChipWaitText: { color: COLORS.warning },
});
