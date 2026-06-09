import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { COLORS } from "../../constants/Colors";

const AVATAR_COLORS = [
  "#8B5CF6", // primary
  "#06B6D4", // cyan
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#3B82F6", // blue
  "#84CC16", // lime
  "#A855F7", // purple
  "#F97316", // orange
];

// 이름/id 기반 결정적 색상 — 같은 사람은 항상 같은 색
export function avatarColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface AvatarProps {
  name: string;
  /** 색상 시드 (보통 고유 id). 없으면 name 으로 색을 정함 */
  colorKey?: string;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ name, colorKey, size = 40, style }: AvatarProps) {
  const color = avatarColor(colorKey || name || "?");
  const initial = (name || "?").charAt(0);
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: COLORS.white,
    fontWeight: "700",
  },
});
