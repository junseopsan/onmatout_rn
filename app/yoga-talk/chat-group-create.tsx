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
import { EmptyState } from "../../components/ui/EmptyState";
import { PillInput } from "../../components/ui/PillInput";
import { SearchBar } from "../../components/ui/SearchBar";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { useAuth } from "../../hooks/useAuth";
import { chatApi } from "../../lib/api/chat";
import { storageAPI } from "../../lib/api/storage";
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";
import type { StudentProfile } from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "ChatGroupCreate">;

export default function ChatGroupCreateScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { user } = useAuth();
  const { studioId } = route.params;

  const [step, setStep] = useState<"members" | "name">("members");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    teacherApi
      .listMyStudents(user.id, studioId)
      // 앱 가입자(user_id 있음) + 활성 수련생만 그룹에 추가 가능
      .then((list) =>
        setStudents(
          list.filter((s) => !!s.user_id && s.status === "active"),
        ),
      )
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [user?.id, studioId]);

  const toggle = (uid: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });

  const canNext = selected.size > 0;
  const canCreate = useMemo(
    () => title.trim().length > 0 && !creating,
    [title, creating],
  );

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.name.toLowerCase().includes(q));
  }, [students, query]);

  const selectedStudents = useMemo(
    () => students.filter((s) => selected.has(s.user_id!)),
    [students, selected],
  );

  const goBack = () => {
    if (step === "name") setStep("members");
    else navigation.goBack();
  };

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

  const create = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      const roomId = await chatApi.createGroupRoom({
        studioId,
        title: title.trim(),
        memberUserIds: Array.from(selected),
        imageUrl,
      });
      navigation.replace("ChatRoom", {
        roomId,
        title: title.trim() || "그룹 대화",
        asTeacher: true,
      });
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={goBack}
        title="그룹 채팅 만들기"
        serif={false}
      />

      {step === "members" ? (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>
              멤버 초대{selected.size > 0 ? ` (${selected.size}명)` : ""}
            </Text>

            {students.length > 0 ? (
              <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder="이름으로 검색"
                style={styles.search}
              />
            ) : null}

            {loading ? null : students.length === 0 ? (
              <EmptyState
                icon="🙋"
                title="초대할 수련생이 없어요"
                description={
                  "앱에 가입(연결)한 수련생만 그룹에 초대할 수 있어요."
                }
              />
            ) : filteredStudents.length === 0 ? (
              <Text style={styles.noResult}>검색 결과가 없어요.</Text>
            ) : (
              filteredStudents.map((s) => {
                const on = selected.has(s.user_id!);
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.row, on && styles.rowOn]}
                    onPress={() => toggle(s.user_id!)}
                    activeOpacity={0.8}
                  >
                    <Avatar name={s.name} colorKey={s.id} size={36} />
                    <Text style={styles.name} numberOfLines={1}>
                      {s.name}
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
              })
            )}
            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={styles.submitWrap}>
            <Button
              title="다음"
              size="large"
              onPress={() => setStep("name")}
              disabled={!canNext}
            />
          </View>
        </>
      ) : (
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
                {uploading ? "업로드 중…" : "사진 등록 (선택)"}
              </Text>
            </View>

            <PillInput
              label="그룹 채팅방 이름"
              required
              value={title}
              onChangeText={setTitle}
              placeholder="예) 초급반 Q&A"
              autoFocus
              maxLength={30}
            />

            <Text style={styles.label}>
              초대한 멤버 ({selectedStudents.length}명)
            </Text>
            {selectedStudents.map((s) => (
              <View key={s.id} style={styles.row}>
                <Avatar name={s.name} colorKey={s.id} size={36} />
                <Text style={styles.name} numberOfLines={1}>
                  {s.name}
                </Text>
              </View>
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={styles.submitWrap}>
            <Button
              title="그룹 채팅 만들기"
              size="large"
              onPress={create}
              loading={creating}
              disabled={!canCreate}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
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
  photoHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: SPACING.sm,
  },
  search: { marginBottom: SPACING.sm },
  noResult: {
    color: COLORS.textMuted,
    fontSize: 13,
    paddingVertical: SPACING.lg,
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
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rowOn: { borderColor: COLORS.primary },
  name: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: "600" },
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
  submitWrap: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    bottom: SPACING.lg,
  },
});
