import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/Colors";

interface SimpleDatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function SimpleDatePicker({
  selectedDate,
  onDateChange,
}: SimpleDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);

  // 달력 데이터 생성
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    
    // 빈 칸 추가 (월 시작 전)
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // 날짜 추가
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  // 날짜 선택
  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth);
    newDate.setDate(day);
    onDateChange(newDate);
    setIsCalendarVisible(false); // 날짜 선택 후 달력 닫기
  };

  // 날짜를 "YYYY년 MM월 DD일 (요일)" 형식으로 포맷
  const formatDisplayDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekDay = weekDays[date.getDay()];
    
    return `${year}년 ${month}월 ${day}일 (${weekDay})`;
  };

  // 선택된 날짜인지 확인
  const isSelectedDate = (day: number) => {
    return (
      selectedDate.getFullYear() === currentMonth.getFullYear() &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getDate() === day
    );
  };

  // 오늘 날짜인지 확인
  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === currentMonth.getFullYear() &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getDate() === day
    );
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <View style={styles.container}>
      {/* 날짜 입력 필드 */}
      <TouchableOpacity
        onPress={() => setIsCalendarVisible(!isCalendarVisible)}
        activeOpacity={0.7}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={formatDisplayDate(selectedDate)}
            editable={false}
            pointerEvents="none"
          />
          <Text style={styles.inputIcon}>
            {isCalendarVisible ? "▲" : "▼"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 달력 (펼쳐진 상태일 때만 표시) */}
      {isCalendarVisible && (
        <View style={styles.calendarContainer}>
          {/* 헤더: 년/월 선택 */}
          <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.arrowButton}>
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerText}>
          {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
        </Text>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.arrowButton}>
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((day, index) => (
          <View key={day} style={styles.weekDayCell}>
            <Text
              style={[
                styles.weekDayText,
                (index === 0) && styles.sundayText,
                (index === 6) && styles.saturdayText,
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* 날짜 그리드 */}
      <View style={styles.daysGrid}>
        {days.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const selected = isSelectedDate(day);
          const today = isToday(day);

          return (
            <TouchableOpacity
              key={`day-${day}`}
              style={[
                styles.dayCell,
                selected && styles.selectedDayCell,
              ]}
              onPress={() => handleDateSelect(day)}
            >
              <Text
                style={[
                  styles.dayText,
                  selected && styles.selectedDayText,
                  today && !selected && styles.todayText,
                  index % 7 === 0 && !selected && styles.sundayText,
                  index % 7 === 6 && !selected && styles.saturdayText,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  inputIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  calendarContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  arrowButton: {
    padding: 8,
    width: 40,
    alignItems: "center",
  },
  arrowText: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: "600",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  weekDaysRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  sundayText: {
    color: "#FF6B6B",
  },
  saturdayText: {
    color: "#4A90E2",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  selectedDayCell: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    color: COLORS.text,
  },
  selectedDayText: {
    color: "white",
    fontWeight: "700",
  },
  todayText: {
    fontWeight: "700",
    color: COLORS.primary,
  },
});

