import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";

interface FormHeaderProps {
  title: string;
  onClose: () => void;
  rightLabel?: string;
  onRight?: () => void;
  rightDisabled?: boolean;
}

// Floga 스타일 헤더: ✕ + 가운데 pill title + 우측 액션
export function FormHeader({
  title,
  onClose,
  rightLabel,
  onRight,
  rightDisabled,
}: FormHeaderProps) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
        <Text style={styles.iconText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.titlePill}>
        <Text style={styles.titleText} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {rightLabel ? (
        <TouchableOpacity
          style={[styles.actionBtn, rightDisabled && styles.actionBtnDisabled]}
          onPress={onRight}
          disabled={rightDisabled}
        >
          <Text
            style={[
              styles.actionText,
              rightDisabled && { color: COLORS.textSecondary },
            ]}
          >
            {rightLabel}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  iconText: { color: COLORS.text, fontSize: 20, fontWeight: "500" },
  titlePill: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
  },
  titleText: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  actionBtn: {
    height: 38,
    paddingHorizontal: SPACING.lg,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnDisabled: { backgroundColor: COLORS.surface },
  actionText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
});
