import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import type { StudentProfile } from "../../types/teacher";
import { Avatar } from "../ui/Avatar";
import { StatusChip } from "../ui/StatusChip";

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
              <Text style={styles.phoneInline}>{` (${student.phone})`}</Text>
            ) : null}
          </Text>
          {hasLinkedUser ? (
            <Ionicons
              name="checkmark-circle"
              size={12}
              color={COLORS.primary}
              style={{ marginLeft: 2 }}
            />
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
});
