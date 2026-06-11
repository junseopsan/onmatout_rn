import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { SerifTitle } from "./SerifTitle";

type Trailing =
  | { kind: "text"; label: string; onPress: () => void; tone?: "primary" | "default" }
  | { kind: "icon"; icon: keyof typeof Ionicons.glyphMap; onPress: () => void };

interface DetailHeaderProps {
  onBack?: () => void;
  title: string;
  eyebrow?: string;
  serif?: boolean;
  trailing?: Trailing;
  trailingSlot?: React.ReactNode;
  avatarUrl?: string | null;
  avatarIcon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

// 디테일/서브페이지 헤더: 좌측 chevron + 중앙 타이틀 + 우측 액션
export function DetailHeader({
  onBack,
  title,
  eyebrow,
  serif = true,
  trailing,
  trailingSlot,
  avatarUrl,
  avatarIcon,
  style,
}: DetailHeaderProps) {
  const hasAvatar = !!avatarUrl || !!avatarIcon;
  const titleNode = serif ? (
    <SerifTitle size="title" numberOfLines={1} style={styles.titleSerif}>
      {title}
    </SerifTitle>
  ) : (
    <Text style={styles.titleSans} numberOfLines={1}>
      {title}
    </Text>
  );
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.side}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={styles.backBtn}
          >
            <Text style={styles.backGlyph}>‹</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.center}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        {hasAvatar ? (
          <View style={styles.titleRow}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons
                  name={avatarIcon!}
                  size={16}
                  color={COLORS.primary}
                />
              </View>
            )}
            {titleNode}
          </View>
        ) : (
          titleNode
        )}
      </View>

      <View style={styles.side}>
        {trailingSlot ? (
          trailingSlot
        ) : trailing?.kind === "text" ? (
          <TouchableOpacity onPress={trailing.onPress} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text
              style={[
                styles.trailingText,
                {
                  color:
                    trailing.tone === "primary"
                      ? COLORS.primary
                      : COLORS.text,
                },
              ]}
            >
              {trailing.label}
            </Text>
          </TouchableOpacity>
        ) : trailing?.kind === "icon" ? (
          <TouchableOpacity
            onPress={trailing.onPress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.iconBtn}
          >
            <Ionicons name={trailing.icon} size={22} color={COLORS.text} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    minHeight: 52,
  },
  side: {
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backGlyph: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: "300",
    lineHeight: 36,
    marginTop: -4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(139, 92, 246, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    ...TEXT.eyebrow,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  titleSerif: {
    textAlign: "center",
    fontSize: 18,
  },
  titleSans: {
    ...TEXT.uiTitle,
    fontSize: 15,
    color: COLORS.text,
    textAlign: "center",
  },
  trailingText: {
    fontFamily: TEXT.bodyMed.fontFamily,
    fontSize: 14,
  },
});
