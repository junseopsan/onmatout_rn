import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { COLORS } from "../constants/Colors";
import { useYogaTalkUnread } from "../hooks/useYogaTalkUnread";

interface Props {
  focused: boolean;
  color: string;
  size: number;
}

export function YogaTalkTabIcon({ focused, color, size }: Props) {
  const { unread } = useYogaTalkUnread();
  return (
    <View>
      <Ionicons
        name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
        size={size}
        color={color}
      />
      {/* 인스타그램 스타일 — 새 메시지가 있으면 우측 하단 빨간점 */}
      {unread > 0 ? <View style={styles.dot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    right: -3,
    bottom: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F87171",
    borderWidth: 1.5,
    borderColor: COLORS.surfaceDark,
  },
});
