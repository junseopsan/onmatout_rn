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
import { RADIUS, SPACING } from "../../constants/Design";

interface PillInputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
  required?: boolean;
}

// Floga 스타일 pill 입력 필드
export function PillInput({
  label,
  hint,
  error,
  multiline,
  required,
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
          style={multiline ? styles.inputMulti : styles.input}
          textAlignVertical={multiline ? "top" : undefined}
        />
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
    borderColor: "transparent",
  },
  boxMulti: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 90,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  boxFocused: { borderColor: COLORS.primary },
  boxError: { borderColor: COLORS.error },
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
