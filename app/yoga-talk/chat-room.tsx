import { Ionicons } from "@expo/vector-icons";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../components/ui/Avatar";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { chatApi, type ChatMessage, type ChatRoom } from "../../lib/api/chat";
import { notifyYogaTalkRead } from "../../stores/yogaTalkBadgeStore";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "ChatRoom">;

function formatTime(iso: string) {
  const d = new Date(iso);
  const hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ampm = hh < 12 ? "오전" : "오후";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${ampm} ${h12}:${mm}`;
}

export default function ChatRoomScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { user } = useAuth();
  const { roomId, title, asTeacher } = route.params;

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [profiles, setProfiles] = useState<
    Map<string, { name: string; avatarUrl: string | null }>
  >(new Map());
  const [helpful, setHelpful] = useState<
    Record<string, { count: number; mine: boolean }>
  >({});
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const load = async () => {
    try {
      // 1) 메시지를 먼저 가져와 바로 표시 (로딩 종료)
      const msgs = await chatApi.listMessages(roomId);
      setMessages(msgs);
      setLoading(false);

      // 2) 보낸이 이름 / 도움됐어요는 병렬로 뒤따라 채운다 (메시지 표시를 막지 않음)
      const teacherMsgIds = msgs
        .filter((m) => m.sender_role === "teacher")
        .map((m) => m.id);
      const [profMap, rows] = await Promise.all([
        chatApi.senderProfiles(msgs.map((m) => m.sender_id)),
        chatApi.listHelpful(teacherMsgIds),
      ]);
      setProfiles(profMap);
      const map: Record<string, { count: number; mine: boolean }> = {};
      for (const r of rows) {
        const cur = map[r.message_id] ?? { count: 0, mine: false };
        cur.count += 1;
        if (r.user_id === user?.id) cur.mine = true;
        map[r.message_id] = cur;
      }
      setHelpful(map);
    } catch (e) {
      console.warn("[ChatRoom] load failed", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    chatApi
      .markRoomRead(roomId)
      .then(() => notifyYogaTalkRead())
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // 방 정보(이름/사진) — 편집 후 돌아오면 갱신되도록 포커스마다 로드
  useFocusEffect(
    useCallback(() => {
      chatApi
        .getRoom(roomId)
        .then(setRoom)
        .catch(() => undefined);
    }, [roomId]),
  );

  const isOwner =
    !!room && room.scope === "group" && room.created_by === user?.id;
  const headerTitle = room?.title || title || "대화";

  const startEditMsg = (m: ChatMessage) => {
    setEditingMsg(m);
    setInput(m.body);
  };

  const cancelEdit = () => {
    setEditingMsg(null);
    setInput("");
  };

  const send = async () => {
    if (!user?.id || !input.trim() || sending) return;
    const body = input.trim();

    // 수정 모드
    if (editingMsg) {
      const m = editingMsg;
      if (body === m.body) {
        cancelEdit();
        return;
      }
      setSending(true);
      try {
        await chatApi.editMessage(m.id, body);
        const now = new Date().toISOString();
        setMessages((prev) =>
          prev.map((x) =>
            x.id === m.id ? { ...x, body, updated_at: now } : x,
          ),
        );
        cancelEdit();
      } catch (e: any) {
        Alert.alert("수정 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
      } finally {
        setSending(false);
      }
      return;
    }

    setSending(true);
    setInput("");
    try {
      await chatApi.sendMessage({
        roomId,
        senderId: user.id,
        role: asTeacher ? "teacher" : "student",
        body,
      });
      await load();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setInput(body);
    } finally {
      setSending(false);
    }
  };

  const toggleHelpful = async (messageId: string) => {
    if (!user?.id) return;
    const prev = helpful[messageId] ?? { count: 0, mine: false };
    setHelpful((h) => ({
      ...h,
      [messageId]: {
        count: prev.count + (prev.mine ? -1 : 1),
        mine: !prev.mine,
      },
    }));
    try {
      await chatApi.toggleHelpful(messageId, user.id);
    } catch {
      setHelpful((h) => ({ ...h, [messageId]: prev }));
    }
  };

  const isEdited = (m: ChatMessage) =>
    !!m.updated_at &&
    new Date(m.updated_at).getTime() - new Date(m.created_at).getTime() > 2000;

  const onLongPressMsg = (m: ChatMessage) => {
    Alert.alert("메시지", undefined, [
      { text: "수정", onPress: () => startEditMsg(m) },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => confirmDeleteMsg(m),
      },
      { text: "취소", style: "cancel" },
    ]);
  };

  const confirmDeleteMsg = (m: ChatMessage) => {
    Alert.alert("메시지 삭제", "이 메시지를 완전히 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await chatApi.deleteMessage(m.id);
            setMessages((prev) => prev.filter((x) => x.id !== m.id));
          } catch (e: any) {
            Alert.alert("실패", e?.message ?? "다시 시도해 주세요.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title={headerTitle}
        serif={false}
        avatarUrl={room?.scope === "group" ? room?.image_url : undefined}
        avatarIcon={room?.scope ? "chatbubbles" : undefined}
        trailingSlot={
          isOwner ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("ChatRoomEdit", { roomId })}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.editBtn}
              accessibilityLabel="그룹방 수정"
            >
              <Ionicons name="settings-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
          ) : undefined
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {loading ? (
          // 로딩 중에도 flex:1 영역을 차지해 입력창이 항상 하단에 고정되게 한다.
          <View style={styles.loadingArea}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>대화를 불러오는 중…</Text>
          </View>
        ) : messages.length === 0 ? (
          <EmptyState
            icon="💬"
            title="아직 대화가 없어요"
            description={
              asTeacher
                ? "수련생들의 질문에 답해보세요. 도움된 답변은 다른 분께도 보일 수 있어요."
                : "궁금한 점을 자유롭게 물어보세요."
            }
          />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            renderItem={({ item: m }) => {
              const fromMe = m.sender_id === user?.id;
              const prof = profiles.get(m.sender_id);
              const name = prof?.name ?? "사용자";
              const isTeacherMsg = m.sender_role === "teacher";
              const h = helpful[m.id] ?? { count: 0, mine: false };
              const showHelpful =
                isTeacherMsg && (!asTeacher || h.count > 0);

              const bubble = (
                <View style={[styles.bubbleRow, fromMe && styles.bubbleRowMine]}>
                  <Pressable
                    onLongPress={
                      fromMe ? () => onLongPressMsg(m) : undefined
                    }
                    delayLongPress={300}
                    style={[
                      styles.bubble,
                      fromMe ? styles.bubbleMe : styles.bubbleOther,
                      isTeacherMsg && !fromMe && styles.bubbleTeacher,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        fromMe ? styles.bubbleTextMe : styles.bubbleTextOther,
                      ]}
                    >
                      {m.body}
                    </Text>
                  </Pressable>
                  <Text style={styles.bubbleTime}>
                    {formatTime(m.created_at)}
                    {isEdited(m) ? " (수정됨)" : ""}
                  </Text>
                </View>
              );

              const helpfulChip = showHelpful ? (
                <TouchableOpacity
                  style={[styles.helpfulChip, h.mine && styles.helpfulChipOn]}
                  onPress={asTeacher ? undefined : () => toggleHelpful(m.id)}
                  disabled={asTeacher}
                  activeOpacity={asTeacher ? 1 : 0.7}
                >
                  <Ionicons
                    name="thumbs-up"
                    size={11}
                    color={h.mine ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.helpfulText,
                      h.mine && { color: COLORS.primary },
                    ]}
                  >
                    도움됐어요{h.count > 0 ? ` ${h.count}` : ""}
                  </Text>
                </TouchableOpacity>
              ) : null;

              if (fromMe) {
                return (
                  <View style={styles.rowMine}>
                    {bubble}
                    {helpfulChip}
                  </View>
                );
              }

              return (
                <View style={styles.rowOther}>
                  <Avatar
                    name={name}
                    colorKey={m.sender_id}
                    avatarUrl={prof?.avatarUrl}
                    size={32}
                    style={styles.avatar}
                  />
                  <View style={styles.contentOther}>
                    <View style={styles.senderRow}>
                      <Text style={styles.sender} numberOfLines={1}>
                        {name}
                      </Text>
                      {isTeacherMsg ? (
                        <View style={styles.roleChip}>
                          <Text style={styles.roleChipText}>선생님</Text>
                        </View>
                      ) : null}
                    </View>
                    {bubble}
                    {helpfulChip}
                  </View>
                </View>
              );
            }}
          />
        )}

        {editingMsg ? (
          <View style={styles.editBanner}>
            <Ionicons name="pencil" size={13} color={COLORS.primary} />
            <Text style={styles.editBannerText} numberOfLines={1}>
              메시지 수정 중: {editingMsg.body}
            </Text>
            <TouchableOpacity
              onPress={cancelEdit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={
              editingMsg
                ? "메시지 수정"
                : asTeacher
                ? "메시지 입력"
                : "질문을 입력해주세요"
            }
            placeholderTextColor={COLORS.textSecondary}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
            onPress={send}
            disabled={!input.trim() || sending}
          >
            <Ionicons
              name={editingMsg ? "checkmark" : "arrow-up"}
              size={20}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  editBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  loadingArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  loadingText: { color: COLORS.textSecondary, fontSize: 13 },
  rowOther: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: SPACING.md,
  },
  rowMine: { alignItems: "flex-end", marginBottom: SPACING.md },
  avatar: { marginTop: 18 },
  contentOther: { flex: 1, alignItems: "flex-start" },
  senderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
    marginHorizontal: 2,
  },
  sender: {
    ...TEXT.micro,
    color: COLORS.textSecondary,
    fontWeight: "700",
    maxWidth: 160,
  },
  roleChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  roleChipText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.2,
  },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  bubbleRowMine: { justifyContent: "flex-end", flexDirection: "row-reverse" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  bubbleOther: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleTeacher: { borderColor: "rgba(139, 92, 246, 0.4)" },
  bubbleMe: { backgroundColor: COLORS.primary, borderTopRightRadius: 4 },
  bubbleText: { ...TEXT.body, lineHeight: 21 },
  bubbleTextOther: { color: COLORS.text },
  bubbleTextMe: { color: COLORS.white },
  bubbleTime: { ...TEXT.micro, color: COLORS.textMuted, fontSize: 10 },
  helpfulChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 3,
    marginHorizontal: 4,
  },
  helpfulChipOn: {
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    borderColor: COLORS.primary,
  },
  helpfulText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700" },
  editBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    backgroundColor: "rgba(139, 92, 246, 0.10)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  editBannerText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    flex: 1,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    ...TEXT.body,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
