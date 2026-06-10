import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { PillInput } from "../../components/ui/PillInput";
import { Sheet } from "../../components/ui/Sheet";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import {
  membershipPlansApi,
  type MembershipPlan,
  type MembershipPlanType,
} from "../../lib/api/membershipPlans";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "TeacherMembershipPlans">;

const TYPES: { value: MembershipPlanType; label: string }[] = [
  { value: "count", label: "횟수권" },
  { value: "period_weekly", label: "기간권 주N회" },
  { value: "period_unlimited", label: "기간권 무제한" },
];

function typeLabel(t: MembershipPlanType): string {
  return TYPES.find((x) => x.value === t)?.label ?? "수업권";
}

function planSummary(p: MembershipPlan): string {
  const parts: string[] = [];
  if (p.duration_min) parts.push(`${p.duration_min}분`);
  if (p.type === "count" && p.total_count) parts.push(`${p.total_count}회`);
  if (p.type === "period_weekly" && p.weekly_limit)
    parts.push(`주 ${p.weekly_limit}회`);
  if (p.type === "period_unlimited") parts.push("무제한");
  if (p.valid_days) parts.push(`사용기한 ${p.valid_days}일`);
  return parts.join(", ");
}

function fmtPrice(price: number | null): string {
  if (price == null) return "가격 미정";
  return `${price.toLocaleString("en-US")}원`;
}

export default function TeacherMembershipPlansScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { studioId, studioName } = route.params;

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MembershipPlan | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const rows = await membershipPlansApi.listByStudio(studioId);
      setPlans(rows);
    } catch (e) {
      console.warn("[MembershipPlans] load failed", e);
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: MembershipPlan) => {
    setEditing(p);
    setFormOpen(true);
  };

  const handleDelete = (p: MembershipPlan) => {
    Alert.alert("수업권 삭제", `"${p.name}" 을 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await membershipPlansApi.remove(p.id);
            setPlans((prev) => prev.filter((x) => x.id !== p.id));
          } catch (e: any) {
            Alert.alert("삭제 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        title="수업권 관리"
        serif={false}
        onBack={() => navigation.goBack()}
        trailing={{
          kind: "icon",
          icon: "add",
          onPress: openCreate,
        }}
      />

      {loading ? null : plans.length === 0 ? (
        <EmptyState
          icon="🎟️"
          title="등록된 수업권이 없어요"
          description={
            "수련생에게 발급할 수업권 종류를 만들어 두면\n발급이 빨라지고 가격표로도 보여줄 수 있어요."
          }
          action={{ label: "수업권 추가", onPress: openCreate }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {studioName ? (
            <Text style={styles.studioLine}>{studioName}</Text>
          ) : null}
          {plans.map((p) => (
            <View
              key={p.id}
              style={[styles.card, !p.is_active && styles.cardInactive]}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Text style={styles.planName}>{p.name}</Text>
                  <View style={styles.typeChip}>
                    <Text style={styles.typeChipText}>{typeLabel(p.type)}</Text>
                  </View>
                  {!p.is_active ? (
                    <View style={styles.offChip}>
                      <Text style={styles.offChipText}>숨김</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.planSummary}>{planSummary(p)}</Text>
                <Text style={styles.planPrice}>{fmtPrice(p.price)}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => openEdit(p)}
                  style={styles.iconBtn}
                  hitSlop={8}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(p)}
                  style={styles.iconBtn}
                  hitSlop={8}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={COLORS.error}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      )}

      <PlanFormSheet
        visible={formOpen}
        studioId={studioId}
        plan={editing}
        nextSortOrder={plans.length}
        onClose={() => setFormOpen(false)}
        onSaved={(saved) => {
          setFormOpen(false);
          setPlans((prev) => {
            const idx = prev.findIndex((x) => x.id === saved.id);
            if (idx === -1) return [...prev, saved];
            const next = [...prev];
            next[idx] = saved;
            return next;
          });
        }}
      />
    </SafeAreaView>
  );
}

function PlanFormSheet({
  visible,
  studioId,
  plan,
  nextSortOrder,
  onClose,
  onSaved,
}: {
  visible: boolean;
  studioId: string;
  plan: MembershipPlan | null;
  nextSortOrder: number;
  onClose: () => void;
  onSaved: (p: MembershipPlan) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<MembershipPlanType>("count");
  const [duration, setDuration] = useState("");
  const [count, setCount] = useState("");
  const [weekly, setWeekly] = useState("");
  const [validDays, setValidDays] = useState("");
  const [price, setPrice] = useState("");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (plan) {
      setName(plan.name);
      setType(plan.type);
      setDuration(plan.duration_min != null ? String(plan.duration_min) : "");
      setCount(plan.total_count != null ? String(plan.total_count) : "");
      setWeekly(plan.weekly_limit != null ? String(plan.weekly_limit) : "");
      setValidDays(plan.valid_days != null ? String(plan.valid_days) : "");
      setPrice(plan.price != null ? String(plan.price) : "");
      setActive(plan.is_active);
    } else {
      setName("");
      setType("count");
      setDuration("");
      setCount("");
      setWeekly("");
      setValidDays("");
      setPrice("");
      setActive(true);
    }
  }, [visible, plan]);

  const numOrNull = (s: string): number | null => {
    const n = parseInt(s.replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  };

  const canSave = useMemo(() => {
    if (!name.trim()) return false;
    if (type === "count" && !numOrNull(count)) return false;
    if (type === "period_weekly" && !numOrNull(weekly)) return false;
    return true;
  }, [name, type, count, weekly]);

  const save = async () => {
    if (!canSave || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        studio_id: studioId,
        name: name.trim(),
        type,
        duration_min: numOrNull(duration),
        total_count: type === "count" ? numOrNull(count) : null,
        weekly_limit: type === "period_weekly" ? numOrNull(weekly) : null,
        valid_days: numOrNull(validDays),
        price: numOrNull(price),
      };
      const saved = plan
        ? await membershipPlansApi.update(plan.id, {
            ...payload,
            is_active: active,
          })
        : await membershipPlansApi.create({
            ...payload,
            sort_order: nextSortOrder,
          });
      onSaved(saved);
    } catch (e: any) {
      Alert.alert("저장 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={plan ? "수업권 수정" : "수업권 추가"}
    >
      <PillInput
        label="이름"
        value={name}
        onChangeText={setName}
        placeholder="예) 90분 10회권"
      />

      <Text style={styles.fieldLabel}>유형</Text>
      <View style={styles.chipRow}>
        {TYPES.map((t) => (
          <Chip
            key={t.value}
            label={t.label}
            active={type === t.value}
            onPress={() => setType(t.value)}
          />
        ))}
      </View>

      <Text style={styles.fieldLabel}>수업 시간</Text>
      <View style={styles.chipRow}>
        {[50, 90, 120].map((m) => (
          <Chip
            key={m}
            label={`${m}분`}
            active={duration === String(m)}
            onPress={() =>
              setDuration(duration === String(m) ? "" : String(m))
            }
          />
        ))}
      </View>
      <PillInput
        value={duration}
        onChangeText={(t) => setDuration(t.replace(/[^\d]/g, ""))}
        placeholder="직접 입력 (분)"
        keyboardType="number-pad"
      />

      {type === "count" ? (
        <PillInput
          label="총 횟수"
          value={count}
          onChangeText={(t) => setCount(t.replace(/[^\d]/g, ""))}
          placeholder="예) 10"
          keyboardType="number-pad"
        />
      ) : type === "period_weekly" ? (
        <PillInput
          label="주당 횟수"
          value={weekly}
          onChangeText={(t) => setWeekly(t.replace(/[^\d]/g, ""))}
          placeholder="예) 3"
          keyboardType="number-pad"
        />
      ) : (
        <>
          <Text style={styles.fieldLabel}>출석</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>기간 내 무제한 출석</Text>
          </View>
        </>
      )}

      <Text style={styles.fieldLabel}>사용기한</Text>
      <View style={styles.chipRow}>
        {[
          { m: 1, d: 30 },
          { m: 2, d: 60 },
          { m: 3, d: 90 },
          { m: 6, d: 180 },
        ].map((o) => (
          <Chip
            key={o.d}
            label={`${o.m}개월`}
            active={validDays === String(o.d)}
            onPress={() =>
              setValidDays(validDays === String(o.d) ? "" : String(o.d))
            }
          />
        ))}
      </View>
      <PillInput
        value={validDays}
        onChangeText={(t) => setValidDays(t.replace(/[^\d]/g, ""))}
        placeholder="직접 입력 (일)"
        keyboardType="number-pad"
      />

      <PillInput
        label="가격"
        value={price ? Number(price).toLocaleString("en-US") : ""}
        onChangeText={(t) => setPrice(t.replace(/[^\d]/g, ""))}
        placeholder="예) 250,000"
        keyboardType="number-pad"
      />

      {plan ? (
        <TouchableOpacity
          style={styles.activeToggle}
          onPress={() => setActive((v) => !v)}
          activeOpacity={0.85}
        >
          <Ionicons
            name={active ? "eye-outline" : "eye-off-outline"}
            size={18}
            color={active ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={styles.activeToggleText}>
            {active ? "수련생에게 보임" : "숨김 (가격표 비노출)"}
          </Text>
        </TouchableOpacity>
      ) : null}

      <Button
        title={plan ? "변경 저장" : "수업권 추가"}
        onPress={save}
        disabled={!canSave}
        loading={submitting}
        style={{ marginTop: SPACING.md }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg },
  studioLine: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  cardInactive: { opacity: 0.55 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  planName: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  typeChip: {
    backgroundColor: "rgba(139, 92, 246, 0.16)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeChipText: { color: COLORS.primary, fontSize: 11, fontWeight: "700" },
  offChip: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  offChipText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700" },
  planSummary: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 5,
  },
  planPrice: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 3,
  },
  cardActions: { flexDirection: "row", gap: 4, marginLeft: 8 },
  iconBtn: { padding: 6 },
  fieldLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: SPACING.sm },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    justifyContent: "center",
  },
  infoBoxText: { color: COLORS.textSecondary, fontSize: 14 },
  activeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: SPACING.md,
    paddingVertical: 8,
  },
  activeToggleText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
});
