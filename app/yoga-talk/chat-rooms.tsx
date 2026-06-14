import { Ionicons } from "@expo/vector-icons";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { chatApi, type ChatRoom } from "../../lib/api/chat";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "ChatRooms">;

export default function ChatRoomsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { studioId, studioName, asTeacher, qnaEnabled } = route.params;

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [actionRoom, setActionRoom] = useState<ChatRoom | null>(null);

  const load = useCallback(async () => {
    try {
      // 선생님 + 채널 사용 시: 요가원 전체 방을 미리 생성
      if (asTeacher && qnaEnabled) {
        await chatApi.getOrCreateStudioRoom(studioId).catch(() => undefined);
      }
      const all = await chatApi.listRooms(studioId);
      // 채널 미사용이면 요가원 전체 방은 숨김 (그룹방은 항상 표시)
      const visible = all.filter((r) => r.scope === "group" || qnaEnabled);
      setRooms(visible);
      setCounts(
        await chatApi.memberCounts(
          visible.filter((r) => r.scope === "group").map((r) => r.id),
        ),
      );
    } catch (e) {
      console.warn("[ChatRooms] load failed", e);
    } finally {
      setLoading(false);
    }
  }, [studioId, asTeacher, qnaEnabled]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openRoom = (r: ChatRoom) => {
    navigation.navigate("ChatRoom", {
      roomId: r.id,
      title:
        r.scope === "studio"
          ? `${studioName ?? "요가원"} 전체`
          : r.title || "그룹 대화",
      asTeacher,
    });
  };

  const togglePref = async (
    room: ChatRoom,
    key: "muted" | "favorite" | "pinned",
  ) => {
    setActionRoom(null);
    try {
      await chatApi.setRoomPrefs(room.id, { [key]: !room[key] });
      await load();
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    }
  };

  const leave = (room: ChatRoom) => {
    setActionRoom(null);
    Alert.alert(
      "채팅방 나가기",
      `'${room.title || "그룹 대화"}'에서 나갈까요?\n나가면 대화 내용이 더 이상 보이지 않아요.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "나가기",
          style: "destructive",
          onPress: async () => {
            try {
              await chatApi.leaveRoom(room.id);
              await load();
            } catch (e: any) {
              Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
            }
          },
        },
      ],
    );
  };

  const studioRoom = rooms.find((r) => r.scope === "studio");
  const groupRooms = rooms.filter((r) => r.scope === "group");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title="요가톡"
        serif={false}
      />

      {loading ? null : rooms.length === 0 ? (
        <EmptyState
          icon="💬"
          title="대화방이 없어요"
          description={
            asTeacher
              ? "수련생들과 함께할 대화방을 만들어 보세요."
              : "아직 참여 중인 대화방이 없어요."
          }
          action={
            asTeacher
              ? {
                  label: "그룹 만들기",
                  onPress: () =>
                    navigation.navigate("ChatGroupCreate", { studioId }),
                }
              : undefined
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {studioRoom ? (
            <>
              <Text style={styles.sectionLabel}>요가원 전체</Text>
              <RoomRow
                icon="people"
                title={`${studioName ?? "요가원"} 전체 Q&A`}
                desc="요가원의 모든 멤버가 함께 봅니다"
                room={studioRoom}
                onPress={() => openRoom(studioRoom)}
                onLongPress={() => setActionRoom(studioRoom)}
              />
            </>
          ) : null}

          {groupRooms.length > 0 ? (
            <>
              <Text style={[styles.sectionLabel, { marginTop: SPACING.lg }]}>
                그룹 대화
              </Text>
              {groupRooms.map((r) => (
                <RoomRow
                  key={r.id}
                  icon="chatbubbles"
                  title={r.title || "그룹 대화"}
                  desc={`멤버 ${counts.get(r.id) ?? 0}명`}
                  room={r}
                  onPress={() => openRoom(r)}
                  onLongPress={() => setActionRoom(r)}
                />
              ))}
            </>
          ) : null}
          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      )}

      <RoomActionSheet
        room={actionRoom}
        onClose={() => setActionRoom(null)}
        onTogglePref={togglePref}
        onLeave={leave}
      />
    </SafeAreaView>
  );
}

function RoomRow({
  icon,
  title,
  desc,
  room,
  onPress,
  onLongPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  room: ChatRoom;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      activeOpacity={0.7}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowTitleRow}>
          {room.pinned ? (
            <Ionicons name="pin" size={13} color={COLORS.primary} />
          ) : null}
          <Text style={styles.rowTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <Text style={styles.rowDesc} numberOfLines={1}>
          {desc}
        </Text>
      </View>
      <View style={styles.rowFlags}>
        {room.favorite ? (
          <Ionicons name="star" size={14} color={COLORS.warning} />
        ) : null}
        {room.muted ? (
          <Ionicons
            name="notifications-off"
            size={14}
            color={COLORS.textMuted}
          />
        ) : null}
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function RoomActionSheet({
  room,
  onClose,
  onTogglePref,
  onLeave,
}: {
  room: ChatRoom | null;
  onClose: () => void;
  onTogglePref: (room: ChatRoom, key: "muted" | "favorite" | "pinned") => void;
  onLeave: (room: ChatRoom) => void;
}) {
  return (
    <Modal
      visible={!!room}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          {room ? (
            <>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {room.scope === "studio"
                  ? "요가원 전체 Q&A"
                  : room.title || "그룹 대화"}
              </Text>

              <ActionItem
                icon={room.pinned ? "pin" : "pin-outline"}
                label={room.pinned ? "상단 고정 해제" : "상단 고정"}
                onPress={() => onTogglePref(room, "pinned")}
              />
              <ActionItem
                icon={room.favorite ? "star" : "star-outline"}
                label={room.favorite ? "즐겨찾기 해제" : "즐겨찾기"}
                onPress={() => onTogglePref(room, "favorite")}
              />
              <ActionItem
                icon={
                  room.muted ? "notifications-outline" : "notifications-off-outline"
                }
                label={room.muted ? "알림 켜기" : "알림 끄기"}
                onPress={() => onTogglePref(room, "muted")}
              />
              {room.scope === "group" ? (
                <ActionItem
                  icon="exit-outline"
                  label="채팅방 나가기"
                  destructive
                  onPress={() => onLeave(room)}
                />
              ) : null}
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ActionItem({
  icon,
  label,
  destructive,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  const color = destructive ? COLORS.error : COLORS.text;
  return (
    <TouchableOpacity
      style={styles.actionItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(139, 92, 246, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700", flexShrink: 1 },
  rowDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  rowFlags: { flexDirection: "row", alignItems: "center", gap: 6 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: SPACING.md,
  },
  sheetTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 4,
    paddingBottom: SPACING.sm,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  actionLabel: { fontSize: 15, fontWeight: "600" },
});
