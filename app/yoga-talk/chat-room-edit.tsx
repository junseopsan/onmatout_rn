import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { PillInput } from "../../components/ui/PillInput";
import { SearchBar } from "../../components/ui/SearchBar";
import { Sheet } from "../../components/ui/Sheet";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { useAuth } from "../../hooks/useAuth";
import { chatApi } from "../../lib/api/chat";
import { storageAPI } from "../../lib/api/storage";
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";
import type { StudentProfile } from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "ChatRoomEdit">;
type Member = { user_id: string; role: string; name: string | null };

export default function ChatRoomEditScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { user } = useAuth();
  const { roomId } = route.params;

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [query, setQuery] = useState("");

  const loadMembers = async () => {
    const m = await chatApi.listRoomMembers(roomId);
    setMembers(m);
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await chatApi.getRoom(roomId);
        if (r) {
          setTitle(r.title ?? "");
          setImageUrl(r.image_url ?? null);
        }
        await loadMembers();
        if (user?.id && r) {
          const list = await teacherApi.listMyStudents(user.id, r.studio_id);
          setStudents(
            list.filter((s) => !!s.user_id && s.status === "active"),
          );
        }
      } catch (e) {
        console.warn("[ChatRoomEdit] load failed", e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const memberIds = useMemo(
    () => new Set(members.map((m) => m.user_id)),
    [members],
  );

  const inviteCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => !memberIds.has(s.user_id!))
      .filter((s) => (q ? s.name.toLowerCase().includes(q) : true));
  }, [students, memberIds, query]);

  const pickImage = async () => {
    if (!user?.id || uploading) return;
    setUploading(true);
    try {
      const res = await storageAPI.uploadChatGroupImage(user.id);
      if (res.success && res.url) setImageUrl(res.url);
      else if (!res.canceled && res.message) Alert.alert("실패", res.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await chatApi.updateGroupRoom({
        roomId,
        title: title.trim(),
        imageUrl,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
      setSaving(false);
    }
  };

  const removeMember = (m: Member) => {
    Alert.alert("멤버 내보내기", `${m.name ?? "멤버"} 님을 내보낼까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "내보내기",
        style: "destructive",
        onPress: async () => {
          try {
            await chatApi.removeGroupMember(roomId, m.user_id);
            await loadMembers();
          } catch (e: any) {
            Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
          }
        },
      },
    ]);
  };

  const addMember = async (s: StudentProfile) => {
    try {
      await chatApi.addGroupMember(roomId, s.user_id!);
      await loadMembers();
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title="그룹방 수정"
        serif={false}
      />

      {loading ? null : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.photoWrap}>
              <TouchableOpacity
                style={styles.photoCircle}
                onPress={pickImage}
                activeOpacity={0.8}
                disabled={uploading}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.photo} />
                ) : (
                  <Ionicons
                    name="chatbubbles"
                    size={32}
                    color={COLORS.primary}
                  />
                )}
                <View style={styles.photoBadge}>
                  <Ionicons name="camera" size={14} color={COLORS.white} />
                </View>
              </TouchableOpacity>
              <Text style={styles.photoHint}>
                {uploading ? "업로드 중…" : "사진 변경"}
              </Text>
            </View>

            <PillInput
              label="그룹 채팅방 이름"
              required
              value={title}
              onChangeText={setTitle}
              placeholder="예) 초급반 Q&A"
              maxLength={30}
            />

            <View style={styles.memberHeader}>
              <Text style={styles.label}>멤버 ({members.length}명)</Text>
              <TouchableOpacity
                style={styles.inviteBtn}
                onPress={() => setInviteOpen(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="person-add" size={14} color={COLORS.primary} />
                <Text style={styles.inviteBtnText}>멤버 초대</Text>
              </TouchableOpacity>
            </View>

            {members.map((m) => {
              const isOwner = m.role === "teacher";
              const isMe = m.user_id === user?.id;
              return (
                <View key={m.user_id} style={styles.row}>
                  <Avatar
                    name={m.name ?? "멤버"}
                    colorKey={m.user_id}
                    size={36}
                  />
                  <Text style={styles.name} numberOfLines={1}>
                    {m.name ?? "멤버"}
                  </Text>
                  {isOwner ? (
                    <Text style={styles.ownerBadge}>방장</Text>
                  ) : isMe ? null : (
                    <TouchableOpacity
                      onPress={() => removeMember(m)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color={COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={styles.submitWrap}>
            <Button
              title="저장"
              size="large"
              onPress={save}
              loading={saving}
              disabled={!title.trim() || saving}
            />
          </View>
        </>
      )}

      <Sheet
        visible={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setQuery("");
        }}
        title="멤버 초대"
      >
        {students.filter((s) => !memberIds.has(s.user_id!)).length > 0 ? (
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="이름으로 검색"
            style={styles.search}
          />
        ) : null}
        {inviteCandidates.length === 0 ? (
          <Text style={styles.noResult}>초대할 수련생이 없어요.</Text>
        ) : (
          <ScrollView style={styles.inviteScroll}>
            {inviteCandidates.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.row}
                onPress={() => addMember(s)}
                activeOpacity={0.7}
              >
                <Avatar name={s.name} colorKey={s.id} size={36} />
                <Text style={styles.name} numberOfLines={1}>
                  {s.name}
                </Text>
                <Ionicons
                  name="add-circle"
                  size={22}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  photoWrap: { alignItems: "center", marginBottom: SPACING.lg },
  photoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(139, 92, 246, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: { width: 88, height: 88, borderRadius: 44 },
  photoBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  photoHint: { color: COLORS.textSecondary, fontSize: 12, marginTop: SPACING.sm },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  label: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  inviteBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  name: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: "600" },
  ownerBadge: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  search: { marginBottom: SPACING.sm },
  inviteScroll: { maxHeight: 360 },
  noResult: {
    color: COLORS.textMuted,
    fontSize: 13,
    paddingVertical: SPACING.lg,
    paddingHorizontal: 4,
  },
  submitWrap: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    bottom: SPACING.lg,
  },
});
