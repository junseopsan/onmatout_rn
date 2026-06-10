import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";

interface ChipProps {
  label: string;
  active?: boolean;
  color?: string;
  onPress?: () => void;
  size?: "sm" | "md";
  style?: StyleProp<ViewStyle>;
}

export function Chip({
  label,
  active = false,
  color,
  onPress,
  size = "md",
  style,
}: ChipProps) {
  const activeColor = color ?? COLORS.primary;
  return (
    <TouchableOpacity
      style={[
        styles.base,
        size === "sm" ? styles.sm : styles.md,
        active && { backgroundColor: activeColor, borderColor: activeColor },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Text
        style={[
          size === "sm" ? styles.textSm : styles.textMd,
          active
            ? { color: COLORS.white, fontWeight: "700" }
            : { color: COLORS.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  md: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    minHeight: 36,
  },
  sm: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 28,
    minWidth: 36,
  },
  textSm: { fontSize: 12, fontWeight: "500" },
  textMd: { fontSize: 14, fontWeight: "500" },
});
