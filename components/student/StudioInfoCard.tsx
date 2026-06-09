import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import type {
  MyMembershipInfo,
  StudioFullInfo,
} from "../../lib/api/studentBooking";
import { haptics } from "../../lib/haptics";

interface Props {
  studio: StudioFullInfo;
  memberships: MyMembershipInfo[];
}

const DOW_KR = ["일", "월", "화", "수", "목", "금", "토"];

function formatMembership(m: MyMembershipInfo): string {
  const parts: string[] = [];
  if (m.class_title) parts.push(m.class_title);
  if (m.weekly_limit) parts.push(`주 ${m.weekly_limit}회`);
  if (m.total_count != null) {
    const used = m.used_count ?? 0;
    parts.push(`${used}/${m.total_count}회 사용`);
  }
  return parts.join(", ");
}

function callPhone(num: string) {
  haptics.select();
  const tel = num.replace(/[^\d+]/g, "");
  Linking.openURL(`tel:${tel}`).catch(() => undefined);
}

function openUrl(url: string) {
  haptics.select();
  const u = url.startsWith("http") ? url : `https://${url}`;
  Linking.openURL(u).catch(() => undefined);
}

export function StudioInfoCard({ studio, memberships }: Props) {
  const hasContact =
    !!studio.phone || !!studio.instagram_url || !!studio.kakao_url;

  if (memberships.length === 0 && !hasContact) return null;

  return (
    <View style={styles.card}>
      {memberships.length > 0 ? (
        <View style={styles.passWrap}>
          {memberships.map((m) => (
            <View key={m.id} style={styles.passRow}>
              <View style={styles.passIconWrap}>
                <Ionicons name="ticket" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.passText} numberOfLines={1}>
                {formatMembership(m)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {hasContact ? (
        <View style={styles.actionsRow}>
          {studio.phone ? (
            <Pressable
              onPress={() => callPhone(studio.phone!)}
              style={styles.actionBtn}
              hitSlop={6}
            >
              <Ionicons name="call" size={14} color={COLORS.text} />
              <Text style={styles.actionText}>전화</Text>
            </Pressable>
          ) : null}
          {studio.kakao_url ? (
            <Pressable
              onPress={() => openUrl(studio.kakao_url!)}
              style={styles.actionBtn}
              hitSlop={6}
            >
              <Ionicons name="chatbubble-ellipses" size={14} color="#FAE100" />
              <Text style={styles.actionText}>카카오</Text>
            </Pressable>
          ) : null}
          {studio.instagram_url ? (
            <Pressable
              onPress={() => openUrl(studio.instagram_url!)}
              style={styles.actionBtn}
              hitSlop={6}
            >
              <Ionicons name="logo-instagram" size={14} color="#E1306C" />
              <Text style={styles.actionText}>인스타</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(139, 92, 246, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.45)",
    gap: 10,
  },
  passWrap: {
    gap: 6,
  },
  passRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  passIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(139, 92, 246, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  passText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    letterSpacing: 0.1,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  actionText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "700",
  },
});
