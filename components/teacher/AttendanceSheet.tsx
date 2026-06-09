import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar } from "../ui/Avatar";
import { Sheet } from "../ui/Sheet";
import { COLORS } from "../../constants/Colors";
import { teacherApi } from "../../lib/api/teacher";
import type {
  Attendance,
  AttendanceStatus,
  Class,
  ClassSchedule,
  ClassStudent,
  StudentProfile,
} from "../../types/teacher";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "present", label: "출석", color: COLORS.success },
  { value: "absent", label: "결석", color: COLORS.error },
];

// 회원 영역 최소 높이 — 날짜 이동 시 시트 높이가 들쭉날쭉하지 않게 고정
const LIST_MIN_H = Math.round(Dimensions.get("window").height * 0.48);

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

interface AttendanceSheetProps {
  visible: boolean;
  onClose: () => void;
  classId: string | null;
  initialDate?: string;
}

export function AttendanceSheet({
  visible,
  onClose,
  classId,
  initialDate,
}: AttendanceSheetProps) {
  const [date, setDate] = useState(initialDate ?? todayISO());
  const [cls, setCls] = useState<
    (Class & { class_schedules?: ClassSchedule[] }) | null
  >(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [members, setMembers] = useState<
    (ClassStudent & { student_profiles: StudentProfile })[]
  >([]);
  const [attendance, setAttendance] = useState<Map<string, Attendance>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
  // 마지막으로 로드 완료한 classId — 같은 클래스 재오픈 시 캐시 유지(스피너 숨김)용
  const [loadedClassId, setLoadedClassId] = useState<string | null>(null);

  // 시트가 열릴 때마다 날짜 초기화
  useEffect(() => {
    if (visible) setDate(initialDate ?? todayISO());
  }, [visible, initialDate]);

  const load = useCallback(async () => {
    if (!classId) return;
    const [c, m, a, b] = await Promise.all([
      teacherApi.getClass(classId),
      teacherApi.listClassStudents(classId),
      teacherApi.listClassAttendance(classId, date),
      teacherApi.listClassBookingsForDate(classId, date),
    ]);
    setCls(c);
    setMembers(m);
    setLoadedClassId(classId);
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
    if (!visible || !classId) return;
    let mounted = true;
    setLoading(true);
    load()
      .catch((e) => console.warn("[Attendance] load failed", e))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [load, visible, classId]);

  const handleMark = async (
    studentProfileId: string,
    status: AttendanceStatus,
  ) => {
    if (!classId) return;
    const current = attendance.get(studentProfileId);
    const isToggleOff = current?.status === status;
    setSavingStudentId(studentProfileId);
    try {
      if (isToggleOff) {
        // 같은 상태 재탭 → 해제
        await teacherApi.unmarkAttendance({
          classId,
          studentId: studentProfileId,
          date,
        });
        setAttendance((prev) => {
          const next = new Map(prev);
          next.delete(studentProfileId);
          return next;
        });
      } else {
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
      }
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

  // 선택한 날짜가 이 클래스의 수업 요일인지 (예: 월수금 수업 → 화목토일은 비수업일)
  const scheduledDays = useMemo(
    () => new Set((cls?.class_schedules ?? []).map((s) => s.day_of_week)),
    [cls],
  );
  const dow = new Date(date + "T00:00:00").getDay();
  // 스케줄이 비어있으면(데이터 없음) 막지 않음
  const isClassDay = scheduledDays.size === 0 || scheduledDays.has(dow);

  // 최초 로드 또는 다른 클래스일 때만 스피너 — 같은 클래스 재오픈/날짜 이동은 캐시 유지
  const showSpinner = loading && loadedClassId !== classId;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={cls?.title ?? "출석"}
      scrollable
    >
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
          style={[styles.dateNav, date >= todayISO() && styles.dateNavDisabled]}
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
          icon="people-outline"
          label="전체"
          value={stats.total}
          color={COLORS.textSecondary}
        />
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
      </View>

      {loading ? null : bookings.length > 0 ? (
        <View style={styles.bookingsBlock}>
          <Text style={styles.bookingsTitle}>
            신청{" "}
            {bookings.filter(
              (b) => b.status === "booked" || b.status === "attended",
            ).length}
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
                  {b.student?.name ?? "회원"}
                  {b.status === "waitlisted" ? ", 대기" : ""}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.listArea}>
      {showSpinner ? (
        <View style={styles.empty}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : !isClassDay ? (
        <View style={styles.empty}>
          <Ionicons
            name="calendar-outline"
            size={26}
            color={COLORS.textMuted}
          />
          <Text style={styles.emptyText}>이 날은 수업이 없는 날이에요.</Text>
          <Text style={styles.emptySub}>
            수업 요일을 선택하면 출석을 체크할 수 있어요.
          </Text>
        </View>
      ) : members.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>이 클래스에 등록된 회원이 없어요.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {members.map((m) => {
            const current = attendance.get(m.student_profiles.id);
            const saving = savingStudentId === m.student_profiles.id;
            const name = m.student_profiles.name;
            return (
              <View key={m.id} style={styles.row}>
                <Avatar
                  name={name}
                  colorKey={m.student_profiles.id || name}
                  size={32}
                />
                <Text style={styles.name} numberOfLines={1}>
                  {name}
                </Text>
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
        </View>
      )}
      </View>
    </Sheet>
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
  dateBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
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
    marginTop: 8,
    marginBottom: 4,
    gap: 4,
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statBlock: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 16, fontWeight: "800", marginTop: 2 },
  statLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: "600" },
  list: { paddingTop: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  name: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  optionsRow: { flexDirection: "row", gap: 6 },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  optionText: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  optionTextActive: { color: COLORS.white, fontWeight: "800" },
  listArea: {
    minHeight: LIST_MIN_H,
  },
  empty: {
    flex: 1,
    minHeight: LIST_MIN_H,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 6,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "600" },
  emptySub: { color: COLORS.textMuted, fontSize: 12 },
  bookingsBlock: {
    paddingVertical: 12,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
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
