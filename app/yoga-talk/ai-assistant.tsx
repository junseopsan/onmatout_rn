import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { IconBadge } from "../../components/ui/IconBadge";
import { RenameDialog } from "../../components/ui/RenameDialog";
import { SessionRow } from "../../components/ui/SessionRow";
import { SideSheet } from "../../components/ui/SideSheet";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { yogaAIApi, type YogaAskResponse } from "../../lib/api/yogaAI";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "YogaAiAssistant">;

const SUGGESTIONS = [
  "다운독 자세 정렬 팁이 궁금해요",
  "초보자에게 좋은 호흡법은?",
  "허리 통증이 있을 때 피해야 할 자세는?",
  "30분 모닝 시퀀스 추천",
];

type Turn = {
  question: string;
  response?: YogaAskResponse;
  error?: string;
  rating?: 1 | -1;
};

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 마크다운 강조 표기(**, *, __, ##) 제거 — RN 기본 Text 는 마크다운 렌더 안 함
function stripMarkdown(s: string): string {
  if (!s) return s;
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1$2")
    .replace(/^#{1,6}\s+/gm, "");
}

function logsToTurns(logs: any[]): Turn[] {
  return logs.map((l: any) => ({
    question: l.question,
    response: {
      answer: l.answer ?? "",
      sources: [],
      safety_notice_required: !!l.safety_notice_required,
      should_recommend_teacher: !!l.should_recommend_teacher,
      log_id: l.id ?? null,
    },
    rating: l.rating === 1 ? 1 : l.rating === -1 ? -1 : undefined,
  }));
}

type Session = {
  threadId: string;
  firstQuestion: string;
  title: string;
  lastAt: string;
  count: number;
};

export default function YogaTalkAiAssistantScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { user } = useAuth();
  const initialQuestion = route.params?.initialQuestion;
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  // useState 초기값을 즉시 uuid 로 — 진입 직후 메시지 전송해도 thread_id 가 null 로 새지 않게
  const [currentThreadId, setCurrentThreadId] = useState<string>(() => uuid());
  const [sessionSheetOpen, setSessionSheetOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const autoSentRef = useRef(false);

  // 초기 진입: 항상 새 대화 화면. 세션 목록은 메뉴에서 볼 수 있게 백그라운드 로드.
  useEffect(() => {
    if (!user?.id) {
      setHistoryLoading(false);
      return;
    }
    let mounted = true;
    yogaAIApi
      .listMySessions(user.id)
      .then((list) => {
        if (!mounted) return;
        setSessions(list);
      })
      .catch((e) => console.warn("[AI] sessions load failed", e))
      .finally(() => mounted && setHistoryLoading(false));
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const refreshSessions = async () => {
    if (!user?.id) return;
    try {
      const list = await yogaAIApi.listMySessions(user.id);
      setSessions(list);
    } catch {
      // ignore
    }
  };

  const openSession = async (threadId: string) => {
    if (!user?.id) return;
    setSessionSheetOpen(false);
    if (threadId === currentThreadId) return;
    setCurrentThreadId(threadId);
    setTurns([]);
    setHistoryLoading(true);
    try {
      const logs = await yogaAIApi.listLogsForThread(user.id, threadId);
      setTurns(logsToTurns(logs));
      setTimeout(
        () => scrollRef.current?.scrollToEnd({ animated: false }),
        80,
      );
    } catch (e) {
      console.warn("[AI] open session failed", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const startNewSession = () => {
    setSessionSheetOpen(false);
    setCurrentThreadId(uuid());
    setTurns([]);
  };

  const [renamingSession, setRenamingSession] = useState<Session | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const openRename = (s: Session) => {
    setSessionSheetOpen(false);
    // 시트가 닫히는 애니메이션 끝난 뒤 rename 모달 표시
    setTimeout(() => {
      setRenamingSession(s);
      setRenameDraft(s.title);
    }, 250);
  };

  const submitRename = async (value: string) => {
    if (!user?.id || !renamingSession) return;
    try {
      await yogaAIApi.updateSessionTitle(
        user.id,
        renamingSession.threadId,
        value,
      );
      setRenamingSession(null);
      await refreshSessions();
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "다시 시도해 주세요.");
    }
  };

  const confirmDelete = (s: Session) => {
    Alert.alert(
      "대화 삭제",
      `"${s.title}" 대화를 삭제할까요? 메시지 기록이 완전히 사라집니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            if (!user?.id) return;
            try {
              await yogaAIApi.deleteSession(user.id, s.threadId);
              // 현재 보고 있는 세션이 삭제됐다면 새 세션으로 전환
              if (s.threadId === currentThreadId) {
                setCurrentThreadId(uuid());
                setTurns([]);
              }
              await refreshSessions();
            } catch (e: any) {
              Alert.alert("삭제 실패", e?.message ?? "다시 시도해 주세요.");
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (initialQuestion && !autoSentRef.current) {
      autoSentRef.current = true;
      setInput(initialQuestion);
      // 다음 tick 에 자동 전송
      setTimeout(() => {
        handleAskWith(initialQuestion);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  const handleAskWith = async (q: string) => {
    if (!q || busy) return;
    setBusy(true);
    setInput("");
    const turnIndex = turns.length;
    // 빈 thread (이전 대화 가상 세션) 이거나 미정이면 새 thread 생성
    let tid = currentThreadId;
    if (!tid || tid === "") {
      tid = uuid();
      setCurrentThreadId(tid);
    }
    setTurns((prev) => [...prev, { question: q }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const res = await yogaAIApi.ask({
        question: q,
        threadId: tid,
      });
      setTurns((prev) => {
        const copy = [...prev];
        copy[turnIndex] = { question: q, response: res };
        return copy;
      });
      // 매번 세션 목록 갱신 (마지막 활동 시간/카운트 업데이트)
      refreshSessions();
    } catch (e: any) {
      const msg = e?.message ?? "답변 생성 중 오류가 발생했어요.";
      setTurns((prev) => {
        const copy = [...prev];
        copy[turnIndex] = { question: q, error: msg };
        return copy;
      });
      Alert.alert("실패", msg);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleAsk = () => handleAskWith(input.trim());

  const rateAnswer = async (turnIndex: number, rating: 1 | -1) => {
    const t = turns[turnIndex];
    if (!t?.response?.log_id) return;
    const newRating = t.rating === rating ? undefined : rating;
    // 로컬 우선 업데이트
    setTurns((prev) => {
      const copy = [...prev];
      copy[turnIndex] = { ...copy[turnIndex], rating: newRating };
      return copy;
    });
    try {
      await yogaAIApi.rateAnswer(t.response.log_id, newRating ?? 0 as any);
    } catch {
      // 실패 시 롤백 — 사용자엔 알리지 않음
      setTurns((prev) => {
        const copy = [...prev];
        copy[turnIndex] = { ...copy[turnIndex], rating: t.rating };
        return copy;
      });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title="옴"
        serif={false}
        eyebrow="AI Talk Beta"
        trailingSlot={
          <TouchableOpacity
            onPress={() => {
              refreshSessions();
              setSessionSheetOpen(true);
            }}
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
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {turns.length === 0 && !historyLoading ? (
            <View style={styles.intro}>
              <View style={styles.introIcon}>
                <Ionicons name="sparkles" size={26} color={COLORS.primary} />
              </View>
              <Text style={styles.introTitle}>옴</Text>
              <Text style={styles.introText}>
                자세, 호흡, 시퀀스에 대해 자유롭게 물어보세요.{"\n"}
                등록된 요가 자료를 기반으로 답해드립니다.
              </Text>
              <View style={styles.suggestionList}>
                {SUGGESTIONS.map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={styles.suggestion}
                    onPress={() => handleAskWith(q)}
                    activeOpacity={0.7}
                  >
                    <IconBadge name="bulb-outline" size={28} color={COLORS.primary} />
                    <Text style={styles.suggestionText}>{q}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.disclaimerRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={12}
                  color={COLORS.textMuted}
                />
                <Text style={styles.disclaimerText}>
                  통증, 부상, 임신 관련 질문엔 지도자/의료진 상담을 권유해요.
                </Text>
              </View>
            </View>
          ) : null}

          {turns.map((t, idx) => (
            <View key={idx} style={styles.turn}>
              <View style={styles.qBubbleRow}>
                <View style={styles.qBubble}>
                  <Text style={styles.qText}>{t.question}</Text>
                </View>
              </View>

              {t.response ? (
                <View style={styles.aRow}>
                  <View style={styles.aAvatar}>
                    <Ionicons
                      name="sparkles"
                      size={14}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.aContent}>
                    {t.response.safety_notice_required ? (
                      <View style={styles.safetyBanner}>
                        <Ionicons
                          name="warning-outline"
                          size={14}
                          color={COLORS.warning}
                        />
                        <Text style={styles.safetyText}>
                          통증, 부상, 만성질환 관련 질문이에요. 정확한 판단은
                          지도자/의료진과 상담하세요.
                        </Text>
                      </View>
                    ) : null}
                    <Text style={styles.aText}>
                      {stripMarkdown(t.response.answer)}
                    </Text>
                    {t.response.sources.length > 0 ? (
                      <View style={styles.sourceRow}>
                        <Ionicons
                          name="book-outline"
                          size={11}
                          color={COLORS.textMuted}
                        />
                        {t.response.sources.map((s) => (
                          <View key={s.id} style={styles.sourceChip}>
                            <Text
                              style={styles.sourceChipText}
                              numberOfLines={1}
                            >
                              {s.title}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                    {t.response.log_id ? (
                      <View style={styles.feedbackRow}>
                        <TouchableOpacity
                          onPress={() => rateAnswer(idx, 1)}
                          style={[
                            styles.feedbackBtn,
                            t.rating === 1 && styles.feedbackBtnUpActive,
                          ]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="thumbs-up"
                            size={13}
                            color={
                              t.rating === 1
                                ? COLORS.success
                                : COLORS.textMuted
                            }
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => rateAnswer(idx, -1)}
                          style={[
                            styles.feedbackBtn,
                            t.rating === -1 && styles.feedbackBtnDownActive,
                          ]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="thumbs-down"
                            size={13}
                            color={
                              t.rating === -1
                                ? COLORS.error
                                : COLORS.textMuted
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : t.error ? (
                <View style={styles.aRow}>
                  <View style={styles.aAvatar}>
                    <Ionicons
                      name="alert"
                      size={14}
                      color={COLORS.error}
                    />
                  </View>
                  <View style={[styles.aContent, styles.errorBubble]}>
                    <Text style={styles.errorText}>{t.error}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.aRow}>
                  <View style={styles.aAvatar}>
                    <Ionicons
                      name="sparkles"
                      size={14}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.aLoading}>
                    <ActivityIndicator color={COLORS.primary} size="small" />
                    <Text style={styles.aLoadingText}>답변 작성 중…</Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="요가에 대해 물어보세요"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            multiline
            maxLength={1000}
            editable={!busy}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || busy) && { opacity: 0.4 }]}
            onPress={handleAsk}
            disabled={!input.trim() || busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Ionicons name="send" size={16} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <SideSheet
        visible={sessionSheetOpen}
        onClose={() => setSessionSheetOpen(false)}
        title="대화함"
        actionLabel="새 대화"
        onActionPress={startNewSession}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {sessions.length === 0 ? (
            <Text style={styles.sheetEmpty}>아직 기록된 대화가 없어요.</Text>
          ) : (
            sessions.map((s) => {
              const active = s.threadId === currentThreadId;
              const isLegacy = s.threadId === "";
              return (
                <SessionRow
                  key={s.threadId || "_legacy"}
                  iconName={active ? "chatbubble" : "chatbubble-outline"}
                  title={s.title}
                  subtitle={`${s.count}개 메시지, ${s.lastAt.slice(0, 10)}`}
                  active={active}
                  onPress={() => openSession(s.threadId)}
                  onRename={isLegacy ? undefined : () => openRename(s)}
                  onDelete={() => confirmDelete(s)}
                />
              );
            })
          )}
        </ScrollView>
      </SideSheet>

      <RenameDialog
        visible={!!renamingSession}
        title="대화 제목 변경"
        placeholder="제목을 입력하세요"
        initialValue={renameDraft}
        onCancel={() => setRenamingSession(null)}
        onSubmit={submitRename}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.lg },
  intro: {
    alignItems: "center",
    gap: 8,
    paddingVertical: SPACING.xl,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(139, 92, 246, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  introTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  introText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  suggestionList: {
    width: "100%",
    gap: 8,
    marginTop: SPACING.lg,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  disclaimerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: SPACING.lg,
    paddingHorizontal: 4,
  },
  disclaimerText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  turn: { marginBottom: SPACING.lg },
  qBubbleRow: { alignItems: "flex-end", marginBottom: SPACING.md },
  qBubble: {
    maxWidth: "85%",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    borderTopRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  qText: { ...TEXT.body, color: COLORS.white, lineHeight: 21 },
  aRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  aAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(139, 92, 246, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  aContent: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 8,
  },
  errorBubble: {
    borderColor: COLORS.error,
    backgroundColor: "rgba(248, 113, 113, 0.08)",
  },
  errorText: { color: COLORS.error, ...TEXT.body, lineHeight: 21 },
  aText: { ...TEXT.body, color: COLORS.text, lineHeight: 22 },
  safetyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: "rgba(245, 158, 11, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  safetyText: {
    flex: 1,
    color: COLORS.warning,
    fontSize: 12,
    lineHeight: 18,
  },
  sourceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    alignItems: "center",
  },
  sourceChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceDark,
    maxWidth: 160,
  },
  sourceChipText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "600" },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 6,
  },
  feedbackBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceDark,
  },
  feedbackBtnUpActive: {
    backgroundColor: "rgba(16, 185, 129, 0.18)",
  },
  feedbackBtnDownActive: {
    backgroundColor: "rgba(248, 113, 113, 0.18)",
  },
  aLoading: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aLoadingText: { ...TEXT.caption, color: COLORS.textSecondary },
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
