import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { COLORS } from "../../constants/Colors";

interface FabButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

// 우측 하단 floating action — 작은 사각형. 가운데 + 와 라벨 두 줄.
export function FabButton({
  label,
  onPress,
  loading,
  disabled,
  style,
}: FabButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.btn, disabled && styles.btnDisabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.white} size="small" />
      ) : (
        <>
          <Text style={styles.plus}>+</Text>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(139, 92, 246, 0.78)", // primary + 살짝 투명
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
  },
  plus: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  label: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 0,
    letterSpacing: 0.3,
  },
});
