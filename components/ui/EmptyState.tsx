import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.wrap, style]}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {action ? (
        <TouchableOpacity onPress={action.onPress} style={styles.action} activeOpacity={0.85}>
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: SPACING.xxl,
  },
  icon: { fontSize: 44, marginBottom: SPACING.md },
  title: {
    ...TEXT.uiTitle,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  desc: {
    ...TEXT.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  action: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
  },
  actionText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
});
