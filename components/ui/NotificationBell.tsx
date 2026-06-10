import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { notificationsApi } from "../../lib/api/notifications";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function NotificationBell() {
  const navigation = useNavigation<Nav>();
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      notificationsApi
        .unreadCount()
        .then((c) => mounted && setUnread(c))
        .catch(() => undefined);
      return () => {
        mounted = false;
      };
    }, []),
  );

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Notifications")}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={styles.btn}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
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
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: COLORS.error,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "800",
  },
});
