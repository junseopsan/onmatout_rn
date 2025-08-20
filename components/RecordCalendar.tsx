import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/Colors";
import { STATES } from "../constants/states";
import { Record } from "../types/record";

interface RecordCalendarProps {
  records: Record[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  currentYear: number;
  currentMonth: number;
  onMonthChange: (year: number, month: number) => void;
}

export default function RecordCalendar({
  records,
  selectedDate,
  onDateSelect,
  currentYear,
  currentMonth,
  onMonthChange,
}: RecordCalendarProps) {
  // 현재 월의 날짜들 생성
  const getDaysInMonth = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];

    // 이전 달의 마지막 날짜들
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const prevMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate();
      const day = prevMonthDays - i;
      days.push({
        date: `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        isCurrentMonth: false,
      });
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        isCurrentMonth: true,
      });
    }

    // 다음 달의 첫 날짜들 (7의 배수로 맞추기)
    const remainingDays = 42 - days.length; // 6주 x 7일 = 42
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      days.push({
        date: `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  // 날짜별 기록 찾기
  const getRecordForDate = (date: string) => {
    return records.find((record) => record.date === date);
  };

  // 상태 색상 가져오기
  const getStateColor = (stateId: string) => {
    const state = STATES.find((s) => s.id === stateId);
    return state ? state.color : COLORS.textSecondary;
  };

  // 월 네비게이션 함수들
  const handlePreviousMonth = () => {
    let newYear = currentYear;
    let newMonth = currentMonth - 1;

    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    onMonthChange(newYear, newMonth);
  };

  const handleNextMonth = () => {
    let newYear = currentYear;
    let newMonth = currentMonth + 1;

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }

    onMonthChange(newYear, newMonth);
  };

  // 현재 날짜 정보
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const currentDate = now.toISOString().split("T")[0];

  const days = getDaysInMonth(currentYear, currentMonth);

  // 요일 헤더
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <View style={styles.container}>
      {/* 월 표시 */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          style={styles.monthNavButton}
          onPress={handlePreviousMonth}
        >
          <Text style={styles.monthNavButtonText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.monthText}>
          {currentYear}년 {currentMonth + 1}월
        </Text>

        <TouchableOpacity
          style={styles.monthNavButton}
          onPress={handleNextMonth}
        >
          <Text style={styles.monthNavButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.weekHeader}>
        {weekDays.map((day, index) => (
          <View key={day} style={styles.weekDay}>
            <Text
              style={[
                styles.weekDayText,
                index === 0 && styles.sundayText,
                index === 6 && styles.saturdayText,
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* 달력 그리드 */}
      <View style={styles.calendarGrid}>
        {days.map((day, index) => {
          const record = getRecordForDate(day.date);
          const isSelected = selectedDate === day.date;
          const isToday = day.date === currentDate;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isToday && !isSelected && styles.todayCell,
                isSelected && styles.selectedDay,
              ]}
              onPress={() => onDateSelect(day.date)}
            >
              <View style={styles.dayContent}>
                <Text
                  style={[
                    styles.dayText,
                    !day.isCurrentMonth && styles.otherMonthText,
                    isToday && !isSelected && styles.todayText,
                    isSelected && styles.selectedDayText,
                  ]}
                >
                  {new Date(day.date).getDate()}
                </Text>

                {/* 기록 표시 */}
                {record && record.states.length > 0 && (
                  <View
                    style={[
                      styles.recordDot,
                      {
                        backgroundColor: getStateColor(record.states[0]),
                      },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceDark,
    justifyContent: "center",
    alignItems: "center",
  },
  monthNavButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
    textAlign: "center",
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  sundayText: {
    color: "#EF4444",
  },
  saturdayText: {
    color: "#3B82F6",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%", // 100% / 7
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dayContent: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 16,
  },
  otherMonthText: {
    color: COLORS.textSecondary,
    opacity: 0.5,
    textAlign: "center",
    lineHeight: 16,
  },
  selectedDay: {
    backgroundColor: `#FF6B6B66`, // 밝은 빨간색 + 40% 투명도
    borderRadius: 8,
  },
  selectedDayText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 16,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 8,
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 16,
  },
  recordDot: {
    marginTop: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
