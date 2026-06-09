import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import { haptics } from "../../lib/haptics";

interface WeekPickerProps {
  weekStart: Date; // 주의 시작일 (일요일 00:00)
  onWeekChange: (next: Date) => void;
  // 오늘 기준 최대 몇 주 앞까지 (default 1 = 다음 주까지)
  maxWeekOffset?: number;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeek(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

function fmtMonthDay(d: Date) {
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function WeekPicker({
  weekStart,
  onWeekChange,
  maxWeekOffset = 1,
}: WeekPickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayWeekStart = startOfWeek(today);
  const maxWeekStart = addDays(todayWeekStart, maxWeekOffset * 7);
  const weekEnd = addDays(weekStart, 6);

  const canGoPrev = weekStart.getTime() > todayWeekStart.getTime();
  const canGoNext = weekStart.getTime() < maxWeekStart.getTime();
  const isCurrentWeek = weekStart.getTime() === todayWeekStart.getTime();

  const goPrev = () => {
    if (!canGoPrev) return;
    haptics.select();
    onWeekChange(addDays(weekStart, -7));
  };
  const goNext = () => {
    if (!canGoNext) return;
    haptics.select();
    onWeekChange(addDays(weekStart, 7));
  };
  const goToday = () => {
    haptics.select();
    onWeekChange(todayWeekStart);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={goPrev}
        hitSlop={10}
        disabled={!canGoPrev}
        style={[styles.arrowBtn, !canGoPrev && styles.arrowDisabled]}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color={canGoPrev ? COLORS.text : COLORS.textMuted}
        />
      </Pressable>
      <Pressable onPress={goToday} style={styles.center} hitSlop={6}>
        <Text style={styles.rangeText}>
          {fmtMonthDay(weekStart)} – {fmtMonthDay(weekEnd)}
        </Text>
        {!isCurrentWeek ? (
          <Text style={styles.todayHint}>오늘로</Text>
        ) : null}
      </Pressable>
      <Pressable
        onPress={goNext}
        hitSlop={10}
        disabled={!canGoNext}
        style={[styles.arrowBtn, !canGoNext && styles.arrowDisabled]}
      >
        <Ionicons
          name="chevron-forward"
          size={20}
          color={canGoNext ? COLORS.text : COLORS.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: 4,
    paddingBottom: SPACING.md,
    gap: 8,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowDisabled: { opacity: 0.35 },
  center: { flex: 1, alignItems: "center" },
  rangeText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  todayHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
