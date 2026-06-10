import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
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
import { PillInput } from "../../components/ui/PillInput";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import {
  membershipPlansApi,
  type MembershipPlan,
} from "../../lib/api/membershipPlans";
import { teacherApi } from "../../lib/api/teacher";
import { usePivotStudios } from "../../hooks/usePivotStudios";
import { RootStackParamList } from "../../navigation/types";
import type { MembershipType, StudentProfile } from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "TeacherMembershipCreate">;

const TYPE_OPTIONS: {
  value: MembershipType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}[] = [
  {
    value: "count",
    icon: "ticket",
    title: "횟수권",
    description: "정해진 횟수만큼 사용 (기본 2개월 유효)",
  },
  {
    value: "period_weekly",
    icon: "calendar",
    title: "기간권 (주 N회)",
    description: "기간 내 주당 횟수 제한",
  },
  {
    value: "period_unlimited",
    icon: "infinite",
    title: "기간권 (무제한)",
    description: "기간 내 무제한 출석",
  },
];

const DAY_IN_MS = 86400000;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(iso: string, days: number) {
  return new Date(new Date(iso).getTime() + days * DAY_IN_MS)
    .toISOString()
    .slice(0, 10);
}

export default function TeacherMembershipCreateScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { studentProfileId } = route.params;

  const { activeStudio } = usePivotStudios();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [type, setType] = useState<MembershipType>("count");
  const [totalCount, setTotalCount] = useState("10");
  const [weeklyLimit, setWeeklyLimit] = useState("3");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(addDays(todayISO(), 60));
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

  useEffect(() => {
    if (!activeStudio?.id) return;
    let mounted = true;
    membershipPlansApi
      .listByStudio(activeStudio.id, { activeOnly: true })
      .then((rows) => mounted && setPlans(rows))
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [activeStudio?.id]);

  // 플랜 미선택 시에만 유형 기본 기간을 자동 계산
  useEffect(() => {
    if (selectedPlanId) return;
    if (type === "count") setEndDate(addDays(startDate, 60));
    else setEndDate(addDays(startDate, 30));
  }, [type, startDate, selectedPlanId]);

  const applyPlan = (p: MembershipPlan) => {
    setSelectedPlanId(p.id);
    setType(p.type);
    if (p.type === "count" && p.total_count != null)
      setTotalCount(String(p.total_count));
    if (p.type === "period_weekly" && p.weekly_limit != null)
      setWeeklyLimit(String(p.weekly_limit));
    const days = p.valid_days ?? (p.type === "count" ? 60 : 30);
    setEndDate(addDays(startDate, days));
  };

  const validate = (): string | null => {
    if (!startDate || !endDate) return "기간을 입력해 주세요.";
    if (new Date(startDate) >= new Date(endDate))
      return "종료일은 시작일 이후여야 해요.";
    if (type === "count") {
      const n = parseInt(totalCount, 10);
      if (!Number.isFinite(n) || n <= 0) return "횟수를 1 이상으로 입력해 주세요.";
    }
    if (type === "period_weekly") {
      const w = parseInt(weeklyLimit, 10);
      if (!Number.isFinite(w) || w <= 0) return "주 N회를 입력해 주세요.";
    }
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      Alert.alert("입력 확인", err);
      return;
    }
    setSubmitting(true);
    try {
      await teacherApi.createMembership({
        student_id: studentProfileId,
        type,
        total_count: type === "count" ? parseInt(totalCount, 10) : null,
        weekly_limit:
          type === "period_weekly" ? parseInt(weeklyLimit, 10) : null,
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
        <ScrollView contentContainerStyle={styles.form}>
          {student ? (
            <Text style={styles.studentLine}>
              수련생:{" "}
              <Text style={{ color: COLORS.text, fontWeight: "600" }}>
                {student.name}
              </Text>
            </Text>
          ) : null}

          {plans.length > 0 ? (
            <>
              <Text style={styles.label}>수업권 선택 (선택)</Text>
              <View style={styles.planRow}>
                {plans.map((p) => {
                  const on = selectedPlanId === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.planChip, on && styles.planChipOn]}
                      onPress={() => applyPlan(p)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[styles.planChipName, on && { color: COLORS.primary }]}
                      >
                        {p.name}
                      </Text>
                      {p.price != null ? (
                        <Text style={styles.planChipPrice}>
                          {p.price.toLocaleString("en-US")}원
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}

          <Text style={styles.label}>유형</Text>
          <View style={{ gap: SPACING.md }}>
            {TYPE_OPTIONS.map((opt) => {
              const active = type === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.typeCard, active && styles.typeCardActive]}
                  onPress={() => {
                    setSelectedPlanId(null);
                    setType(opt.value);
                  }}
                  activeOpacity={0.85}
                >
                  <View
                    style={[styles.typeIconWrap, active && styles.typeIconWrapActive]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={20}
                      color={active ? COLORS.primary : COLORS.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.typeTitle,
                        active && { color: COLORS.primary },
                      ]}
                    >
                      {opt.title}
                    </Text>
                    <Text style={styles.typeDesc}>{opt.description}</Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      active && { borderColor: COLORS.primary },
                    ]}
                  >
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {type === "count" ? (
            <PillInput
              label="총 횟수"
              value={totalCount}
              onChangeText={setTotalCount}
              placeholder="10"
              keyboardType="numeric"
            />
          ) : null}

          {type === "period_weekly" ? (
            <PillInput
              label="주당 횟수"
              value={weeklyLimit}
              onChangeText={setWeeklyLimit}
              placeholder="3"
              keyboardType="numeric"
            />
          ) : null}

          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <PillInput
                label="시작일"
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={{ width: SPACING.md }} />
            <View style={{ flex: 1 }}>
              <PillInput
                label="종료일"
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.submitWrap}>
        <Button
          title="수련권 발급"
          size="large"
          onPress={submit}
          loading={submitting}
          disabled={submitting}
        />
      </View>
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
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  typeCardActive: { borderColor: COLORS.primary },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceDark,
    alignItems: "center",
    justifyContent: "center",
  },
  typeIconWrapActive: {
    backgroundColor: "rgba(139, 92, 246, 0.16)",
  },
  typeTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  typeDesc: { color: COLORS.textSecondary, fontSize: 12 },
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
  planRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  planChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  planChipOn: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(139, 92, 246, 0.12)",
  },
  planChipName: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  planChipPrice: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  dateRow: { flexDirection: "row", marginTop: SPACING.md },
  submitWrap: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    bottom: SPACING.lg,
  },
});
