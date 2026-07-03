import { Ionicons } from "@expo/vector-icons";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { PillInput } from "../../components/ui/PillInput";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { usePivotStudios } from "../../hooks/usePivotStudios";
import {
  membershipPlansApi,
  type MembershipPlan,
} from "../../lib/api/membershipPlans";
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";
import type { StudentProfile } from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "TeacherMembershipCreate">;

const DAY_IN_MS = 86400000;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(iso: string, days: number) {
  return new Date(new Date(iso).getTime() + days * DAY_IN_MS)
    .toISOString()
    .slice(0, 10);
}
function planValidDays(p: MembershipPlan) {
  return p.valid_days ?? (p.type === "count" ? 60 : 30);
}
// 수업권 상품 요약 (유형 + 횟수/주N회 + 유효기간)
function planMeta(p: MembershipPlan): string {
  const validity = `유효 ${planValidDays(p)}일`;
  if (p.type === "count") return `횟수권 ${p.total_count ?? "-"}회 / ${validity}`;
  if (p.type === "period_weekly")
    return `주 ${p.weekly_limit ?? "-"}회 / ${validity}`;
  return `무제한 / ${validity}`;
}

export default function TeacherMembershipCreateScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { studentProfileId } = route.params;

  const { activeStudio } = usePivotStudios();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [plansLoaded, setPlansLoaded] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    teacherApi
      .getStudent(studentProfileId)
      .then((s) => mounted && setStudent(s))
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [studentProfileId]);

  // 포커스마다 재조회 — 수업권 관리에서 새 상품을 만들고 돌아오면 즉시 반영
  useFocusEffect(
    useCallback(() => {
      if (!activeStudio?.id) return;
      let mounted = true;
      membershipPlansApi
        .listByStudio(activeStudio.id, { activeOnly: true })
        .then((rows) => {
          if (!mounted) return;
          setPlans(rows);
          // 상품이 하나뿐이고 아직 선택 전이면 자동 선택
          setSelectedPlanId((prev) =>
            prev ?? (rows.length === 1 ? rows[0].id : null),
          );
        })
        .catch(() => undefined)
        .finally(() => mounted && setPlansLoaded(true));
      return () => {
        mounted = false;
      };
    }, [activeStudio?.id]),
  );

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const endDate = useMemo(
    () => (selectedPlan ? addDays(startDate, planValidDays(selectedPlan)) : ""),
    [selectedPlan, startDate],
  );

  const submit = async () => {
    if (!selectedPlan) {
      Alert.alert("수업권 선택", "발급할 수업권을 선택해 주세요.");
      return;
    }
    if (new Date(startDate).toString() === "Invalid Date") {
      Alert.alert("입력 확인", "시작일을 YYYY-MM-DD 형식으로 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await teacherApi.createMembership({
        student_id: studentProfileId,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        type: selectedPlan.type,
        total_count:
          selectedPlan.type === "count" ? selectedPlan.total_count : null,
        weekly_limit:
          selectedPlan.type === "period_weekly"
            ? selectedPlan.weekly_limit
            : null,
        start_date: startDate,
        end_date: endDate,
        status: "active",
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("발급 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        title="수련권 발급"
        serif={false}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {plansLoaded && plans.length === 0 ? (
          <EmptyState
            icon="🎫"
            title="등록된 수업권이 없어요"
            description={
              "먼저 수업권 관리에서 상품(예: 90분 10회)을\n만든 뒤 수련생에게 발급할 수 있어요."
            }
            action={
              activeStudio
                ? {
                    label: "수업권 만들러 가기",
                    onPress: () =>
                      navigation.navigate("TeacherMembershipPlans", {
                        studioId: activeStudio.id,
                        studioName: activeStudio.name,
                      }),
                  }
                : undefined
            }
          />
        ) : (
          <ScrollView contentContainerStyle={styles.form}>
            {student ? (
              <Text style={styles.studentLine}>
                수련생:{" "}
                <Text style={{ color: COLORS.text, fontWeight: "600" }}>
                  {student.name}
                </Text>
              </Text>
            ) : null}

            <Text style={styles.label}>수업권 선택</Text>
            <View style={{ gap: SPACING.md }}>
              {plans.map((p) => {
                const on = selectedPlanId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.planCard, on && styles.planCardActive]}
                    onPress={() => setSelectedPlanId(p.id)}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.planName,
                          on && { color: COLORS.primary },
                        ]}
                      >
                        {p.name}
                      </Text>
                      <Text style={styles.planMeta}>{planMeta(p)}</Text>
                    </View>
                    {p.price != null ? (
                      <Text style={styles.planPrice}>
                        {p.price.toLocaleString("en-US")}원
                      </Text>
                    ) : null}
                    <View
                      style={[styles.radio, on && { borderColor: COLORS.primary }]}
                    >
                      {on ? <View style={styles.radioDot} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {activeStudio ? (
                <TouchableOpacity
                  style={styles.addPlanBtn}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate("TeacherMembershipPlans", {
                      studioId: activeStudio.id,
                      studioName: activeStudio.name,
                    })
                  }
                >
                  <Ionicons name="add" size={18} color={COLORS.primary} />
                  <Text style={styles.addPlanText}>
                    원하는 수업권이 없나요? 새로 만들기
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {selectedPlan ? (
              <View style={styles.issueBox}>
                <PillInput
                  label="시작일"
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                />
                <View style={styles.endRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={15}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.endText}>
                    종료일 {endDate} (유효 {planValidDays(selectedPlan)}일)
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {!(plansLoaded && plans.length === 0) ? (
        <View style={styles.submitWrap}>
          <Button
            title="수련권 발급"
            size="large"
            onPress={submit}
            loading={submitting}
            disabled={submitting || !selectedPlan}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  form: { padding: SPACING.xl, paddingTop: SPACING.lg },
  studentLine: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  planCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(139, 92, 246, 0.08)",
  },
  planName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
  },
  planMeta: { color: COLORS.textSecondary, fontSize: 12 },
  planPrice: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  addPlanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  addPlanText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  issueBox: {
    marginTop: SPACING.xl,
  },
  endRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: SPACING.sm,
    paddingHorizontal: 4,
  },
  endText: { color: COLORS.textSecondary, fontSize: 13 },
  submitWrap: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    bottom: SPACING.lg,
  },
});
