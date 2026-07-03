import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RoutineCard } from "../../components/routine/RoutineCard";
import { AlertDialog } from "../../components/ui/AlertDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { FabButton } from "../../components/ui/FabButton";
import { ListSkeleton } from "../../components/ui/ListSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import {
  studentRoutinesApi,
  type RoutineSummary,
} from "../../lib/api/routines-student";
import { haptics } from "../../lib/haptics";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Tab = "shared" | "discover";

export default function StudentRoutineListScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("discover");
  const [shared, setShared] = useState<RoutineSummary[]>([]);
  const [discover, setDiscover] = useState<RoutineSummary[]>([]);
  const [loadingShared, setLoadingShared] = useState(true);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([
        studentRoutinesApi.listSharedRoutines(user?.id),
        studentRoutinesApi.listPublicRoutines(user?.id),
      ]);
      setShared(s);
      setDiscover(d);
    } catch (e) {
      console.warn("[StudentRoutineList] failed", e);
    } finally {
      setLoadingShared(false);
      setLoadingDiscover(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const isLoading = tab === "shared" ? loadingShared : loadingDiscover;
  const data = tab === "shared" ? shared : discover;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleCreate = useCallback(() => {
    if (!user?.id) {
      AlertDialog.login(
        () => navigation.navigate("Auth" as never),
        () => {},
      );
      return;
    }
    navigation.navigate("TeacherRoutineCreate", { origin: "student" });
  }, [user?.id, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageHeader />

      <View style={styles.tabsRow}>
        <SegmentTab
          label="전체"
          icon="earth"
          active={tab === "discover"}
          onPress={() => {
            haptics.select();
            setTab("discover");
          }}
        />
        <SegmentTab
          label={`내 시퀀스${shared.length ? ` ${shared.length}` : ""}`}
          icon="bookmark"
          active={tab === "shared"}
          onPress={() => {
            haptics.select();
            setTab("shared");
          }}
        />
      </View>

      {isLoading ? (
        <ListSkeleton count={4} rowHeight={108} />
      ) : data.length === 0 ? (
        tab === "shared" ? (
          <EmptyState
            icon="📥"
            title="내 시퀀스가 없어요"
            description={
              "직접 시퀀스를 만들거나,\n선생님이 보내준 시퀀스가 여기에 모입니다."
            }
            action={{
              label: "새 시퀀스 만들기",
              onPress: handleCreate,
            }}
          />
        ) : (
          <EmptyState
            icon="🌱"
            title="아직 공개된 시퀀스가 없어요"
            description="다른 선생님과 요가인들이 곧 공유할 예정이에요."
          />
        )
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
          {data.map((r) => (
            <RoutineCard
              key={r.id}
              routine={r}
              itemCount={r.item_count}
              currentUserId={user?.id}
              shared={tab === "shared" && r.teacher_id !== user?.id}
              creatorFallback="선생님"
              onToggleLike={studentRoutinesApi.toggleRoutineLike}
              onPress={() =>
                navigation.navigate("StudentRoutineDetail", { routineId: r.id })
              }
            />
          ))}
        </ScrollView>
      )}

      <FabButton
        label="새 시퀀스"
        onPress={handleCreate}
        style={styles.fab}
      />
    </SafeAreaView>
  );
}

function SegmentTab({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.segmentTab, active && styles.segmentTabActive]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={active ? COLORS.white : COLORS.textSecondary}
      />
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  fab: {
    position: "absolute",
    right: SPACING.lg,
    bottom: SPACING.lg + 8,
    opacity: 0.94,
  },
  tabsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  segmentTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  segmentText: {
    ...TEXT.captionMed,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  segmentTextActive: { color: COLORS.white, fontWeight: "700" as const },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
});
