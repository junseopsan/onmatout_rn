import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/Colors";
import { haptics } from "../lib/haptics";
import { yogaTalkApi } from "../lib/api/yogaTalk";
import { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface YogaTalkQuickIconProps {
  size?: number;
}

// 인스타그램 풍 — 탭 헤더에 채팅 아이콘 + 미읽음 배지. 탭하면 스레드 리스트.
export function YogaTalkQuickIcon({ size = 22 }: YogaTalkQuickIconProps) {
  const navigation = useNavigation<Nav>();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const n = await yogaTalkApi.unreadCount();
      setUnread(n);
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <TouchableOpacity
      onPress={() => {
        haptics.light();
        navigation.navigate("YogaTalkThreadList");
      }}
      style={styles.btn}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name="paper-plane-outline"
        size={size}
        color={COLORS.text}
      />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#F87171",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 11,
  },
});
