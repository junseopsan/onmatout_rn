import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import type { StudentProfile } from "../../types/teacher";
import { Avatar } from "../ui/Avatar";
import { StatusChip } from "../ui/StatusChip";

// 한국 전화번호 표기 포맷 (010-1234-5678, 02-123-4567 등)
function formatPhone(raw: string): string {
  const d = raw.replace(/[^\d]/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) {
    if (d.startsWith("02"))
      return `02-${d.slice(2, 6)}-${d.slice(6)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (d.length === 9 && d.startsWith("02"))
    return `02-${d.slice(2, 5)}-${d.slice(5)}`;
  return raw;
}

interface StudentRowProps {
  student: StudentProfile;
  onPress?: (student: StudentProfile) => void;
  rightSlot?: React.ReactNode;
  isTeacher?: boolean;
}

export function StudentRow({
  student,
  onPress,
  rightSlot,
  isTeacher,
}: StudentRowProps) {
  const customStatus = (student as any).custom_status as
    | string
    | null
    | undefined;
  const hasLinkedUser = !!student.user_id;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress?.(student)}
      activeOpacity={0.6}
      disabled={!onPress}
    >
      <Avatar name={student.name} colorKey={student.id || student.name} size={40} />
      <View style={styles.body}>
        <View style={styles.titleLine}>
          <Text style={styles.name} numberOfLines={1}>
            {student.name}
            {student.phone ? (
              <Text style={styles.phoneInline}>{` (${formatPhone(student.phone)})`}</Text>
            ) : null}
          </Text>
          {!hasLinkedUser ? (
            <View style={styles.unlinkedBadge}>
              <Text style={styles.unlinkedBadgeText}>미가입</Text>
            </View>
          ) : null}
          {isTeacher ? (
            <View style={styles.teacherBadge}>
              <Text style={styles.teacherBadgeText}>선생님</Text>
            </View>
          ) : null}
        </View>
        {student.memo ? (
          <Text style={styles.meta} numberOfLines={1}>
            {student.memo}
          </Text>
        ) : null}
      </View>
      <StatusChip
        status={student.status as "active" | "paused" | "archived"}
        customLabel={customStatus}
        size="sm"
      />
      {rightSlot ? <View style={{ marginLeft: 6 }}>{rightSlot}</View> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  body: { flex: 1, minWidth: 0 },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  name: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
  },
  meta: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  phoneInline: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  teacherBadge: {
    backgroundColor: "rgba(96, 165, 250, 0.18)",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 2,
  },
  teacherBadgeText: { color: COLORS.info, fontSize: 10, fontWeight: "800" },
  unlinkedBadge: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unlinkedBadgeText: { color: COLORS.textMuted, fontSize: 10, fontWeight: "800" },
});
