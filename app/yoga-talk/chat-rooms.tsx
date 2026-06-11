import { Ionicons } from "@expo/vector-icons";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { FabButton } from "../../components/ui/FabButton";
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
                onPress={() => openRoom(studioRoom)}
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
                  onPress={() => openRoom(r)}
                />
              ))}
            </>
          ) : null}
          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      )}

      {asTeacher ? (
        <FabButton
          label="그룹"
          onPress={() =>
            navigation.navigate("ChatGroupCreate", { studioId })
          }
          style={styles.fab}
        />
      ) : null}
    </SafeAreaView>
  );
}

function RoomRow({
  icon,
  title,
  desc,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.rowDesc} numberOfLines={1}>
          {desc}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
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
  rowTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  rowDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  fab: { position: "absolute", right: SPACING.lg, bottom: SPACING.lg + 8 },
});
