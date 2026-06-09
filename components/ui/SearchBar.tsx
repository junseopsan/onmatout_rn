import React from "react";
import { Platform, StyleSheet, TextInput, ViewStyle } from "react-native";
import { COLORS } from "../../constants/Colors";

interface SearchBarProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: ViewStyle;
  onSubmit?: () => void;
}

// 아사나 탭 검색창과 동일한 디자인 — 둥근 12, surface 배경, 좌측 아이콘 없음
export function SearchBar({
  value,
  onChangeText,
  placeholder = "검색",
  autoFocus,
  style,
  onSubmit,
}: SearchBarProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textSecondary}
      style={[styles.input, style as any]}
      autoFocus={autoFocus}
      returnKeyType="search"
      onSubmitEditing={onSubmit}
      clearButtonMode={Platform.OS === "ios" ? "while-editing" : "never"}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.surfaceDark,
  },
});
