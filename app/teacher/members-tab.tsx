import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
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
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";
import type { StudentProfile } from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TeacherMembersTabScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { activeStudio } = usePivotStudios();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [teacherIds, setTeacherIds] = useState<Set<string>>(new Set());
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

  const hasCustom = (s: StudentProfile) =>
    !!((s as any).custom_status as string | null | undefined)?.trim();
  const activeMembers = roleFiltered.filter(
    (s) => !hasCustom(s) && s.status === "active",
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
          description={"+ 등록으로 첫 수련생을 추가하면\n자동으로 초대 코드가 생성됩니다."}
          action={{
            label: "수련생 등록",
            onPress: () => navigation.navigate("TeacherMemberCreate"),
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
              {activeMembers.map((s) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  isTeacher={isTeacher(s)}
                  onPress={() =>
                    navigation.navigate("TeacherMemberDetail", {
                      studentProfileId: s.id,
                    })
                  }
                />
              ))}
            </>
          ) : null}

          {pausedMembers.length > 0 ? (
            <View
              style={{ marginTop: activeMembers.length > 0 ? SPACING.xl : 0 }}
            >
              <SectionLabel>휴식중 ({pausedMembers.length})</SectionLabel>
              {pausedMembers.map((s) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  isTeacher={isTeacher(s)}
                  onPress={() =>
                    navigation.navigate("TeacherMemberDetail", {
                      studentProfileId: s.id,
                    })
                  }
                />
              ))}
            </View>
          ) : null}

          {customMembers.length > 0 ? (
            <View
              style={{
                marginTop:
                  activeMembers.length > 0 || pausedMembers.length > 0
                    ? SPACING.xl
                    : 0,
              }}
            >
              <SectionLabel>커스텀 ({customMembers.length})</SectionLabel>
              {customMembers.map((s) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  isTeacher={isTeacher(s)}
                  onPress={() =>
                    navigation.navigate("TeacherMemberDetail", {
                      studentProfileId: s.id,
                    })
                  }
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}

      <FabButton
        label="수련생"
        onPress={() => navigation.navigate("TeacherMemberCreate")}
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
  fab: {
    position: "absolute",
    right: SPACING.lg,
    bottom: SPACING.lg + 8,
    opacity: 0.94,
  },
});
