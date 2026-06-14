import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import {
  routineCommentsApi,
  type RoutineComment,
} from "../../lib/api/routineComments";
import { Avatar } from "../ui/Avatar";

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

// 본문의 @닉네임 토큰을 강조 색으로 분리 렌더 (멘션 표시)
function CommentBody({ content }: { content: string }) {
  const parts = content.split(/(@\S+)/g);
  return (
    <Text style={styles.content}>
      {parts.map((p, i) =>
        p.startsWith("@") ? (
          <Text key={i} style={styles.mention}>
            {p}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
  routineId: string;
  currentUserId?: string;
  // 시퀀스 소유자 — 현재는 권한 표시에 사용하지 않지만 호출부 호환을 위해 유지
  ownerId?: string | null;
  onCountChange?: (count: number) => void;
}

export function RoutineCommentsSheet({
  visible,
  onClose,
  routineId,
  currentUserId,
  ownerId,
  onCountChange,
}: Props) {
  const [comments, setComments] = useState<RoutineComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [replyTo, setReplyTo] = useState<RoutineComment | null>(null);
  // @멘션 후보: 시퀀스 소유자(선생님) + 연결된 수련생
  const [mentionTargets, setMentionTargets] = useState<
    { key: string; name: string; userId: string | null }[]
  >([]);
  const inputRef = useRef<TextInput>(null);

  const load = useCallback(async () => {
    try {
      const list = await routineCommentsApi.list(routineId);
      setComments(list);
      onCountChange?.(list.length);
    } catch (e) {
      console.warn("[RoutineComments] load failed", e);
    } finally {
      setLoading(false);
    }
  }, [routineId, onCountChange]);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setEditingId(null);
      setInput("");
      setReplyTo(null);
      load();
    }
  }, [visible, load]);

  useEffect(() => {
    if (!visible || !ownerId) {
      setMentionTargets([]);
      return;
    }
    let mounted = true;
    routineCommentsApi
      .listMentionTargets(ownerId)
      .then((t) => mounted && setMentionTargets(t))
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [visible, ownerId]);

  const send = async () => {
    const body = input.trim();
    if (!body || sending) return;
    if (!currentUserId) {
      Alert.alert("로그인이 필요해요", "댓글을 남기려면 로그인해 주세요.");
      return;
    }
    setSending(true);
    // 답글에 답글(=대상이 이미 답글)이면 본문 앞에 `@닉네임 ` prefix (중복 방지)
    const replyingToReply = !!(
      replyTo &&
      replyTo.parent_id &&
      comments.some((c) => c.id === replyTo.parent_id)
    );
    let content = body;
    if (
      replyingToReply &&
      replyTo &&
      !content.startsWith(`@${replyTo.author_name} `)
    ) {
      content = `@${replyTo.author_name} ${content}`;
    }
    // parent_id 는 "실제 답글 대상" 댓글 id 로 저장 (표시 그룹핑은 루트로 묶음)
    const parentId = replyTo ? replyTo.id : null;
    setInput("");
    try {
      await routineCommentsApi.add(routineId, content, parentId);
      setReplyTo(null);
      await load();
    } catch (e: any) {
      setInput(body);
      Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSending(false);
    }
  };

  const startReply = (c: RoutineComment) => {
    setEditingId(null);
    setReplyTo(c);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const startEdit = (c: RoutineComment) => {
    setEditingId(c.id);
    setEditText(c.content);
  };

  const saveEdit = async (c: RoutineComment) => {
    const body = editText.trim();
    if (!body) return;
    if (body === c.content) {
      setEditingId(null);
      return;
    }
    try {
      await routineCommentsApi.update(c.id, body);
      setEditingId(null);
      await load();
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    }
  };

  const remove = (c: RoutineComment) => {
    Alert.alert("댓글 삭제", "이 댓글을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await routineCommentsApi.remove(c.id);
            await load();
          } catch (e: any) {
            Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
          }
        },
      },
    ]);
  };

  const renderComment = (c: RoutineComment, isReply = false) => {
    const mine = c.user_id === currentUserId;
    const editing = editingId === c.id;
    return (
      <View style={styles.row}>
        <Avatar
          name={c.author_name}
          colorKey={c.user_id}
          size={isReply ? 26 : 32}
        />
        <View style={styles.rowMain}>
          <View style={styles.rowTop}>
            <Text style={styles.author} numberOfLines={1}>
              {c.author_name}
            </Text>
            <Text style={styles.time}>{ago(c.created_at)}</Text>
          </View>

          {editing ? (
            <View style={styles.editBox}>
              <TextInput
                value={editText}
                onChangeText={setEditText}
                style={styles.editInput}
                multiline
                autoFocus
                maxLength={500}
              />
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => setEditingId(null)}>
                  <Text style={styles.editCancel}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => saveEdit(c)} disabled={!editText.trim()}>
                  <Text
                    style={[styles.editSave, !editText.trim() && { opacity: 0.4 }]}
                  >
                    저장
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <CommentBody content={c.content} />
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => startReply(c)}>
                  <Text style={styles.actionText}>답글</Text>
                </TouchableOpacity>
                {/* 답글은 수정 대신 삭제만 (hilly 정책과 동일) */}
                {mine && !isReply ? (
                  <TouchableOpacity onPress={() => startEdit(c)}>
                    <Text style={styles.actionText}>수정</Text>
                  </TouchableOpacity>
                ) : null}
                {mine ? (
                  <TouchableOpacity onPress={() => remove(c)}>
                    <Text style={styles.actionText}>삭제</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  // @멘션 자동완성 — 입력 끝의 @토큰을 질의로 보고 대화 참여자 목록을 제안
  const mentionMatch = /(?:^|\s)@(\S*)$/.exec(input);
  const mentionQuery = mentionMatch ? mentionMatch[1] : null;
  const mentionList = (() => {
    if (mentionQuery == null) return [];
    // 후보 풀: 대화 참여자 + (선생님 + 연결 수련생). 본인 제외, 이름/유저로 중복 제거.
    const seen = new Map<string, { key: string; name: string }>();
    for (const c of comments) {
      if (c.user_id && c.user_id !== currentUserId) {
        seen.set(c.user_id, { key: c.user_id, name: c.author_name });
      }
    }
    for (const t of mentionTargets) {
      if (t.userId && t.userId === currentUserId) continue;
      const key = t.userId ?? `name:${t.name}`;
      if (!seen.has(key)) seen.set(key, { key, name: t.name });
    }
    const q = mentionQuery.toLowerCase();
    return Array.from(seen.values())
      .filter((u) => !q || u.name.toLowerCase().includes(q))
      .slice(0, 6);
  })();

  const applyMention = (name: string) => {
    setInput((prev) => prev.replace(/(^|\s)@(\S*)$/, `$1@${name} `));
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // 평면 목록 → 2단 스레드 구성. parent_id 는 실제 대상이지만, 표시는 항상
  // 최상위(루트) 아래로 묶어 2단 깊이로 평탄화한다.
  const byId = new Map(comments.map((c) => [c.id, c]));
  const rootIdOf = (c: RoutineComment): string => {
    let cur = c;
    const seen = new Set<string>();
    while (cur.parent_id && byId.has(cur.parent_id) && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.parent_id)!;
    }
    return cur.id;
  };
  const roots: RoutineComment[] = [];
  const repliesByRoot = new Map<string, RoutineComment[]>();
  for (const c of comments) {
    const isRoot = !c.parent_id || !byId.has(c.parent_id);
    if (isRoot) {
      roots.push(c);
    } else {
      const rid = rootIdOf(c);
      const arr = repliesByRoot.get(rid) ?? [];
      arr.push(c);
      repliesByRoot.set(rid, arr);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>
              댓글{comments.length > 0 ? ` ${comments.length}` : ""}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
            style={styles.body}
          >
            {loading ? (
              <ActivityIndicator
                color={COLORS.primary}
                style={{ marginTop: 40 }}
              />
            ) : (
              <FlatList
                data={roots}
                keyExtractor={(c) => c.id}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={styles.empty}>
                    아직 댓글이 없어요.{"\n"}첫 댓글을 남겨보세요.
                  </Text>
                }
                renderItem={({ item }) => {
                  const replies = repliesByRoot.get(item.id) ?? [];
                  return (
                    <View>
                      {renderComment(item)}
                      {replies.map((r) => (
                        <View key={r.id} style={styles.replyWrap}>
                          {renderComment(r, true)}
                        </View>
                      ))}
                    </View>
                  );
                }}
              />
            )}

            {replyTo ? (
              <View style={styles.replyBanner}>
                <Text style={styles.replyBannerText} numberOfLines={1}>
                  {replyTo.author_name}님에게 답글 남기는 중
                </Text>
                <TouchableOpacity
                  onPress={() => setReplyTo(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            ) : null}

            {mentionList.length > 0 ? (
              <View style={styles.mentionBar}>
                {mentionList.map((u) => (
                  <TouchableOpacity
                    key={u.key}
                    style={styles.mentionItem}
                    onPress={() => applyMention(u.name)}
                    activeOpacity={0.6}
                  >
                    <Avatar name={u.name} colorKey={u.key} size={26} />
                    <Text style={styles.mentionItemText} numberOfLines={1}>
                      {u.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <View style={styles.inputBar}>
              <TextInput
                ref={inputRef}
                value={input}
                onChangeText={setInput}
                placeholder={replyTo ? "답글 달기" : "댓글 달기"}
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                multiline
                maxLength={500}
                editable={!sending}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!input.trim() || sending) && { opacity: 0.4 },
                ]}
                onPress={send}
                disabled={!input.trim() || sending}
                activeOpacity={0.85}
              >
                {sending ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Ionicons name="arrow-up" size={18} color={COLORS.white} />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "75%",
    paddingTop: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  title: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  body: { flex: 1 },
  list: { padding: SPACING.lg, gap: SPACING.lg, flexGrow: 1 },
  empty: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 48,
    lineHeight: 20,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.md },
  replyWrap: { marginLeft: 40, marginTop: SPACING.md },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  replyBannerText: { flex: 1, color: COLORS.textSecondary, fontSize: 12 },
  mentionBar: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    backgroundColor: COLORS.background,
  },
  mentionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
  },
  mentionItemText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  rowMain: { flex: 1, gap: 2 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  author: { color: COLORS.text, fontSize: 13, fontWeight: "700", flexShrink: 1 },
  time: { color: COLORS.textMuted, fontSize: 11 },
  content: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  mention: { color: COLORS.primary, fontWeight: "600" },
  actions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 5 },
  actionText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700" },
  editBox: { gap: 8, marginTop: 2 },
  editInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.text,
    fontSize: 14,
    maxHeight: 120,
  },
  editActions: { flexDirection: "row", justifyContent: "flex-end", gap: 18 },
  editCancel: { color: COLORS.textMuted, fontSize: 13, fontWeight: "700" },
  editSave: { color: COLORS.primary, fontSize: 13, fontWeight: "800" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
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
    fontSize: 14,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
