import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
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
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#F87171",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.surfaceDark,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 11,
  },
});
