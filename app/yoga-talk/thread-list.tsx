import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../components/ui/Avatar";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { RenameDialog } from "../../components/ui/RenameDialog";
import { Sheet } from "../../components/ui/Sheet";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { usePivotStudios } from "../../hooks/usePivotStudios";
import { useRoles } from "../../hooks/useRoles";
import { useStudentStudios } from "../../hooks/useStudentStudios";
import { chatApi, type ChatRoom } from "../../lib/api/chat";
import {
  chatFoldersApi,
  itemKey,
  type ChatFolder,
  type FolderItem,
  type FolderItemType,
} from "../../lib/api/chatFolders";
import { yogaTalkApi, type ThreadSummary } from "../../lib/api/yogaTalk";
import { supabase } from "../../lib/supabase";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter =
  | { kind: "all" }
  | { kind: "unread" }
  | { kind: "folder"; id: string };
type AddTarget = { type: FolderItemType; id: string; name: string };

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

// 1:1 대화의 읽음 상태 — 필터/뱃지 공통 사용
function threadIsUnread(t: ThreadSummary, isTeacher: boolean): boolean {
  const lastMsg = t.last_message;
  if (!lastMsg) return false;
  const fromMe = isTeacher
    ? lastMsg.sender_type === "teacher"
    : lastMsg.sender_type === "student";
  if (fromMe) return false;
  const lastTs = lastMsg.created_at ?? null;
  return !(t.my_read_at && lastTs && t.my_read_at >= lastTs);
}

export default function YogaTalkThreadListScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { isTeacher } = useRoles();
  const { activeStudio } = usePivotStudios();
  const { memberships, loaded: studiosLoaded } = useStudentStudios();

  const headerActions = (
    <View style={styles.headerActions}>
      {isTeacher && activeStudio ? (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("ChatGroupCreate", {
              studioId: activeStudio.id,
            })
          }
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.newBtn}
          accessibilityLabel="그룹 채팅 만들기"
        >
          <Ionicons name="chatbubbles-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      ) : null}
      <NewMessageBtn onPress={() => setNewOpen(true)} />
    </View>
  );

  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [roomCounts, setRoomCounts] = useState<Map<string, number>>(new Map());
  const [roomUnread, setRoomUnread] = useState<Set<string>>(new Set());
  const [roomDigest, setRoomDigest] = useState<
    Map<
      string,
      { body: string; created_at: string; sender_id: string; unread: boolean }
    >
  >(new Map());
  const [studioNames, setStudioNames] = useState<Map<string, string>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);

  // 폴더 / 필터
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [folderItems, setFolderItems] = useState<FolderItem[]>([]);
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [addTarget, setAddTarget] = useState<AddTarget | null>(null);
  // 폴더 관리 시트: manageOpen=열림, manageFolderId=상세(편집) 중인 폴더
  const [manageOpen, setManageOpen] = useState(false);
  const [manageFolderId, setManageFolderId] = useState<string | null>(null);
  const [folderDialog, setFolderDialog] = useState<{
    mode: "create" | "rename";
    id?: string;
    initial?: string;
  } | null>(null);

  const loadFolders = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [f, items] = await Promise.all([
        chatFoldersApi.listFolders(),
        chatFoldersApi.listItems(),
      ]);
      setFolders(f);
      setFolderItems(items);
    } catch (e) {
      console.warn("[YogaTalkList] folders failed", e);
    }
  }, [user?.id]);

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

  const activeStudioId = activeStudio?.id ?? null;
  const activeStudioName = activeStudio?.name ?? null;
  const activeStudioQna = activeStudio?.qna_enabled ?? false;

  const loadRooms = useCallback(async () => {
    if (!user?.id) return;
    // 선생님: 활성 요가원, 수련생: 가입한 요가원들
    const studioList: { id: string; name: string }[] = isTeacher
      ? activeStudioId
        ? [{ id: activeStudioId, name: activeStudioName ?? "요가원" }]
        : []
      : memberships.map((m) => ({ id: m.studio.id, name: m.studio.name }));
    const uniq = Array.from(
      new Map(studioList.map((s) => [s.id, s] as const)).values(),
    );
    if (uniq.length === 0) {
      setRooms([]);
      return;
    }
    // 선생님 + Q&A 사용 시 요가원 전체방을 미리 생성
    if (isTeacher && activeStudioId && activeStudioQna) {
      await chatApi
        .getOrCreateStudioRoom(activeStudioId)
        .catch(() => undefined);
    }
    try {
      const results = await Promise.all(
        uniq.map((s) => chatApi.listRooms(s.id).catch(() => [] as ChatRoom[])),
      );
      const all = Array.from(
        new Map(results.flat().map((r) => [r.id, r])).values(),
      );
      // studio 방 먼저, 그다음 그룹방 — 최근 활동순
      all.sort((a, b) => {
        if (a.scope !== b.scope) return a.scope === "studio" ? -1 : 1;
        return (b.last_activity_at ?? "").localeCompare(
          a.last_activity_at ?? "",
        );
      });
      setRooms(all);
      setStudioNames(new Map(uniq.map((s) => [s.id, s.name])));
      const [counts, digest] = await Promise.all([
        chatApi.memberCounts(
          all.filter((r) => r.scope === "group").map((r) => r.id),
        ),
        chatApi.roomDigest(
          all.map((r) => r.id),
          user.id,
        ),
      ]);
      setRoomCounts(counts);
      setRoomDigest(digest);
      setRoomUnread(
        new Set(
          Array.from(digest.entries())
            .filter(([, v]) => v.unread)
            .map(([k]) => k),
        ),
      );
    } catch (e) {
      console.warn("[YogaTalkList] rooms failed", e);
    }
  }, [
    user?.id,
    isTeacher,
    activeStudioId,
    activeStudioName,
    activeStudioQna,
    memberships,
  ]);

  useFocusEffect(
    useCallback(() => {
      // 재포커스 시 캐시된 목록 유지, 백그라운드로만 새로고침
      load();
      loadRooms();
      loadFolders();
    }, [load, loadRooms, loadFolders]),
  );

  const openRoom = (r: ChatRoom) => {
    // 들어가는 즉시 읽음 처리 — 돌아왔을 때 안읽음에서 깜빡이지 않도록
    setRoomUnread((prev) => {
      if (!prev.has(r.id)) return prev;
      const next = new Set(prev);
      next.delete(r.id);
      return next;
    });
    const studioName = studioNames.get(r.studio_id) ?? "요가원";
    navigation.navigate("ChatRoom", {
      roomId: r.id,
      title:
        r.scope === "studio" ? `${studioName} 전체` : r.title || "그룹 대화",
      asTeacher: isTeacher,
    });
  };

  const openThread = (t: ThreadSummary) => {
    // 읽음 시각을 낙관적으로 갱신 → 돌아왔을 때 안읽음에서 깜빡임 방지
    setThreads((prev) =>
      prev.map((x) =>
        x.id === t.id ? { ...x, my_read_at: new Date().toISOString() } : x,
      ),
    );
    navigation.navigate("YogaTalkThread", { threadId: t.id });
  };

  // 활성 폴더에 담긴 아이템 키 집합
  const folderKeySet = useMemo(() => {
    if (filter.kind !== "folder") return null;
    return new Set(
      folderItems
        .filter((i) => i.folder_id === filter.id)
        .map((i) => itemKey(i.item_type, i.item_id)),
    );
  }, [filter, folderItems]);

  const visibleRooms = useMemo(
    () =>
      rooms.filter((r) => {
        if (filter.kind === "unread") return roomUnread.has(r.id);
        if (filter.kind === "folder")
          return folderKeySet?.has(itemKey("room", r.id)) ?? false;
        return true;
      }),
    [rooms, filter, roomUnread, folderKeySet],
  );

  const visibleThreads = useMemo(
    () =>
      threads.filter((t) => {
        if (filter.kind === "unread") return threadIsUnread(t, isTeacher);
        if (filter.kind === "folder")
          return folderKeySet?.has(itemKey("thread", t.id)) ?? false;
        return true;
      }),
    [threads, filter, isTeacher, folderKeySet],
  );

  const totalUnread = useMemo(
    () =>
      threads.filter((t) => threadIsUnread(t, isTeacher)).length +
      roomUnread.size,
    [threads, isTeacher, roomUnread],
  );

  // 폴더별 안읽음 개수 (폴더 칩 뱃지용)
  const folderUnreadCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of folders) {
      const keys = new Set(
        folderItems
          .filter((i) => i.folder_id === f.id)
          .map((i) => itemKey(i.item_type, i.item_id)),
      );
      let n = 0;
      for (const r of rooms)
        if (roomUnread.has(r.id) && keys.has(itemKey("room", r.id))) n++;
      for (const t of threads)
        if (threadIsUnread(t, isTeacher) && keys.has(itemKey("thread", t.id)))
          n++;
      m.set(f.id, n);
    }
    return m;
  }, [folders, folderItems, rooms, threads, roomUnread, isTeacher]);

  // addTarget 이 담긴 폴더 id 집합
  const targetFolderIds = useMemo(() => {
    if (!addTarget) return new Set<string>();
    return new Set(
      folderItems
        .filter(
          (i) => i.item_type === addTarget.type && i.item_id === addTarget.id,
        )
        .map((i) => i.folder_id),
    );
  }, [addTarget, folderItems]);

  const setItemFolder = async (
    folderId: string,
    type: FolderItemType,
    id: string,
    on: boolean,
  ) => {
    try {
      if (on) await chatFoldersApi.addItem(folderId, type, id);
      else await chatFoldersApi.removeItem(folderId, type, id);
      await loadFolders();
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    }
  };

  const toggleItemInFolder = async (folderId: string, on: boolean) => {
    if (!addTarget) return;
    await setItemFolder(folderId, addTarget.type, addTarget.id, on);
  };

  // 폴더 편집 시트용: 전체 채팅 목록 + 현재 폴더에 담긴 키
  const allChats = useMemo(
    () => [
      ...rooms.map((r) => ({
        type: "room" as FolderItemType,
        id: r.id,
        name:
          r.scope === "studio"
            ? `${studioNames.get(r.studio_id) ?? "요가원"} 전체`
            : r.title || "그룹 대화",
        isRoom: true,
      })),
      ...threads.map((t) => ({
        type: "thread" as FolderItemType,
        id: t.id,
        name: t.counterpart_name ?? t.class_title ?? t.title ?? "대화",
        isRoom: false,
      })),
    ],
    [rooms, threads, studioNames],
  );

  const editFolderKeySet = useMemo(() => {
    if (!manageFolderId) return new Set<string>();
    return new Set(
      folderItems
        .filter((i) => i.folder_id === manageFolderId)
        .map((i) => itemKey(i.item_type, i.item_id)),
    );
  }, [manageFolderId, folderItems]);

  // 폴더별 담긴 채팅 수
  const folderCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of folderItems)
      m.set(i.folder_id, (m.get(i.folder_id) ?? 0) + 1);
    return m;
  }, [folderItems]);

  const manageFolder = folders.find((f) => f.id === manageFolderId) ?? null;

  const submitFolderDialog = async (value: string) => {
    const name = value.trim();
    if (!name) return;
    const dialog = folderDialog;
    setFolderDialog(null);
    try {
      if (dialog?.mode === "rename" && dialog.id) {
        await chatFoldersApi.renameFolder(dialog.id, name);
      } else {
        const created = await chatFoldersApi.createFolder(name);
        // 폴더 추가 시트에서 새 폴더를 만든 경우 바로 담기
        if (addTarget) {
          await chatFoldersApi.addItem(
            created.id,
            addTarget.type,
            addTarget.id,
          );
        }
      }
      await loadFolders();
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    }
  };

  const confirmDeleteFolder = (f: ChatFolder) => {
    Alert.alert("폴더 삭제", `'${f.name}' 폴더를 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await chatFoldersApi.deleteFolder(f.id);
            if (filter.kind === "folder" && filter.id === f.id)
              setFilter({ kind: "all" });
            setManageFolderId(null);
            await loadFolders();
          } catch (e: any) {
            Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
          }
        },
      },
    ]);
  };

  const closeManage = () => {
    setManageOpen(false);
    setManageFolderId(null);
  };

  const filterBar = (
    <View style={styles.filterBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBarContent}
        style={styles.filterScroll}
      >
        <FilterChip
          label="전체"
          active={filter.kind === "all"}
          onPress={() => setFilter({ kind: "all" })}
        />
        <FilterChip
          label="안읽음"
          badge={totalUnread > 0 ? totalUnread : undefined}
          active={filter.kind === "unread"}
          onPress={() => setFilter({ kind: "unread" })}
        />
        {folders.map((f) => (
          <FilterChip
            key={f.id}
            label={f.name}
            badge={folderUnreadCounts.get(f.id) || undefined}
            active={filter.kind === "folder" && filter.id === f.id}
            onPress={() => setFilter({ kind: "folder", id: f.id })}
          />
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.manageBtn}
        onPress={() => setManageOpen(true)}
        accessibilityLabel="폴더 관리"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="folder-outline"
          size={20}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );

  // 그룹방 / 1:1 통합 — 최신 활동순 한 목록
  const visibleItems = useMemo(() => {
    const roomItems = visibleRooms.map((r) => ({
      kind: "room" as const,
      id: r.id,
      ts:
        roomDigest.get(r.id)?.created_at ??
        r.last_activity_at ??
        r.created_at ??
        "",
      room: r,
    }));
    const threadItems = visibleThreads.map((t) => ({
      kind: "thread" as const,
      id: t.id,
      ts: t.last_activity_at ?? t.created_at ?? "",
      thread: t,
    }));
    return [...roomItems, ...threadItems].sort((a, b) =>
      (b.ts ?? "").localeCompare(a.ts ?? ""),
    );
  }, [visibleRooms, visibleThreads, roomDigest]);

  const renderRoomRow = (r: ChatRoom) => {
    const unread = roomUnread.has(r.id);
    const studioName = studioNames.get(r.studio_id) ?? "요가원";
    const title =
      r.scope === "studio" ? `${studioName} 전체 Q&A` : r.title || "그룹 대화";
    const digest = roomDigest.get(r.id);
    // 그룹방도 1:1처럼 최신 메시지를 미리보기로 — 내가 보낸 건 "나:" prefix
    let sub: string;
    if (digest) {
      const mine = digest.sender_id === user?.id;
      sub = mine ? `나: ${digest.body}` : digest.body;
    } else if (r.scope === "studio") {
      sub = "요가원 전체 채널";
    } else {
      sub = `멤버 ${roomCounts.get(r.id) ?? 0}명`;
    }
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => openRoom(r)}
        onLongPress={() =>
          setAddTarget({
            type: "room",
            id: r.id,
            name:
              r.scope === "studio"
                ? `${studioName} 전체`
                : r.title || "그룹 대화",
          })
        }
        activeOpacity={0.7}
      >
        <View>
          {r.image_url ? (
            <Image source={{ uri: r.image_url }} style={styles.roomAvatar} />
          ) : (
            <View style={styles.roomAvatar}>
              <Ionicons name="chatbubbles" size={22} color={COLORS.primary} />
            </View>
          )}
          {unread ? <View style={styles.avatarUnreadDot} /> : null}
        </View>
        <View style={styles.rowMain}>
          <Text
            style={[styles.rowName, unread && styles.rowNameUnread]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={[styles.rowSub, unread && styles.rowSubUnread]}
            numberOfLines={1}
          >
            {sub}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.rowTime}>
            {ago(digest?.created_at ?? r.last_activity_at ?? r.created_at)}
          </Text>
          {unread ? <View style={styles.unreadDot} /> : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderThreadRow = (t: ThreadSummary) => {
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

    const receipt =
      fromMe && status === "read"
        ? "읽음"
        : fromMe && status === "sent"
          ? "전송됨"
          : null;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => openThread(t)}
        onLongPress={() => setAddTarget({ type: "thread", id: t.id, name })}
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
              style={[styles.receipt, status === "read" && styles.receiptRead]}
            >
              {receipt}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && threads.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <PageHeader trailingSlot={headerActions} />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const nothingVisible = visibleItems.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageHeader trailingSlot={headerActions} />
      {filterBar}

      <FlatList
        contentContainerStyle={[
          styles.list,
          nothingVisible && styles.listEmpty,
        ]}
        data={visibleItems}
        keyExtractor={(it) => `${it.kind}:${it.id}`}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={
          filter.kind === "unread" ? (
            <EmptyState
              icon="✅"
              title="안 읽은 대화가 없어요"
              description={"모든 대화를 확인했어요."}
            />
          ) : filter.kind === "folder" ? (
            <EmptyState
              icon="📁"
              title="이 폴더에 담긴 대화가 없어요"
              description={"우측 상단 폴더 아이콘에서\n채팅방을 담아보세요."}
            />
          ) : (
            <EmptyState
              icon="💬"
              title="아직 대화가 없어요"
              description={
                isTeacher
                  ? "수련생 상세에서 대화를 시작할 수 있어요.\n수업별로 묶어서 이력이 기록됩니다."
                  : "수업 상세에서 요가톡으로 선생님에게\n메시지를 남겨보세요."
              }
            />
          )
        }
        renderItem={({ item }) =>
          item.kind === "room"
            ? renderRoomRow(item.room)
            : renderThreadRow(item.thread)
        }
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

      {/* 채팅을 폴더에 담기 */}
      <Sheet
        visible={!!addTarget}
        onClose={() => setAddTarget(null)}
        title="폴더에 추가"
      >
        {addTarget ? (
          <Text style={styles.addTargetName} numberOfLines={1}>
            {addTarget.name}
          </Text>
        ) : null}
        {folders.length === 0 ? (
          <Text style={styles.addEmptyText}>
            아직 폴더가 없어요. 새 폴더를 만들어 담아보세요.
          </Text>
        ) : (
          folders.map((f) => {
            const on = targetFolderIds.has(f.id);
            return (
              <TouchableOpacity
                key={f.id}
                style={styles.addFolderRow}
                onPress={() => toggleItemInFolder(f.id, !on)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={on ? "folder" : "folder-outline"}
                  size={18}
                  color={on ? COLORS.primary : COLORS.textSecondary}
                />
                <Text style={styles.addFolderName} numberOfLines={1}>
                  {f.name}
                </Text>
                <View style={[styles.check, on && styles.checkOn]}>
                  {on ? (
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <TouchableOpacity
          style={styles.newFolderRow}
          onPress={() => setFolderDialog({ mode: "create" })}
          activeOpacity={0.7}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={COLORS.primary}
          />
          <Text style={styles.newFolderText}>새 폴더 만들기</Text>
        </TouchableOpacity>
      </Sheet>

      {/* 폴더 관리: 목록 ↔ 상세(편집 + 채팅방 추가) */}
      <Sheet
        visible={manageOpen}
        onClose={closeManage}
        title={manageFolder ? manageFolder.name : "폴더 관리"}
      >
        {manageFolder ? (
          // 상세: 이름변경 / 삭제 + 채팅방 담기
          <View>
            <TouchableOpacity
              style={styles.manageBackRow}
              onPress={() => setManageFolderId(null)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.manageBackText}>폴더 목록</Text>
            </TouchableOpacity>

            <View style={styles.detailActions}>
              <TouchableOpacity
                style={styles.detailActionBtn}
                onPress={() =>
                  setFolderDialog({
                    mode: "rename",
                    id: manageFolder.id,
                    initial: manageFolder.name,
                  })
                }
              >
                <Ionicons name="create-outline" size={16} color={COLORS.text} />
                <Text style={styles.detailActionText}>이름 변경</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.detailActionBtn}
                onPress={() => confirmDeleteFolder(manageFolder)}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                <Text
                  style={[styles.detailActionText, { color: COLORS.error }]}
                >
                  삭제
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.detailLabel}>채팅방</Text>
            {allChats.length === 0 ? (
              <Text style={styles.addEmptyText}>
                담을 수 있는 대화가 없어요.
              </Text>
            ) : (
              <ScrollView style={styles.pickerScroll}>
                {allChats.map((c) => {
                  const on = editFolderKeySet.has(itemKey(c.type, c.id));
                  return (
                    <TouchableOpacity
                      key={itemKey(c.type, c.id)}
                      style={styles.addFolderRow}
                      onPress={() =>
                        setItemFolder(manageFolder.id, c.type, c.id, !on)
                      }
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={
                          c.isRoom ? "chatbubbles-outline" : "person-outline"
                        }
                        size={18}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.addFolderName} numberOfLines={1}>
                        {c.name}
                      </Text>
                      <View style={[styles.check, on && styles.checkOn]}>
                        {on ? (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color={COLORS.white}
                          />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        ) : (
          // 목록: 폴더 선택 + 새 폴더 만들기
          <View>
            {folders.length === 0 ? (
              <Text style={styles.addEmptyText}>
                아직 폴더가 없어요. 새 폴더를 만들어보세요.
              </Text>
            ) : (
              folders.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={styles.addFolderRow}
                  onPress={() => setManageFolderId(f.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="folder-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.addFolderName} numberOfLines={1}>
                    {f.name}
                  </Text>
                  <Text style={styles.folderCount}>
                    {folderCounts.get(f.id) ?? 0}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              style={styles.newFolderRow}
              onPress={() => setFolderDialog({ mode: "create" })}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.newFolderText}>새 폴더 만들기</Text>
            </TouchableOpacity>
          </View>
        )}
      </Sheet>

      <RenameDialog
        visible={!!folderDialog}
        title={folderDialog?.mode === "rename" ? "폴더 이름 변경" : "새 폴더"}
        placeholder="폴더 이름"
        initialValue={folderDialog?.initial ?? ""}
        saveLabel={folderDialog?.mode === "rename" ? "변경" : "만들기"}
        maxLength={20}
        onCancel={() => setFolderDialog(null)}
        onSubmit={submitFolderDialog}
      />

      {/* 우측 하단 플로팅 - 옴 (AI 도우미) */}
      <TouchableOpacity
        style={styles.omFab}
        onPress={() => navigation.navigate("YogaAiAssistant")}
        activeOpacity={0.85}
        accessibilityLabel="옴"
      >
        <Image
          source={require("../../assets/images/om_icon.png")}
          style={styles.omFabIcon}
        />
        <Text style={styles.omFabLabel}>OM</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  active,
  badge,
  onPress,
  onLongPress,
}: {
  label: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
      {badge ? (
        <View style={styles.chipBadge}>
          <Text style={styles.chipBadgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
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
          const list =
            await teacherMod.teacherApi.listMyStudents(currentUserId);
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

  const startThread = async (contact: { id: string; name: string }) => {
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
  list: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  listEmpty: { flexGrow: 1, paddingTop: 0, paddingBottom: 0 },
  divider: { height: 1 },
  omFab: {
    position: "absolute",
    right: SPACING.lg,
    bottom: SPACING.lg + 8,
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(139, 92, 246, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  omFabIcon: {
    width: 26,
    height: 26,
    resizeMode: "contain",
    tintColor: COLORS.white,
  },
  omFabLabel: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginTop: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  rowMain: { flex: 1, gap: 2 },
  rowName: {
    ...TEXT.bodyMed,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 2 },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
    paddingBottom: SPACING.sm,
    paddingRight: SPACING.sm,
  },
  filterScroll: { flex: 1 },
  filterBarContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: SPACING.lg,
  },
  manageBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "700" },
  chipTextActive: { color: COLORS.white },
  chipBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: COLORS.error,
    alignItems: "center",
    justifyContent: "center",
  },
  chipBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: "800" },
  unreadText: { fontWeight: "800" },
  pickerScroll: { maxHeight: 320 },
  folderCount: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginRight: 2,
  },
  manageBackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: SPACING.sm,
  },
  manageBackText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  detailActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  detailActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  detailActionText: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  addTargetName: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: SPACING.sm,
  },
  addEmptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    paddingVertical: SPACING.md,
  },
  addFolderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  addFolderName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    backgroundColor: COLORS.surfaceDark,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  newFolderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  newFolderText: { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
  roomAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(139, 92, 246, 0.14)",
    alignItems: "center",
    justifyContent: "center",
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
