import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../components/ui/Avatar";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { useRoles } from "../../hooks/useRoles";
import { useStudentStudios } from "../../hooks/useStudentStudios";
import { yogaTalkApi, type ThreadSummary } from "../../lib/api/yogaTalk";
import { supabase } from "../../lib/supabase";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function ago(ts: string) {
  const d = new Date(ts).getTime();
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(ts).toISOString().slice(0, 10);
}

export default function YogaTalkThreadListScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { isTeacher } = useRoles();
  const { memberships, loaded: studiosLoaded } = useStudentStudios();

  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      if (isTeacher) {
        const t = await yogaTalkApi.listAsTeacher(user.id);
        setThreads(t);
      } else {
        // student 모드: memberships 로드 대기 후 student_profile 기준으로 조회
        if (!studiosLoaded) return;
        const profileIds = memberships.map((m) => m.studentProfileId);
        if (profileIds.length === 0) {
          setThreads([]);
          return;
        }
        const t = await yogaTalkApi.listAsStudent(profileIds);
        setThreads(t);
      }
    } catch (e) {
      console.warn("[YogaTalkList] failed", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isTeacher, memberships, studiosLoaded]);

  useFocusEffect(
    useCallback(() => {
      // 재포커스 시 캐시된 목록 유지, 백그라운드로만 새로고침
      load();
    }, [load]),
  );

  if (loading && threads.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <PageHeader trailingSlot={<NewMessageBtn onPress={() => setNewOpen(true)} />} />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageHeader trailingSlot={<NewMessageBtn onPress={() => setNewOpen(true)} />} />

      <FlatList
        contentContainerStyle={[
          styles.list,
          threads.length === 0 && styles.listEmpty,
        ]}
        data={threads}
        keyExtractor={(t) => t.id}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={
          <EmptyState
            icon="💬"
            title="아직 대화가 없어요"
            description={
              isTeacher
                ? "수련생 상세에서 대화를 시작할 수 있어요.\n수업별로 묶어서 이력이 기록됩니다."
                : "수업 상세에서 요가톡으로 선생님에게\n메시지를 남겨보세요."
            }
          />
        }
        renderItem={({ item: t }) => {
            const name = t.counterpart_name ?? t.class_title ?? t.title ?? "대화";
            const lastMsg = t.last_message;
            // 보낸 사람 판정은 내 역할 기준 — 선생님이면 teacher 발신이 내 메시지
            const fromMe = lastMsg
              ? isTeacher
                ? lastMsg.sender_type === "teacher"
                : lastMsg.sender_type === "student"
              : false;
            const lastTs = lastMsg?.created_at ?? null;
            const myRead = t.my_read_at;
            const cpRead = t.counterpart_read_at;

            let status: "none" | "sent" | "read" | "unread" = "none";
            if (lastMsg) {
              if (fromMe) {
                if (cpRead && lastTs && cpRead >= lastTs) status = "read";
                else status = "sent";
              } else {
                if (myRead && lastTs && myRead >= lastTs) status = "read";
                else status = "unread";
              }
            }

            const isUnread = status === "unread";

            // 인스타 스타일 미리보기: 실제 마지막 메시지 + 내가 보낸 건 "나:" prefix
            let preview: string;
            if (!lastMsg) preview = "메시지 시작하기";
            else if (fromMe) preview = `나: ${lastMsg.body}`;
            else preview = lastMsg.body;

            // 내가 보낸 메시지의 읽음 영수증
            const receipt =
              fromMe && status === "read"
                ? "읽음"
                : fromMe && status === "sent"
                  ? "전송됨"
                  : null;

            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() =>
                  navigation.navigate("YogaTalkThread", { threadId: t.id })
                }
                activeOpacity={0.7}
              >
                <View>
                  <Avatar name={name} colorKey={name} size={48} />
                  {isUnread ? <View style={styles.avatarUnreadDot} /> : null}
                </View>
                <View style={styles.rowMain}>
                  <Text
                    style={[styles.rowName, isUnread && styles.rowNameUnread]}
                    numberOfLines={1}
                  >
                    {name}
                  </Text>
                  <Text
                    style={[styles.rowSub, isUnread && styles.rowSubUnread]}
                    numberOfLines={1}
                  >
                    {t.class_title ? `${t.class_title}, ` : ""}
                    {preview}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowTime}>
                    {ago(t.last_activity_at ?? t.created_at)}
                  </Text>
                  {isUnread ? (
                    <View style={styles.unreadDot} />
                  ) : receipt ? (
                    <Text
                      style={[
                        styles.receipt,
                        status === "read" && styles.receiptRead,
                      ]}
                    >
                      {receipt}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
      />

      <NewMessageSheet
        visible={newOpen}
        onClose={() => setNewOpen(false)}
        currentUserId={user?.id ?? null}
        isTeacher={isTeacher}
        onPicked={(threadId) => {
          setNewOpen(false);
          navigation.navigate("YogaTalkThread", { threadId });
        }}
      />

      {/* 우측 하단 플로팅 - 옴 (AI 도우미) */}
      <TouchableOpacity
        style={styles.omFab}
        onPress={() => navigation.navigate("YogaAiAssistant")}
        activeOpacity={0.85}
        accessibilityLabel="옴"
      >
        <Ionicons name="sparkles" size={16} color={COLORS.white} />
        <Text style={styles.omFabLabel}>옴</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function NewMessageBtn({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={styles.newBtn}
    >
      <Ionicons name="create-outline" size={22} color={COLORS.text} />
    </TouchableOpacity>
  );
}

function NewMessageSheet({
  visible,
  onClose,
  currentUserId,
  isTeacher,
  onPicked,
}: {
  visible: boolean;
  onClose: () => void;
  currentUserId: string | null;
  isTeacher: boolean;
  onPicked: (threadId: string) => void;
}) {
  const [contacts, setContacts] = useState<
    { id: string; name: string; subtitle?: string }[]
  >([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !currentUserId) return;
    setLoading(true);
    (async () => {
      try {
        if (isTeacher) {
          // 선생님: 내 학생 목록
          const teacherMod = await import("../../lib/api/teacher");
          const list = await teacherMod.teacherApi.listMyStudents(currentUserId);
          setContacts(
            (list ?? []).map((s: any) => ({
              id: s.id,
              name: s.name,
              subtitle: s.phone ?? undefined,
            })),
          );
        } else {
          // 수련생: 담당 선생님 목록 (보통 1명)
          const { data: profiles } = await supabase
            .from("student_profiles")
            .select("id, teacher_id, studio_id")
            .eq("user_id", currentUserId);
          const teacherIds = Array.from(
            new Set((profiles ?? []).map((p: any) => p.teacher_id)),
          );
          if (teacherIds.length === 0) {
            setContacts([]);
            return;
          }
          const { data: teachers } = await supabase
            .from("user_profiles")
            .select("user_id, name")
            .in("user_id", teacherIds);
          // student_profile_id 를 contact.id 로 사용 (선생님 1명당 1 profile 가정)
          const tNameById = new Map<string, string>(
            (teachers ?? []).map((t: any) => [t.user_id, t.name ?? "선생님"]),
          );
          setContacts(
            (profiles ?? []).map((p: any) => ({
              id: p.id, // student_profile_id
              name: tNameById.get(p.teacher_id) ?? "선생님",
              subtitle: undefined,
            })),
          );
        }
      } catch (e) {
        console.warn("[NewMessageSheet] load failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, currentUserId, isTeacher]);

  const startThread = async (
    contact: { id: string; name: string },
  ) => {
    if (!currentUserId) return;
    setBusyId(contact.id);
    try {
      if (isTeacher) {
        // contact.id = student_profile_id
        const thread = await yogaTalkApi.getOrCreateThread({
          teacherUserId: currentUserId,
          studentProfileId: contact.id,
          classId: null,
          title: `${contact.name} 님과의 대화`,
          category: "general",
        });
        onPicked(thread.id);
      } else {
        // contact.id = student_profile_id (my own)
        // teacher_id 가져오기
        const { data: sp } = await supabase
          .from("student_profiles")
          .select("teacher_id")
          .eq("id", contact.id)
          .maybeSingle();
        if (!sp?.teacher_id) return;
        const thread = await yogaTalkApi.getOrCreateThread({
          teacherUserId: sp.teacher_id,
          studentProfileId: contact.id,
          classId: null,
          title: `${contact.name} 선생님과의 대화`,
          category: "general",
        });
        onPicked(thread.id);
      }
    } catch (e: any) {
      console.warn("[NewMessageSheet] start failed", e);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>새 메시지</Text>
          {loading ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ marginVertical: 24 }}
            />
          ) : contacts.length === 0 ? (
            <Text style={styles.sheetEmpty}>대화할 상대가 없어요.</Text>
          ) : (
            contacts.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.contactRow}
                onPress={() => startThread(c)}
                disabled={busyId === c.id}
                activeOpacity={0.7}
              >
                <Avatar name={c.name} colorKey={c.name} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{c.name}</Text>
                  {c.subtitle ? (
                    <Text style={styles.contactSub}>{c.subtitle}</Text>
                  ) : null}
                </View>
                {busyId === c.id ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={COLORS.textMuted}
                  />
                )}
              </TouchableOpacity>
            ))
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.xxl },
  listEmpty: { flexGrow: 1, paddingTop: 0, paddingBottom: 0 },
  divider: { height: 1 },
  omFab: {
    position: "absolute",
    right: SPACING.lg,
    bottom: SPACING.lg + 8,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(139, 92, 246, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingTop: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  omFabLabel: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.2,
    marginTop: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  rowMain: { flex: 1, gap: 2 },
  rowName: { ...TEXT.bodyMed, color: COLORS.text, fontSize: 15, fontWeight: "600" },
  rowNameUnread: { color: COLORS.text, fontWeight: "800" },
  rowSub: { color: COLORS.textMuted, fontSize: 12 },
  rowSubUnread: { color: COLORS.text, fontWeight: "700" },
  receipt: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700" },
  receiptRead: { color: COLORS.primary },
  rowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  rowTime: { color: COLORS.textMuted, fontSize: 11 },
  avatarUnreadDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  newBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.lg,
    paddingTop: 8,
    paddingBottom: SPACING.xxl,
    maxHeight: "70%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  sheetEmpty: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 24,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  contactName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  contactSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
