import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { useAuth } from "../../hooks/useAuth";
import { chatApi } from "../../lib/api/chat";
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

  const [title, setTitle] = useState("");
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
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

  const canCreate = useMemo(
    () => selected.size > 0 && !creating,
    [selected, creating],
  );

  const create = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      const roomId = await chatApi.createGroupRoom({
        studioId,
        title: title.trim(),
        memberUserIds: Array.from(selected),
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
        onBack={() => navigation.goBack()}
        title="그룹 만들기"
        serif={false}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <PillInput
          label="그룹 이름 (선택)"
          value={title}
          onChangeText={setTitle}
          placeholder="예) 초급반 Q&A"
        />

        <Text style={styles.label}>
          멤버 선택{selected.size > 0 ? ` (${selected.size}명)` : ""}
        </Text>

        {loading ? null : students.length === 0 ? (
          <EmptyState
            icon="🙋"
            title="추가할 수련생이 없어요"
            description={"앱에 가입(연결)한 수련생만 그룹에 추가할 수 있어요."}
          />
        ) : (
          students.map((s) => {
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
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
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
          title="그룹 만들기"
          size="large"
          onPress={create}
          loading={creating}
          disabled={!canCreate}
        />
      </View>
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
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
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
