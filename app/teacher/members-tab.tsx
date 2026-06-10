import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StudentRow } from "../../components/teacher/StudentRow";
import { StudioSwitcher } from "../../components/teacher/StudioSwitcher";
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
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";
import type { StudentProfile } from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TeacherMembersTabScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { activeStudio } = usePivotStudios();
  const [students, setStudents] = useState<StudentProfile[]>([]);
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
    } catch (e) {
      console.warn("[MembersTab] load failed", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeStudio?.id]);

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

  const hasCustom = (s: StudentProfile) =>
    !!((s as any).custom_status as string | null | undefined)?.trim();
  const activeMembers = filtered.filter(
    (s) => !hasCustom(s) && s.status === "active",
  );
  const pausedMembers = filtered.filter(
    (s) => !hasCustom(s) && s.status !== "active",
  );
  const customMembers = filtered.filter(hasCustom);

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
          <Text style={styles.countText}>총 {students.length}명</Text>
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
  countText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: SPACING.sm,
    paddingHorizontal: 4,
  },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  fab: {
    position: "absolute",
    right: SPACING.lg,
    bottom: SPACING.lg + 8,
    opacity: 0.94,
  },
});
