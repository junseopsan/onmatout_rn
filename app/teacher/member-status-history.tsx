import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import { teacherApi, type StudentStatusHistory } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "TeacherMemberStatusHistory">;

const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")} (${DOW_KO[d.getDay()]})`;
}

// 사람이 읽기 좋은 기간 (방금/분/시간/일)
function fmtDuration(a: string, b: string): string {
  const ms = Math.max(0, new Date(b).getTime() - new Date(a).getTime());
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}시간`;
  return `${Math.round(hours / 24)}일`;
}

type Kind =
  | "start"
  | "resume"
  | "pause"
  | "custom"
  | "archived"
  | "mPause"
  | "mResume";

interface Row {
  id: string;
  date: string;
  label: string;
  sub: string | null;
  kind: Kind;
}

const KIND_META: Record<Kind, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  start: { color: COLORS.success, icon: "leaf" },
  resume: { color: COLORS.success, icon: "play" },
  pause: { color: COLORS.warning, icon: "pause" },
  custom: { color: COLORS.warning, icon: "bookmark" },
  archived: { color: COLORS.textMuted, icon: "exit-outline" },
  mPause: { color: COLORS.warning, icon: "ticket-outline" },
  mResume: { color: COLORS.primary, icon: "ticket" },
};

export default function TeacherMemberStatusHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { studentProfileId } = route.params;

  const [items, setItems] = useState<StudentStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    teacherApi
      .listStudentStatusHistory(studentProfileId)
      .then((data) => mounted && setItems(data))
      .catch((e) => console.warn("[MemberStatusHistory] failed", e))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [studentProfileId]);

  // items 는 최신순. 라벨/기간은 같은 출처(student/membership)끼리 전이를 보고 판단.
  const rows = useMemo<Row[]>(() => {
    const asc = [...items].reverse();
    const nowIso = new Date().toISOString();
    const out: Row[] = asc.map((h, i) => {
      const prevSame =
        asc.slice(0, i).reverse().find((e) => e.source === h.source) ?? null;
      const nextSame =
        asc.slice(i + 1).find((e) => e.source === h.source) ?? null;
      const endIso = nextSame ? nextSame.created_at : nowIso;
      const ongoing = !nextSame;
      const isCustom = !!h.custom_status?.trim();
      let kind: Kind;
      let label: string;
      let sub: string | null = null;

      if (h.source === "membership") {
        if (h.status === "paused") {
          kind = "mPause";
          label = "수업권 일시정지";
          const d = fmtDuration(h.created_at, endIso);
          sub = ongoing ? `정지 중 (${d} 경과)` : `${d} 정지`;
        } else {
          kind = "mResume";
          label = "수업권 재개";
        }
      } else if (h.status === "archived") {
        kind = "archived";
        label = "요가원에서 내보냄";
      } else if (isCustom) {
        kind = "custom";
        label = h.custom_status!.trim();
        const d = fmtDuration(h.created_at, endIso);
        sub = ongoing ? `진행 중 (${d} 경과)` : d;
      } else if (h.status === "paused") {
        kind = "pause";
        label = "휴식 시작";
        const d = fmtDuration(h.created_at, endIso);
        sub = ongoing ? `휴식 중 (${d} 경과)` : `${d} 휴식`;
      } else {
        // active (student)
        if (!prevSame) {
          kind = "start";
          label = "수련 시작";
        } else {
          kind = "resume";
          label = "수련 재개";
        }
      }
      return { id: h.id, date: h.created_at, label, sub, kind };
    });
    return out.reverse();
  }, [items]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title="상태 내역"
        serif={false}
      />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="🗓️"
          title="상태 변경 내역이 없어요"
          description="휴식, 재개 등 상태가 바뀌면 이곳에 기록돼요."
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          <SurfaceCard padded={false}>
            {rows.map((r, idx) => {
              const meta = KIND_META[r.kind];
              return (
                <View
                  key={r.id}
                  style={[styles.row, idx > 0 && styles.rowBorder]}
                >
                  <View
                    style={[styles.iconWrap, { backgroundColor: `${meta.color}1F` }]}
                  >
                    <Ionicons name={meta.icon} size={15} color={meta.color} />
                  </View>
                  <View style={styles.main}>
                    <Text style={[styles.label, { color: meta.color }]}>
                      {r.label}
                    </Text>
                    {r.sub ? <Text style={styles.sub}>{r.sub}</Text> : null}
                  </View>
                  <Text style={styles.date}>{fmtDate(r.date)}</Text>
                </View>
              );
            })}
          </SurfaceCard>
          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    gap: 12,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  main: { flex: 1, gap: 2 },
  label: { fontSize: 14, fontWeight: "800" },
  sub: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "600" },
  date: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
