import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailHeader } from "../components/ui/DetailHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { IconBadge } from "../components/ui/IconBadge";
import { COLORS } from "../constants/Colors";
import { SPACING } from "../constants/Design";
import {
  notificationsApi,
  type AppNotification,
} from "../lib/api/notifications";
import { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const TYPE_META: Record<
  AppNotification["type"],
  { icon: IoniconName; color: string }
> = {
  yoga_talk: { icon: "chatbubble-ellipses-outline", color: COLORS.primary },
  booking_confirmed: { icon: "checkmark-circle-outline", color: COLORS.success },
  waitlist_promoted: { icon: "arrow-up-circle-outline", color: COLORS.warning },
  general: { icon: "notifications-outline", color: COLORS.textSecondary },
};

function ago(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(ts).toISOString().slice(0, 10);
}

export default function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await notificationsApi.list();
      setItems(list);
    } catch (e) {
      console.warn("[Notifications] load failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const hasUnread = items.some((n) => !n.read_at);

  const markAll = async () => {
    setItems((prev) =>
      prev.map((n) =>
        n.read_at ? n : { ...n, read_at: new Date().toISOString() },
      ),
    );
    try {
      await notificationsApi.markAllRead();
    } catch {
      load();
    }
  };

  const openItem = async (n: AppNotification) => {
    if (!n.read_at) {
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x,
        ),
      );
      notificationsApi.markRead(n.id).catch(() => undefined);
    }
    // 딥링크
    if (n.type === "yoga_talk" && n.data?.thread_id) {
      navigation.navigate("YogaTalkThread", { threadId: n.data.thread_id });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title="알림"
        serif={false}
        trailing={
          hasUnread
            ? { kind: "text", label: "모두 읽음", tone: "primary", onPress: markAll }
            : undefined
        }
      />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="알림이 없어요"
          description="새 요가톡 메시지나 수업 알림이 오면 여기에 모입니다."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item: n }) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.general;
            return (
              <TouchableOpacity
                style={[styles.row, !n.read_at && styles.rowUnread]}
                onPress={() => openItem(n)}
                activeOpacity={0.7}
              >
                <IconBadge name={meta.icon} size={36} color={meta.color} />
                <View style={styles.rowMain}>
                  <Text
                    style={[styles.rowTitle, !n.read_at && styles.rowTitleUnread]}
                    numberOfLines={1}
                  >
                    {n.title}
                  </Text>
                  {n.body ? (
                    <Text style={styles.rowBody} numberOfLines={2}>
                      {n.body}
                    </Text>
                  ) : null}
                  <Text style={styles.rowTime}>{ago(n.created_at)}</Text>
                </View>
                {!n.read_at ? <View style={styles.unreadDot} /> : null}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  rowUnread: {},
  rowMain: { flex: 1, gap: 2 },
  rowTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  rowTitleUnread: { fontWeight: "800" },
  rowBody: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  rowTime: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
