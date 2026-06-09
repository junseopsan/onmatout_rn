import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import {
  DAY_OF_WEEK_LABELS_KO,
  type Class,
  type ClassSchedule,
} from "../../types/teacher";

interface ClassCardProps {
  cls: Class & { class_schedules?: ClassSchedule[] };
  onPress?: () => void;
}

function formatTime(t?: string | null) {
  if (!t) return "";
  return t.slice(0, 5);
}

export function ClassCard({ cls, onPress }: ClassCardProps) {
  const schedules = (cls.class_schedules ?? []).slice().sort(
    (a, b) => a.day_of_week - b.day_of_week,
  );
  const isActive = cls.is_active !== false;

  // 동일 시간대끼리 요일을 묶어서 표시 (예: 월수금 09:00–10:30)
  const scheduleGroups = (() => {
    const byTime = new Map<
      string,
      { days: number[]; start: string; end: string }
    >();
    for (const s of schedules) {
      const start = formatTime(s.start_time);
      const end = formatTime(s.end_time);
      const key = `${start}-${end}`;
      const g = byTime.get(key);
      if (g) g.days.push(s.day_of_week);
      else byTime.set(key, { days: [s.day_of_week], start, end });
    }
    return Array.from(byTime.values())
      .map((g) => ({
        days: g.days.sort((a, b) => a - b),
        time: `${g.start}–${g.end}`,
      }))
      .sort((a, b) => a.days[0] - b.days[0]);
  })();

  return (
    <TouchableOpacity
      style={[styles.card, !isActive && styles.cardInactive]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      <View
        style={[
          styles.accent,
          { backgroundColor: isActive ? COLORS.primary : COLORS.border },
        ]}
      />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={1}>
            {cls.title}
          </Text>
          {!isActive ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>비활성</Text>
            </View>
          ) : null}
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS.textMuted}
          />
        </View>

        {scheduleGroups.length > 0 ? (
          <View style={styles.schedBlock}>
            {scheduleGroups.map((g, i) => (
              <View key={i} style={styles.schedRow}>
                <View style={styles.schedDays}>
                  {g.days.map((d) => (
                    <View key={d} style={styles.dayPill}>
                      <Text style={styles.dayPillText}>
                        {DAY_OF_WEEK_LABELS_KO[d]}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.schedTimeWrap}>
                  <Ionicons name="time-outline" size={13} color={COLORS.primary} />
                  <Text style={styles.schedTimeText}>{g.time}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.metaItem}>
            <Ionicons
              name="alert-circle-outline"
              size={12}
              color={COLORS.textMuted}
            />
            <Text style={styles.metaText}>스케줄 미설정</Text>
          </View>
        )}

        <View style={styles.metaRow}>
          {(cls as any).capacity ? (
            <View style={styles.metaItem}>
              <Ionicons
                name="people-outline"
                size={13}
                color={COLORS.primary}
              />
              <Text style={styles.metaText}>
                정원 {(cls as any).capacity}
              </Text>
            </View>
          ) : null}
          {cls.location ? (
            <View style={styles.metaItem}>
              <Ionicons
                name="location-outline"
                size={13}
                color={COLORS.primary}
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {cls.location}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    overflow: "hidden",
  },
  cardInactive: {
    opacity: 0.6,
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  badge: {
    backgroundColor: COLORS.surfaceDark,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeText: { color: COLORS.textMuted, fontSize: 10, fontWeight: "700" },
  schedBlock: {
    gap: 6,
  },
  schedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  schedDays: {
    flexDirection: "row",
    gap: 4,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  dayPill: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.16)",
  },
  dayPillText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  schedTimeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  schedTimeText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
  },
});
