import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/Colors";

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  currentYear: number;
  currentMonth: number;
  onDateSelect: (year: number, month: number) => void;
  /** 제공 시 상단에 '전체 보기' 버튼 표시 (프로필 전체 수련 기록용) */
  onSelectAll?: () => void;
}

export default function DatePickerModal({
  visible,
  onClose,
  currentYear,
  currentMonth,
  onDateSelect,
  onSelectAll,
}: DatePickerModalProps) {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const currentDate = new Date();
  const currentYearValue = currentDate.getFullYear();
  const currentMonthValue = currentDate.getMonth() + 1;

  // 년도 목록 생성 (현재 년도부터 5년 전까지)
  const years = Array.from({ length: 6 }, (_, i) => currentYearValue - i);

  // 월 목록 생성
  const months = [
    { value: 1, label: "1월" },
    { value: 2, label: "2월" },
    { value: 3, label: "3월" },
    { value: 4, label: "4월" },
    { value: 5, label: "5월" },
    { value: 6, label: "6월" },
    { value: 7, label: "7월" },
    { value: 8, label: "8월" },
    { value: 9, label: "9월" },
    { value: 10, label: "10월" },
    { value: 11, label: "11월" },
    { value: 12, label: "12월" },
  ];

  const handleConfirm = () => {
    onDateSelect(selectedYear, selectedMonth);
    onClose();
  };

  const handleSelectAll = () => {
    onSelectAll?.();
    onClose();
  };

  const handleReset = () => {
    setSelectedYear(currentYearValue);
    setSelectedMonth(currentMonthValue);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.headerLeft} />
            <Text style={styles.title}>년월 선택</Text>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <Ionicons name="refresh" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {onSelectAll != null && (
            <View style={styles.selectAllSection}>
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={handleSelectAll}
              >
                <Ionicons name="list" size={20} color={COLORS.primary} />
                <Text style={styles.selectAllText}>전체 수련 기록 보기</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 년도 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>년도</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.yearContainer}
            >
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearButton,
                    selectedYear === year && styles.selectedButton,
                  ]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text
                    style={[
                      styles.yearText,
                      selectedYear === year && styles.selectedText,
                    ]}
                  >
                    {year}년
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 월 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>월</Text>
            <View style={styles.monthGrid}>
              {months.map((month) => (
                <TouchableOpacity
                  key={month.value}
                  style={[
                    styles.monthButton,
                    selectedMonth === month.value && styles.selectedButton,
                  ]}
                  onPress={() => setSelectedMonth(month.value)}
                >
                  <Text
                    style={[
                      styles.monthText,
                      selectedMonth === month.value && styles.selectedText,
                    ]}
                  >
                    {month.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 하단 버튼 */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerLeft: {
    width: 32,
  },
  selectAllSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  resetButton: {
    padding: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  yearContainer: {
    paddingRight: 20,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  monthButton: {
    width: "22%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  selectedButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  yearText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  monthText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  selectedText: {
    color: "white",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
});
