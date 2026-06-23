import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StudentRow } from "../../components/teacher/StudentRow";
import { StudioSwitcher } from "../../components/teacher/StudioSwitcher";
import { Chip } from "../../components/ui/Chip";
import { EmptyState } from "../../components/ui/EmptyState";
import { FabButton } from "../../components/ui/FabButton";
import { ListSkeleton } from "../../components/ui/ListSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { SearchBar } from "../../components/ui/SearchBar";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import { useAuth } from "../../hooks/useAuth";
import { usePivotStudios } from "../../hooks/usePivotStudios";
import { pivotStudioApi } from "../../lib/api/pivotStudio";
import { teacherApi, type StudentProfileWithSummary } from "../../lib/api/teacher";
import { yogaTalkApi } from "../../lib/api/yogaTalk";
import { RootStackParamList } from "../../navigation/types";
import type { StudentProfile } from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TeacherMembersTabScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { activeStudio } = usePivotStudios();
  const [students, setStudents] = useState<StudentProfileWithSummary[]>([]);
  const [teacherIds, setTeacherIds] = useState<Set<string>>(new Set());
  // 안읽은 요가톡이 있는 수련생 프로필 id
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "teacher">(
    "all",
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await teacherApi.listMyStudents(
        user.id,
        activeStudio?.id ?? null,
      );
      setStudents(data);
      if (activeStudio?.id) {
        const tRows = await pivotStudioApi.listStudioTeachers(activeStudio.id);
        setTeacherIds(
          new Set(
            tRows
              .filter((r: any) => r.status === "active")
              .map((r: any) => r.teacher_id as string),
          ),
        );
      } else {
        setTeacherIds(new Set());
      }
    } catch (e) {
      console.warn("[MembersTab] load failed", e);
    } finally {
      setLoading(false);
    }

    // 수련생별 안읽음 요가톡 — 스레드 마지막 메시지가 상대(수련생) 발신이고
    // 내 읽음 시각보다 이후면 안읽음 (thread-list 와 동일 판정)
    try {
      const threads = await yogaTalkApi.listAsTeacher(user.id);
      const ids = new Set<string>();
      for (const t of threads) {
        const lm = t.last_message;
        if (!lm || lm.sender_type === "teacher") continue;
        const lastTs = lm.created_at ?? null;
        if (!(t.my_read_at && lastTs && t.my_read_at >= lastTs)) {
          ids.add(t.student_id);
        }
      }
      setUnreadIds(ids);
    } catch {
      // 안읽음 표시는 부가 기능이므로 실패해도 목록은 그대로 유지
    }
  }, [user?.id, activeStudio?.id]);

  const isTeacher = useCallback(
    (s: StudentProfile) => !!s.user_id && teacherIds.has(s.user_id),
    [teacherIds],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone ?? "").replace(/\s|-/g, "").includes(q.replace(/\s|-/g, "")),
    );
  }, [students, query]);

  const teacherCount = useMemo(
    () => filtered.filter(isTeacher).length,
    [filtered, isTeacher],
  );
  const studentCount = filtered.length - teacherCount;

  const roleFiltered = useMemo(() => {
    if (roleFilter === "teacher") return filtered.filter(isTeacher);
    if (roleFilter === "student") return filtered.filter((s) => !isTeacher(s));
    return filtered;
  }, [filtered, roleFilter, isTeacher]);

  const openYogaTalk = async (s: StudentProfile) => {
    if (!user?.id) return;
    try {
      const thread = await yogaTalkApi.getOrCreateThread({
        teacherUserId: user.id,
        studentProfileId: s.id,
        classId: null,
        title: `${s.name} 님과의 대화`,
        category: "general",
      });
      navigation.navigate("YogaTalkThread", { threadId: thread.id });
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    }
  };

  const renderRow = (s: StudentProfileWithSummary) => (
    <StudentRow
      key={s.id}
      student={s}
      isTeacher={isTeacher(s)}
      noActivePass={s.status === "active" && !s.active_membership}
      onPress={() =>
        navigation.navigate("TeacherMemberDetail", {
          studentProfileId: s.id,
        })
      }
      rightSlot={
        <TouchableOpacity
          onPress={() => openYogaTalk(s)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.talkBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={20}
            color={COLORS.text}
          />
          {unreadIds.has(s.id) ? <View style={styles.talkUnreadDot} /> : null}
        </TouchableOpacity>
      }
    />
  );

  const hasCustom = (s: StudentProfile) =>
    !!((s as any).custom_status as string | null | undefined)?.trim();
  const activeMembers = roleFiltered.filter(
    (s) => !hasCustom(s) && s.status === "active" && !!s.active_membership,
  );
  // status 는 active 지만 활성 수련권이 없는 회원 (미발급/만료)
  const noPassMembers = roleFiltered.filter(
    (s) => !hasCustom(s) && s.status === "active" && !s.active_membership,
  );
  const pausedMembers = roleFiltered.filter(
    (s) => !hasCustom(s) && s.status !== "active",
  );
  const customMembers = roleFiltered.filter(hasCustom);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageHeader eyebrowSlot={<StudioSwitcher />} />

      {students.length > 0 ? (
        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="이름 또는 전화번호로 검색"
          />
          <View style={styles.filterRow}>
            <Chip
              label={`전체 ${filtered.length}`}
              size="sm"
              active={roleFilter === "all"}
              onPress={() => setRoleFilter("all")}
            />
            <Chip
              label={`수련생 ${studentCount}`}
              size="sm"
              active={roleFilter === "student"}
              onPress={() => setRoleFilter("student")}
            />
            <Chip
              label={`선생님 ${teacherCount}`}
              size="sm"
              color={COLORS.info}
              active={roleFilter === "teacher"}
              onPress={() => setRoleFilter("teacher")}
            />
          </View>
        </View>
      ) : null}

      {loading ? (
        <ListSkeleton count={5} rowHeight={72} />
      ) : students.length === 0 ? (
        <EmptyState
          icon="📒"
          title="아직 수련생이 없어요"
          description={
            "초대 링크나 QR로 요가원에 초대해 보세요.\n수련생이 앱에 가입한 뒤 링크나\nQR로 들어오면 연결돼요."
          }
          action={{
            label: "초대 링크 보내기",
            onPress: () => navigation.navigate("TeacherStudioInvite"),
          }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔎"
          title="검색 결과가 없어요"
          description={`"${query}" 와 일치하는 수련생이 없습니다.`}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {activeMembers.length > 0 ? (
            <>
              <SectionLabel>수련중 ({activeMembers.length})</SectionLabel>
              {activeMembers.map(renderRow)}
            </>
          ) : null}

          {noPassMembers.length > 0 ? (
            <View
              style={{ marginTop: activeMembers.length > 0 ? SPACING.xl : 0 }}
            >
              <SectionLabel>수련권 없음 ({noPassMembers.length})</SectionLabel>
              {noPassMembers.map(renderRow)}
            </View>
          ) : null}

          {pausedMembers.length > 0 ? (
            <View
              style={{
                marginTop:
                  activeMembers.length > 0 || noPassMembers.length > 0
                    ? SPACING.xl
                    : 0,
              }}
            >
              <SectionLabel>휴식중 ({pausedMembers.length})</SectionLabel>
              {pausedMembers.map(renderRow)}
            </View>
          ) : null}

          {customMembers.length > 0 ? (
            <View
              style={{
                marginTop:
                  activeMembers.length > 0 ||
                  noPassMembers.length > 0 ||
                  pausedMembers.length > 0
                    ? SPACING.xl
                    : 0,
              }}
            >
              <SectionLabel>커스텀 ({customMembers.length})</SectionLabel>
              {customMembers.map(renderRow)}
            </View>
          ) : null}
        </ScrollView>
      )}

      <FabButton
        label="초대"
        onPress={() => navigation.navigate("TeacherStudioInvite")}
        style={styles.fab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  searchWrap: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  filterRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  talkBtn: {
    width: 26,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  talkUnreadDot: {
    position: "absolute",
    right: 2,
    bottom: 5,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  fab: {
    position: "absolute",
    right: SPACING.lg,
    bottom: SPACING.lg + 8,
    opacity: 0.94,
  },
});
