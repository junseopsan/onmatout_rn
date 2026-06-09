import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SerifTitle } from "../../components/ui/SerifTitle";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { studentApi, type StudentTeacherDetail } from "../../lib/api/student";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "StudentTeacherDetail">;

const STATUS_LABEL: Record<string, string> = {
  present: "출석",
  late: "지각",
  makeup: "보강",
  absent: "결석",
  canceled: "취소",
};

export default function StudentTeacherDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { user } = useAuth();
  const { studentProfileId } = route.params;

  const [data, setData] = useState<StudentTeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!user?.id) return;
    (async () => {
      try {
        const result = await studentApi.getTeacherDetail(
          user.id,
          studentProfileId,
        );
        if (mounted) setData(result);
      } catch (e) {
        console.warn("[StudentTeacherDetail] failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id, studentProfileId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>정보를 불러오지 못했어요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const activeMembership = data.activeMembership;
  const recentAttendance = data.attendance.slice(0, 30);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ 홈</Text>
        </TouchableOpacity>
        <SerifTitle
          size="title"
          numberOfLines={1}
          style={{ flex: 1, textAlign: "center", marginHorizontal: 8 }}
        >
          {data.teacherName ?? "선생님"}
        </SerifTitle>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 활성 수련권 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>활성 수련권</Text>
          {activeMembership ? (
            <ActiveMembership m={activeMembership} />
          ) : (
            <Text style={styles.muted}>활성 수련권이 없어요.</Text>
          )}
        </View>

        {/* 수련권 히스토리 */}
        {data.allMemberships.length > 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>지난 수련권</Text>
            {data.allMemberships
              .filter((m) => m.id !== activeMembership?.id)
              .map((m) => (
                <View key={m.id} style={styles.pastMembership}>
                  <Text style={styles.pastTitle}>{labelType(m.type)}</Text>
                  <Text style={styles.pastMeta}>
                    {m.start_date} ~ {m.end_date}, {m.status}
                  </Text>
                </View>
              ))}
          </View>
        ) : null}

        {/* 최근 출석 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            최근 출석 ({recentAttendance.length}건)
          </Text>
          {recentAttendance.length === 0 ? (
            <Text style={styles.muted}>출석 기록이 없어요.</Text>
          ) : (
            recentAttendance.map((a) => (
              <View key={a.id} style={styles.row}>
                <Text style={styles.rowDate}>{a.attendance_date}</Text>
                <Text
                  style={[
                    styles.rowStatus,
                    a.status === "absent" || a.status === "canceled"
                      ? { color: COLORS.textSecondary }
                      : null,
                  ]}
                >
                  {STATUS_LABEL[a.status] ?? a.status}
                </Text>
                {a.deducted ? (
                  <Text style={styles.rowDeducted}>−1</Text>
                ) : (
                  <View style={{ width: 28 }} />
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActiveMembership({
  m,
}: {
  m: { type: string; total_count: number | null; used_count: number; weekly_limit: number | null; start_date: string; end_date: string };
}) {
  if (m.type === "count") {
    const remaining = (m.total_count ?? 0) - m.used_count;
    return (
      <View>
        <Text style={styles.bigNumber}>{remaining}회 남음</Text>
        <Text style={styles.muted}>
          전체 {m.total_count}, 사용 {m.used_count}, ~{m.end_date}
        </Text>
      </View>
    );
  }
  if (m.type === "period_weekly") {
    return (
      <View>
        <Text style={styles.bigNumber}>기간권 (주 {m.weekly_limit}회)</Text>
        <Text style={styles.muted}>
          {m.start_date} ~ {m.end_date}
        </Text>
      </View>
    );
  }
  return (
    <View>
      <Text style={styles.bigNumber}>무제한</Text>
      <Text style={styles.muted}>
        {m.start_date} ~ {m.end_date}
      </Text>
    </View>
  );
}

function labelType(type: string): string {
  if (type === "count") return "횟수권";
  if (type === "period_weekly") return "기간권 주N회";
  return "기간권 무제한";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  back: { color: COLORS.textSecondary, fontSize: 15 },
  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "600",
    maxWidth: "60%",
  },
  content: { padding: 16, paddingBottom: 64 },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  bigNumber: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },
  muted: { color: COLORS.textSecondary, fontSize: 13 },
  pastMembership: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  pastTitle: { color: COLORS.text, fontSize: 14, fontWeight: "500" },
  pastMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  rowDate: { color: COLORS.text, fontSize: 14, flex: 1 },
  rowStatus: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    width: 50,
  },
  rowDeducted: {
    color: COLORS.primary,
    fontSize: 13,
    width: 28,
    textAlign: "right",
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
});
