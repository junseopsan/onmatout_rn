import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { RenameDialog } from "../../components/ui/RenameDialog";
import { SessionRow } from "../../components/ui/SessionRow";
import { SideSheet } from "../../components/ui/SideSheet";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { useRoles } from "../../hooks/useRoles";
import {
  yogaTalkApi,
  type TopicThreadSummary,
  type YogaTalkMessage,
  type YogaTalkThread,
} from "../../lib/api/yogaTalk";
import { supabase } from "../../lib/supabase";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "YogaTalkThread">;

function formatTime(ts: string) {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function formatDateLabel(ts: string) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")}`;
}

export default function YogaTalkThreadScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { user } = useAuth();
  const { isTeacher } = useRoles();
  const [currentThreadId, setCurrentThreadId] = useState<string>(
    route.params.threadId,
  );
  const threadId = currentThreadId;

  const [thread, setThread] = useState<YogaTalkThread | null>(null);
  const [messages, setMessages] = useState<YogaTalkMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList<any>>(null);

  // 토픽 사이드바
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topicThreads, setTopicThreads] = useState<TopicThreadSummary[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [renaming, setRenaming] = useState<TopicThreadSummary | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [newTitleDraft, setNewTitleDraft] = useState("");

  const load = async () => {
    try {
      const [threadRes, msgs] = await Promise.all([
        supabase
          .from("yoga_talk_threads")
          .select("*, classes:class_id(title)")
          .eq("id", threadId)
          .maybeSingle(),
        yogaTalkApi.listMessages(threadId),
      ]);
      if (threadRes.data) setThread(threadRes.data as YogaTalkThread);
      setMessages(msgs);
    } catch (e) {
      console.warn("[YogaTalk thread] failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // 읽음 표시
    yogaTalkApi.markThreadRead(threadId).catch(() => undefined);
  }, [threadId]);

  const refreshTopics = async () => {
    if (!thread) return;
    setTopicsLoading(true);
    try {
      const list = await yogaTalkApi.listTopicThreads(
        thread.teacher_id,
        thread.student_id,
      );
      setTopicThreads(list);
    } catch (e) {
      console.warn("[YogaTalk thread] topics load failed", e);
    } finally {
      setTopicsLoading(false);
    }
  };

  const openSidebar = async () => {
    setSidebarOpen(true);
    refreshTopics();
  };

  const switchToThread = (newId: string) => {
    setSidebarOpen(false);
    if (newId === currentThreadId) return;
    setCurrentThreadId(newId);
  };

  const submitNewThread = async (rawTitle: string) => {
    if (!thread) return;
    const title = rawTitle.trim() || "새 대화";
    try {
      const created = await yogaTalkApi.createTopicThread({
        teacherUserId: thread.teacher_id,
        studentProfileId: thread.student_id,
        title,
      });
      setCreatingNew(false);
      setNewTitleDraft("");
      setSidebarOpen(false);
      setCurrentThreadId(created.id);
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "다시 시도해 주세요.");
    }
  };

  const submitRename = async (rawTitle: string) => {
    if (!renaming) return;
    try {
      await yogaTalkApi.renameThread(renaming.id, rawTitle);
      const wasCurrent = renaming.id === currentThreadId;
      setRenaming(null);
      refreshTopics();
      if (wasCurrent) load();
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "다시 시도해 주세요.");
    }
  };

  const confirmDelete = (t: TopicThreadSummary) => {
    if (t.is_default) {
      Alert.alert("삭제 불가", "기본 대화는 삭제할 수 없어요.");
      return;
    }
    Alert.alert(
      "대화 삭제",
      `"${t.title}" 대화를 삭제할까요? 메시지 기록이 완전히 사라집니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await yogaTalkApi.deleteThread(t.id);
              if (t.id === currentThreadId) {
                // 기본 스레드로 자동 전환
                const remaining = topicThreads.filter((x) => x.id !== t.id);
                const fallback =
                  remaining.find((x) => x.is_default) ?? remaining[0];
                if (fallback) setCurrentThreadId(fallback.id);
              }
              refreshTopics();
            } catch (e: any) {
              Alert.alert("실패", e?.message ?? "다시 시도해 주세요.");
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!user?.id || !input.trim() || !thread) return;
    setSending(true);
    try {
      await yogaTalkApi.sendMessage({
        threadId,
        senderUserId: user.id,
        senderType: isTeacher ? "teacher" : "student",
        body: input.trim(),
      });
      setInput("");
      const msgs = await yogaTalkApi.listMessages(threadId);
      setMessages(msgs);
    } catch (e: any) {
      Alert.alert("전송 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSending(false);
    }
  };

  // Render with date headers
  const items: ({ kind: "date"; date: string } | { kind: "msg"; msg: YogaTalkMessage })[] = [];
  let lastDate = "";
  for (const m of messages) {
    const d = formatDateLabel(m.created_at);
    if (d !== lastDate) {
      items.push({ kind: "date", date: d });
      lastDate = d;
    }
    items.push({ kind: "msg", msg: m });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DetailHeader onBack={() => navigation.goBack()} title="요가톡" />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        serif={false}
        title={thread?.title ?? "요가톡"}
        trailingSlot={
          <TouchableOpacity
            onPress={openSidebar}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.sidebarBtn}
          >
            <MaterialCommunityIcons
              name="dock-left"
              size={22}
              color={COLORS.text}
            />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={listRef}
          contentContainerStyle={styles.listContent}
          data={items}
          keyExtractor={(it, idx) =>
            it.kind === "date" ? `date-${it.date}` : `msg-${it.msg.id}-${idx}`
          }
          renderItem={({ item }) => {
            if (item.kind === "date") {
              return (
                <View style={styles.dateRow}>
                  <Text style={styles.dateText}>{item.date}</Text>
                </View>
              );
            }
            const m = item.msg;
            const fromMe =
              (isTeacher && m.sender_type === "teacher") ||
              (!isTeacher && m.sender_type === "student");
            return (
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
            );
          }}
        />

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="메시지 입력"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <SideSheet
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="대화함"
        actionLabel="새 대화"
        onActionPress={() => {
          setSidebarOpen(false);
          setTimeout(() => {
            setNewTitleDraft("");
            setCreatingNew(true);
          }, 250);
        }}
      >
        {topicsLoading && topicThreads.length === 0 ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : topicThreads.length === 0 ? (
          <Text style={styles.sheetEmpty}>아직 대화가 없어요.</Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {topicThreads.map((t) => {
              const active = t.id === currentThreadId;
              return (
                <SessionRow
                  key={t.id}
                  iconName={
                    t.is_default
                      ? "chatbubbles"
                      : active
                        ? "chatbubble"
                        : "chatbubble-outline"
                  }
                  title={t.title}
                  badge={t.is_default ? "(기본)" : undefined}
                  subtitle={t.last_message_preview}
                  active={active}
                  onPress={() => switchToThread(t.id)}
                  onRename={() => {
                    setSidebarOpen(false);
                    setTimeout(() => {
                      setRenaming(t);
                      setRenameDraft(t.title);
                    }, 250);
                  }}
                  onDelete={t.is_default ? undefined : () => confirmDelete(t)}
                />
              );
            })}
          </ScrollView>
        )}
      </SideSheet>

      <RenameDialog
        visible={creatingNew}
        title="새 대화 시작"
        placeholder="대화 주제 (예: 부상 상담, 시퀀스 질문)"
        initialValue={newTitleDraft}
        saveLabel="시작"
        onCancel={() => setCreatingNew(false)}
        onSubmit={submitNewThread}
      />

      <RenameDialog
        visible={!!renaming}
        title="대화 제목 변경"
        placeholder="제목을 입력하세요"
        initialValue={renameDraft}
        onCancel={() => setRenaming(null)}
        onSubmit={submitRename}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: SPACING.lg, paddingBottom: SPACING.lg },
  dateRow: { alignItems: "center", marginVertical: SPACING.sm },
  dateText: {
    ...TEXT.micro,
    color: COLORS.textMuted,
    fontSize: 11,
    backgroundColor: COLORS.surfaceDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    marginVertical: 3,
  },
  bubbleLeft: { justifyContent: "flex-start" },
  bubbleRight: {
    justifyContent: "flex-end",
    flexDirection: "row-reverse",
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
  },
  bubbleOther: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 4,
  },
  bubbleText: { ...TEXT.body, lineHeight: 21 },
  bubbleTextOther: { color: COLORS.text },
  bubbleTextMe: { color: COLORS.white },
  bubbleTime: { ...TEXT.micro, color: COLORS.textMuted, fontSize: 10 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    maxHeight: 100,
    color: COLORS.text,
    ...TEXT.body,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  closedBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceDark,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  closedText: { ...TEXT.caption, color: COLORS.textMuted },
  sidebarBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetEmpty: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 24,
  },
});
