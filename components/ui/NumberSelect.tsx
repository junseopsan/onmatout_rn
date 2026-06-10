import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { Sheet } from "./Sheet";

export interface NumberSelectOption {
  label: string;
  value: number;
}

interface NumberSelectProps {
  label?: string;
  /** 숫자 문자열 ("" = 미입력) */
  value: string;
  onChangeValue: (v: string) => void;
  options: NumberSelectOption[];
  /** 숫자 뒤 단위 (분, 일 등) */
  suffix?: string;
  placeholder?: string;
  /** 입력 박스 너비 (미지정 시 전체 너비) */
  width?: number;
}

/**
 * 프리셋 선택(드롭다운) + 숫자 직접 입력이 모두 되는 입력 컴포넌트.
 * 우측 v 버튼으로 옵션 시트를 열거나, 칸에 직접 숫자를 입력할 수 있다.
 */
export function NumberSelect({
  label,
  value,
  onChangeValue,
  options,
  suffix,
  placeholder,
  width,
}: NumberSelectProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.box,
          focused && styles.boxFocused,
          width != null && { width },
        ]}
      >
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(t) => onChangeValue(t.replace(/[^\d]/g, ""))}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="number-pad"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {suffix && value ? <Text style={styles.suffix}>{suffix}</Text> : null}
        <TouchableOpacity
          onPress={() => setOpen(true)}
          style={styles.chevron}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <Sheet visible={open} onClose={() => setOpen(false)} title={label ?? "선택"}>
        {options.map((o) => {
          const on = String(o.value) === value;
          return (
            <TouchableOpacity
              key={o.value}
              style={[styles.optRow, on && styles.optRowOn]}
              onPress={() => {
                onChangeValue(String(o.value));
                setOpen(false);
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.optText,
                  on && { color: COLORS.primary, fontWeight: "800" },
                ]}
              >
                {o.label}
              </Text>
              {on ? (
                <Ionicons name="checkmark" size={18} color={COLORS.primary} />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.md },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
  },
  boxFocused: { borderColor: COLORS.primary },
  input: { flex: 1, color: COLORS.text, fontSize: 16, padding: 0 },
  suffix: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 6,
  },
  chevron: {
    marginLeft: 8,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  optRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: RADIUS.md,
  },
  optRowOn: { backgroundColor: "rgba(139, 92, 246, 0.08)" },
  optText: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
});
