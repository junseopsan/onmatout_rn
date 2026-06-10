import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";

interface PillInputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
  required?: boolean;
  suffix?: string;
}

// Floga 스타일 pill 입력 필드
export function PillInput({
  label,
  hint,
  error,
  multiline,
  required,
  suffix,
  ...rest
}: PillInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View
        style={[
          multiline ? styles.boxMulti : styles.box,
          focused && styles.boxFocused,
          error && styles.boxError,
        ]}
      >
        <View style={styles.inputRow}>
          <TextInput
            {...rest}
            multiline={multiline}
            onFocus={(e) => {
              setFocused(true);
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              rest.onBlur?.(e);
            }}
            placeholderTextColor={COLORS.textSecondary}
            style={[
              multiline ? styles.inputMulti : styles.input,
              !multiline && styles.inputFlex,
              suffix && !multiline ? styles.inputRightAlign : null,
            ]}
            textAlignVertical={multiline ? "top" : undefined}
          />
          {suffix && !multiline ? (
            <Text style={styles.suffix}>{suffix}</Text>
          ) : null}
        </View>
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.md },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  required: {
    color: COLORS.error,
    fontWeight: "700",
  },
  box: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: SPACING.lg,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  boxMulti: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 90,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  boxFocused: { borderColor: COLORS.primary },
  boxError: { borderColor: COLORS.error },
  inputRow: { flexDirection: "row", alignItems: "center" },
  inputFlex: { flex: 1 },
  inputRightAlign: { textAlign: "right" },
  suffix: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 6,
  },
  input: { color: COLORS.text, fontSize: 16, padding: 0 },
  inputMulti: { color: COLORS.text, fontSize: 16, padding: 0, minHeight: 60 },
  hint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: SPACING.xs,
    paddingHorizontal: 4,
  },
  error: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SPACING.xs,
    paddingHorizontal: 4,
  },
});
