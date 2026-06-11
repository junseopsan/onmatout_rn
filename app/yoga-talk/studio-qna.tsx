import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { studioQnaApi, type StudioQnaMessage } from "../../lib/api/studioQna";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "StudioQna">;

function formatTime(iso: string) {
  const d = new Date(iso);
  const hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ampm = hh < 12 ? "오전" : "오후";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${ampm} ${h12}:${mm}`;
}

export default function StudioQnaScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { user } = useAuth();
  const { studioId, studioName, asTeacher } = route.params;

  const [messages, setMessages] = useState<StudioQnaMessage[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [helpful, setHelpful] = useState<
    Record<string, { count: number; mine: boolean }>
  >({});
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<StudioQnaMessage>>(null);

  const load = async () => {
    try {
      const msgs = await studioQnaApi.listMessages(studioId);
      setMessages(msgs);
      setNames(await studioQnaApi.senderNames(msgs.map((m) => m.sender_id)));
      const teacherMsgIds = msgs
        .filter((m) => m.sender_role === "teacher")
        .map((m) => m.id);
      const rows = await studioQnaApi.listHelpful(teacherMsgIds);
      const map: Record<string, { count: number; mine: boolean }> = {};
      for (const r of rows) {
        const cur = map[r.message_id] ?? { count: 0, mine: false };
        cur.count += 1;
        if (r.user_id === user?.id) cur.mine = true;
        map[r.message_id] = cur;
      }
      setHelpful(map);
    } catch (e) {
      console.warn("[StudioQna] load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studioId]);

  const send = async () => {
    if (!user?.id || !input.trim() || sending) return;
    setSending(true);
    const body = input.trim();
    setInput("");
    try {
      await studioQnaApi.sendMessage({
        studioId,
        senderId: user.id,
        role: asTeacher ? "teacher" : "student",
        body,
      });
      await load();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
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
      await studioQnaApi.toggleHelpful(messageId, user.id);
    } catch {
      setHelpful((h) => ({ ...h, [messageId]: prev }));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title={studioName ? `${studioName} Q&A` : "요가원 Q&A"}
        serif={false}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {loading ? null : messages.length === 0 ? (
          <EmptyState
            icon="💬"
            title="아직 대화가 없어요"
            description={
              asTeacher
                ? "수련생들의 질문에 답해보세요. 도움된 답변은 다른 분께도 보여질 수 있어요."
                : "궁금한 점을 자유롭게 물어보세요. 선생님과 다른 수련생이 함께 봅니다."
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
              const h = helpful[m.id] ?? { count: 0, mine: false };
              const showHelpful =
                m.sender_role === "teacher" && (!asTeacher || h.count > 0);
              return (
                <View style={fromMe ? styles.msgRight : styles.msgLeft}>
                  {!fromMe ? (
                    <Text style={styles.sender}>
                      {names.get(m.sender_id) ?? "사용자"}
                      {m.sender_role === "teacher" ? " · 선생님" : ""}
                    </Text>
                  ) : null}
                  <View
                    style={[
                      styles.bubbleRow,
                      fromMe ? styles.bubbleRight : styles.bubbleLeft,
                    ]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        fromMe ? styles.bubbleMe : styles.bubbleOther,
                        m.sender_role === "teacher" &&
                          !fromMe &&
                          styles.bubbleTeacher,
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
                    </View>
                    <Text style={styles.bubbleTime}>
                      {formatTime(m.created_at)}
                    </Text>
                  </View>
                  {showHelpful ? (
                    <TouchableOpacity
                      style={[
                        styles.helpfulChip,
                        h.mine && styles.helpfulChipOn,
                      ]}
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
                  ) : null}
                </View>
              );
            }}
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={asTeacher ? "답변 입력" : "질문을 입력해주세요"}
            placeholderTextColor={COLORS.textSecondary}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
            onPress={send}
            disabled={!input.trim() || sending}
          >
            <Ionicons name="arrow-up" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  msgLeft: { alignItems: "flex-start", marginBottom: SPACING.sm },
  msgRight: { alignItems: "flex-end", marginBottom: SPACING.sm },
  sender: {
    ...TEXT.micro,
    color: COLORS.textSecondary,
    marginBottom: 3,
    marginHorizontal: 4,
    fontWeight: "700",
  },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  bubbleLeft: { justifyContent: "flex-start" },
  bubbleRight: { justifyContent: "flex-end", flexDirection: "row-reverse" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  bubbleOther: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 4,
  },
  bubbleTeacher: { borderWidth: 1, borderColor: "rgba(139, 92, 246, 0.4)" },
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
