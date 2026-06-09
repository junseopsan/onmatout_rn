import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { SerifTitle } from "./SerifTitle";

interface PageHeaderProps {
  eyebrow?: string;
  eyebrowSlot?: React.ReactNode;
  title?: string;
  subtitle?: string;
  trailing?: {
    label: string;
    onPress: () => void;
    variant?: "primary" | "ghost";
  };
  trailingSlot?: React.ReactNode;
  style?: ViewStyle;
}

export function PageHeader({
  eyebrow,
  eyebrowSlot,
  title,
  subtitle,
  trailing,
  trailingSlot,
  style,
}: PageHeaderProps) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.left}>
        {eyebrowSlot ? <View style={{ marginBottom: 8 }}>{eyebrowSlot}</View> : null}
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        {title ? <SerifTitle size="hero">{title}</SerifTitle> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {trailing ? (
        <TouchableOpacity
          onPress={trailing.onPress}
          activeOpacity={0.85}
          style={[
            styles.trailing,
            trailing.variant === "ghost" ? styles.trailingGhost : styles.trailingPrimary,
          ]}
        >
          <Text
            style={[
              styles.trailingText,
              trailing.variant === "ghost"
                ? { color: COLORS.text }
                : { color: COLORS.white },
            ]}
          >
            {trailing.label}
          </Text>
        </TouchableOpacity>
      ) : null}

      {trailingSlot ? <View>{trailingSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  left: { flex: 1 },
  eyebrow: {
    ...TEXT.eyebrow,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  subtitle: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  trailing: {
    paddingHorizontal: SPACING.lg,
    height: 36,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  trailingPrimary: {
    backgroundColor: COLORS.primary,
  },
  trailingGhost: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trailingText: {
    fontFamily: undefined,
    fontSize: 13,
    fontWeight: "700",
  },
});
