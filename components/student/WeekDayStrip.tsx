import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import { haptics } from "../../lib/haptics";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

interface WeekDayStripProps {
  selected: Date; // 선택된 날짜 (00:00)
  onSelect: (d: Date) => void;
  maxDayOffset?: number; // 오늘 기준 최대 며칠 앞까지 (default 14)
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
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function WeekDayStrip({
  selected,
  onSelect,
  maxDayOffset = 14,
}: WeekDayStripProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = today;
  const maxDate = addDays(today, maxDayOffset);

  const weekStart = startOfWeek(selected);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const canPrevWeek = startOfWeek(today).getTime() < weekStart.getTime();
  const canNextWeek = addDays(weekStart, 7).getTime() <= maxDate.getTime();

  const select = (d: Date) => {
    if (d.getTime() < minDate.getTime() || d.getTime() > maxDate.getTime())
      return;
    haptics.select();
    onSelect(d);
  };
  const goPrevWeek = () => {
    if (!canPrevWeek) return;
    haptics.select();
    const ws = addDays(weekStart, -7);
    // 이전 주로 가면 그 주의 같은 요일 (단, 오늘 이전이면 오늘)
    const target = addDays(ws, selected.getDay());
    onSelect(target.getTime() < minDate.getTime() ? minDate : target);
  };
  const goNextWeek = () => {
    if (!canNextWeek) return;
    haptics.select();
    const ws = addDays(weekStart, 7);
    const target = addDays(ws, selected.getDay());
    onSelect(target.getTime() > maxDate.getTime() ? maxDate : target);
  };
  const goToday = () => {
    haptics.select();
    onSelect(today);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Pressable
          onPress={goPrevWeek}
          hitSlop={10}
          disabled={!canPrevWeek}
          style={[styles.arrow, !canPrevWeek && styles.arrowOff]}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={canPrevWeek ? COLORS.text : COLORS.textMuted}
          />
        </Pressable>
        <Text style={styles.monthLabel}>
          {selected.getFullYear()}년 {selected.getMonth() + 1}월
        </Text>
        <View style={styles.topRight}>
          <Pressable
            onPress={goNextWeek}
            hitSlop={10}
            disabled={!canNextWeek}
            style={[styles.arrow, !canNextWeek && styles.arrowOff]}
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={canNextWeek ? COLORS.text : COLORS.textMuted}
            />
          </Pressable>
          <Pressable onPress={goToday} hitSlop={8} style={styles.todayBtn}>
            <Text style={styles.todayBtnText}>오늘</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.daysRow}>
        {days.map((d) => {
          const isSel = sameDay(d, selected);
          const isToday = sameDay(d, today);
          const disabled =
            d.getTime() < minDate.getTime() || d.getTime() > maxDate.getTime();
          const dow = d.getDay();
          return (
            <Pressable
              key={d.toISOString()}
              onPress={() => select(d)}
              disabled={disabled}
              style={styles.dayCell}
            >
              <Text
                style={[
                  styles.dowText,
                  dow === 0 && styles.sun,
                  dow === 6 && styles.sat,
                  disabled && styles.dimText,
                ]}
              >
                {DOW[dow]}
              </Text>
              <View style={[styles.dateCircle, isSel && styles.dateCircleSel]}>
                <Text
                  style={[
                    styles.dateText,
                    isSel && styles.dateTextSel,
                    !isSel && isToday && styles.dateTextToday,
                    disabled && styles.dimText,
                  ]}
                >
                  {d.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 4,
    paddingBottom: SPACING.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  topRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  arrow: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowOff: { opacity: 0.3 },
  monthLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  todayBtnText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 2,
  },
  dowText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  sun: { color: "#F87171" },
  sat: { color: "#60A5FA" },
  dimText: { color: COLORS.textMuted, opacity: 0.5 },
  dateCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCircleSel: { backgroundColor: COLORS.primary },
  dateText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  dateTextSel: { color: COLORS.white, fontWeight: "800" },
  dateTextToday: { color: COLORS.primary, fontWeight: "800" },
});
