import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import type {
  MyMembershipInfo,
  StudioFullInfo,
} from "../../lib/api/studentBooking";
import { haptics } from "../../lib/haptics";
import { Sheet } from "../ui/Sheet";

interface Props {
  studio: StudioFullInfo;
  memberships: MyMembershipInfo[];
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

export function StudioInfoCard({ studio, memberships }: Props) {
  const [open, setOpen] = useState(false);
  const hasContact =
    !!studio.phone || !!studio.instagram_url || !!studio.kakao_url;

  if (memberships.length === 0 && !hasContact) return null;

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

      <Sheet visible={open} onClose={() => setOpen(false)} title="내 수강권">
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
