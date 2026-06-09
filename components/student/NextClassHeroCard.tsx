import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { DAY_OF_WEEK_LABELS_KO } from "../../types/teacher";

interface NextClassHeroCardProps {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM:SS
  endTime: string;
  classTitle: string;
  location?: string | null;
  isBooked: boolean;
  busy?: boolean;
  onToggleBook?: () => void;
}

function formatHHMM(s: string) {
  return s.slice(0, 5);
}

function relativeLabel(dateISO: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateISO + "T00:00:00");
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "내일";
  if (diffDays === 2) return "모레";
  const dow = target.getDay();
  return `${DAY_OF_WEEK_LABELS_KO[dow]}요일`;
}

// 학생 수업탭 상단 — "다음 수업" hero 카드
export function NextClassHeroCard({
  date,
  startTime,
  endTime,
  classTitle,
  location,
  isBooked,
  busy,
  onToggleBook,
}: NextClassHeroCardProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.glow} />
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.eyebrow}>다음 수업</Text>
          <View style={styles.relativeBadge}>
            <Text style={styles.relativeBadgeText}>{relativeLabel(date)}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {classTitle}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>
              {formatHHMM(startTime)} – {formatHHMM(endTime)}
            </Text>
          </View>
          {location ? (
            <View style={styles.metaItem}>
              <Ionicons
                name="location-outline"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}
        </View>

        {onToggleBook ? (
          <TouchableOpacity
            style={[
              styles.cta,
              isBooked ? styles.ctaSecondary : styles.ctaPrimary,
              busy && { opacity: 0.6 },
            ]}
            disabled={busy}
            onPress={onToggleBook}
            activeOpacity={0.9}
          >
            <Ionicons
              name={isBooked ? "checkmark-circle" : "add-circle"}
              size={16}
              color={isBooked ? COLORS.primary : COLORS.white}
            />
            <Text
              style={
                isBooked ? styles.ctaSecondaryText : styles.ctaPrimaryText
              }
            >
              {busy ? "처리 중…" : isBooked ? "신청됨, 해제" : "이 수업 신청"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  glow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    bottom: -4,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    opacity: 0.12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.35)",
    padding: SPACING.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  eyebrow: {
    ...TEXT.eyebrow,
    color: COLORS.primary,
  },
  relativeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(139, 92, 246, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  relativeBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  title: {
    ...TEXT.uiHero,
    color: COLORS.text,
    fontSize: 22,
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: "row",
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { ...TEXT.caption, color: COLORS.textSecondary, fontSize: 12 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm + 2,
  },
  ctaPrimary: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  ctaPrimaryText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
  ctaSecondary: {
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  ctaSecondaryText: { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
});
