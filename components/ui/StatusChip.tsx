import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { COLORS } from "../../constants/Colors";

export type StatusKind = "active" | "paused" | "archived";

interface StatusChipProps {
  status: StatusKind;
  customLabel?: string | null;
  size?: "sm" | "md";
  showDot?: boolean;
  style?: ViewStyle;
}

const BASE_LABEL: Record<StatusKind, string> = {
  active: "수련중",
  paused: "휴식중",
  archived: "보관",
};

const BASE_COLOR: Record<StatusKind, string> = {
  active: COLORS.primary,
  paused: COLORS.warning,
  archived: COLORS.textSecondary,
};

export function StatusChip({
  status,
  customLabel,
  size = "sm",
  showDot = false,
  style,
}: StatusChipProps) {
  const label = customLabel?.trim() || BASE_LABEL[status];
  // 커스텀 상태는 primary 톤으로 강조
  const color = customLabel?.trim() ? COLORS.primary : BASE_COLOR[status];

  const wrap = size === "md" ? styles.wrapMd : styles.wrapSm;
  const text = size === "md" ? styles.textMd : styles.textSm;

  return (
    <View
      style={[wrap, { backgroundColor: color + "26" }, style]}
    >
      {showDot ? (
        <View style={[styles.dot, { backgroundColor: color }]} />
      ) : null}
      <Text style={[text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapSm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  wrapMd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  textSm: { fontSize: 11, fontWeight: "700" },
  textMd: { fontSize: 12, fontWeight: "700" },
});
