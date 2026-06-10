import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import type { MembershipPlan } from "../../lib/api/membershipPlans";
import type {
  MyMembershipInfo,
  StudioFullInfo,
} from "../../lib/api/studentBooking";
import { formatValidDays } from "../../lib/format";
import { haptics } from "../../lib/haptics";
import { Sheet } from "../ui/Sheet";

interface Props {
  studio: StudioFullInfo;
  memberships: MyMembershipInfo[];
  plans?: MembershipPlan[];
}

function planSummary(p: MembershipPlan): string {
  const parts: string[] = [];
  if (p.duration_min) parts.push(`${p.duration_min}분`);
  if (p.type === "count" && p.total_count) parts.push(`${p.total_count}회`);
  if (p.type === "period_weekly" && p.weekly_limit)
    parts.push(`주 ${p.weekly_limit}회`);
  if (p.type === "period_unlimited") parts.push("무제한");
  if (p.valid_days) parts.push(`사용기한 ${formatValidDays(p.valid_days)}`);
  return parts.join(", ");
}

function typeLabel(m: MyMembershipInfo): string {
  if (m.type === "count") return "횟수권";
  if (m.type === "period_weekly")
    return `기간권 주${m.weekly_limit ?? ""}회`;
  if (m.type === "period_unlimited") return "기간권 무제한";
  return "수강권";
}

function remainingText(m: MyMembershipInfo): string | null {
  if (m.type === "count" && m.total_count != null) {
    const used = m.used_count ?? 0;
    return `${m.total_count - used}/${m.total_count}`;
  }
  return null;
}

function daysLeft(end: string | null): number | null {
  if (!end) return null;
  const e = new Date(end + "T23:59:59");
  const now = new Date();
  return Math.max(0, Math.ceil((e.getTime() - now.getTime()) / 86400000));
}

function fmtDate(d: string | null): string {
  if (!d) return "";
  return d.replaceAll("-", ".");
}

function chipLabel(memberships: MyMembershipInfo[]): string {
  const m = memberships[0];
  const rem = remainingText(m);
  const base = rem ? `${typeLabel(m)} 잔여 ${rem}` : typeLabel(m);
  return memberships.length > 1
    ? `${base} 외 ${memberships.length - 1}`
    : base;
}

function callPhone(num: string) {
  haptics.select();
  Linking.openURL(`tel:${num.replace(/[^\d+]/g, "")}`).catch(() => undefined);
}
function openUrl(url: string) {
  haptics.select();
  const u = url.startsWith("http") ? url : `https://${url}`;
  Linking.openURL(u).catch(() => undefined);
}

const DAY_ORDER: { key: string; label: string }[] = [
  { key: "1", label: "월" },
  { key: "2", label: "화" },
  { key: "3", label: "수" },
  { key: "4", label: "목" },
  { key: "5", label: "금" },
  { key: "6", label: "토" },
  { key: "0", label: "일" },
];

export function StudioInfoCard({ studio, memberships, plans = [] }: Props) {
  const [open, setOpen] = useState(false);
  const hasContact =
    !!studio.phone || !!studio.instagram_url || !!studio.kakao_url;
  const hasPricing =
    plans.length > 0 || !!studio.pricing_text || !!studio.pricing_image_url;
  const hasPolicy =
    studio.cancel_cutoff_hours > 0 ||
    !!studio.policy_text ||
    !!studio.policy_image_url ||
    !!studio.rules_image_url;
  const hasIntro = !!studio.description || !!studio.description_image_url;
  const hourRows = DAY_ORDER.filter((d) => studio.hours_by_day?.[d.key]);
  const hasOps = hourRows.length > 0 || !!studio.bank_account;
  const hasPhotos = studio.photos.length > 0;
  const hasGuide = hasPricing || hasPolicy || hasIntro || hasOps || hasPhotos;

  if (memberships.length === 0 && !hasContact && !hasGuide) return null;

  return (
    <>
      <Pressable
        style={styles.chip}
        onPress={() => {
          haptics.select();
          setOpen(true);
        }}
      >
        <View style={styles.chipIcon}>
          <Ionicons name="ticket" size={13} color={COLORS.primary} />
        </View>
        <Text style={styles.chipText} numberOfLines={1}>
          {memberships.length > 0
            ? chipLabel(memberships)
            : "요가원 정보"}
        </Text>
        <Ionicons name="chevron-forward" size={15} color={COLORS.textMuted} />
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)} title={studio.name}>
        {hasPhotos ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryRow}
            style={{ marginBottom: 14 }}
          >
            {studio.photos.map((url) => (
              <Image key={url} source={{ uri: url }} style={styles.galleryImg} />
            ))}
          </ScrollView>
        ) : null}

        {memberships.length > 0 ? (
          <Text style={styles.sectionLabel}>내 수강권</Text>
        ) : null}
        {memberships.length === 0 ? (
          <Text style={styles.empty}>보유한 수강권이 없어요.</Text>
        ) : (
          memberships.map((m) => {
            const rem = remainingText(m);
            const left = daysLeft(m.end_date);
            return (
              <View key={m.id} style={styles.passCard}>
                <View style={styles.passTop}>
                  <Text style={styles.passType}>{typeLabel(m)}</Text>
                  {m.class_title ? (
                    <Text style={styles.passClass} numberOfLines={1}>
                      {m.class_title}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.statRow}>
                  {rem ? (
                    <Stat label="잔여" value={`${rem}회`} highlight />
                  ) : null}
                  {m.start_date && m.end_date ? (
                    <Stat
                      label="기간"
                      value={`${fmtDate(m.start_date)} ~ ${fmtDate(m.end_date)}`}
                    />
                  ) : null}
                  {left != null ? (
                    <Stat label="남은 기간" value={`${left}일`} />
                  ) : null}
                </View>
              </View>
            );
          })
        )}

        {hasIntro ? (
          <View style={styles.guideSection}>
            <Text style={styles.guideTitle}>소개</Text>
            {studio.description ? (
              <Text style={styles.guideBody}>{studio.description}</Text>
            ) : null}
            {studio.description_image_url ? (
              <Image
                source={{ uri: studio.description_image_url }}
                style={styles.guideImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        ) : null}

        {hasOps ? (
          <View style={styles.guideSection}>
            <Text style={styles.guideTitle}>운영 안내</Text>
            {hourRows.map((d) => (
              <View key={d.key} style={styles.hourRow}>
                <Text style={styles.hourDay}>{d.label}</Text>
                <Text style={styles.hourVal}>
                  {studio.hours_by_day?.[d.key]}
                </Text>
              </View>
            ))}
            {studio.bank_account ? (
              <View style={[styles.hourRow, { marginTop: hourRows.length ? 8 : 0 }]}>
                <Text style={styles.hourDay}>계좌</Text>
                <Text style={styles.hourVal}>{studio.bank_account}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {hasPricing ? (
          <View style={styles.guideSection}>
            <Text style={styles.guideTitle}>수업권 안내</Text>
            {plans.map((p) => (
              <View key={p.id} style={styles.planLine}>
                {p.image_url ? (
                  <Image
                    source={{ uri: p.image_url }}
                    style={styles.planThumb}
                  />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{p.name}</Text>
                  <Text style={styles.planSummary}>{planSummary(p)}</Text>
                </View>
                {p.price != null ? (
                  <Text style={styles.planPrice}>
                    {p.price.toLocaleString("en-US")}원
                  </Text>
                ) : null}
              </View>
            ))}
            {studio.pricing_text ? (
              <Text
                style={[
                  styles.guideBody,
                  plans.length > 0 && { marginTop: 10 },
                ]}
              >
                {studio.pricing_text}
              </Text>
            ) : null}
            {studio.pricing_image_url ? (
              <Image
                source={{ uri: studio.pricing_image_url }}
                style={styles.guideImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        ) : null}

        {hasPolicy ? (
          <View style={styles.guideSection}>
            <Text style={styles.guideTitle}>등록/예약 안내</Text>
            {studio.cancel_cutoff_hours > 0 ? (
              <View style={styles.ruleLine}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={COLORS.warning}
                />
                <Text style={styles.ruleText}>
                  수업 시작 {studio.cancel_cutoff_hours}시간 전까지 취소 가능
                </Text>
              </View>
            ) : null}
            {studio.policy_text ? (
              <Text
                style={[
                  styles.guideBody,
                  studio.cancel_cutoff_hours > 0 && { marginTop: 8 },
                ]}
              >
                {studio.policy_text}
              </Text>
            ) : null}
            {studio.policy_image_url ? (
              <Image
                source={{ uri: studio.policy_image_url }}
                style={styles.guideImage}
                resizeMode="contain"
              />
            ) : null}
            {studio.rules_image_url ? (
              <Image
                source={{ uri: studio.rules_image_url }}
                style={styles.guideImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        ) : null}

        {hasContact ? (
          <View style={styles.actionsRow}>
            {studio.phone ? (
              <Pressable
                onPress={() => callPhone(studio.phone!)}
                style={styles.actionBtn}
              >
                <Ionicons name="call" size={15} color={COLORS.text} />
                <Text style={styles.actionText}>전화</Text>
              </Pressable>
            ) : null}
            {studio.kakao_url ? (
              <Pressable
                onPress={() => openUrl(studio.kakao_url!)}
                style={styles.actionBtn}
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={15}
                  color="#FAE100"
                />
                <Text style={styles.actionText}>카카오</Text>
              </Pressable>
            ) : null}
            {studio.instagram_url ? (
              <Pressable
                onPress={() => openUrl(studio.instagram_url!)}
                style={styles.actionBtn}
              >
                <Ionicons name="logo-instagram" size={15} color="#E1306C" />
                <Text style={styles.actionText}>인스타</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </Sheet>
    </>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statValueHi]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(139, 92, 246, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  chipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(139, 92, 246, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  empty: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  passCard: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  passTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  passType: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  passClass: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  stat: { gap: 2 },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  statValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  statValueHi: { color: COLORS.primary, fontSize: 16, fontWeight: "800" },
  guideSection: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  guideTitle: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },
  guideBody: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },
  planLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  planThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: COLORS.surface,
  },
  planName: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  planSummary: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  planPrice: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  ruleLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  ruleText: { color: COLORS.warning, fontSize: 12, fontWeight: "700" },
  guideImage: {
    width: "100%",
    height: 420,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: COLORS.surface,
  },
  galleryRow: { gap: 8 },
  galleryImg: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  hourRow: { flexDirection: "row", alignItems: "center", paddingVertical: 3 },
  hourDay: {
    width: 40,
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  hourVal: { flex: 1, color: COLORS.text, fontSize: 13 },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceDark,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  actionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },
});
