import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { COLORS } from "../../constants/Colors";

type Variant = "primary" | "secondary" | "outline" | "destructive";
type Size = "small" | "medium" | "large";
type Shape = "rect" | "pill";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  shape?: Shape;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const SIZE_STYLES: Record<Size, { padV: number; padH: number; minH: number; fontSize: number; gap: number }> = {
  small: { padV: 8, padH: 16, minH: 36, fontSize: 13, gap: 6 },
  medium: { padV: 12, padH: 20, minH: 44, fontSize: 14, gap: 8 },
  large: { padV: 14, padH: 24, minH: 52, fontSize: 15, gap: 10 },
};

function getContainerStyle(
  variant: Variant,
  size: Size,
  shape: Shape,
  disabled: boolean,
  fullWidth: boolean,
): ViewStyle {
  const s = SIZE_STYLES[size];
  const base: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s.padH,
    paddingVertical: s.padV,
    minHeight: s.minH,
    borderRadius: shape === "pill" ? 999 : 10,
    gap: s.gap,
  };
  if (fullWidth) base.flexGrow = 1;

  switch (variant) {
    case "primary":
      return {
        ...base,
        backgroundColor: disabled ? COLORS.border : COLORS.primary,
      };
    case "secondary":
      return {
        ...base,
        backgroundColor: disabled ? "transparent" : COLORS.surfaceDark,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: COLORS.border,
      };
    case "outline":
      return {
        ...base,
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: disabled ? COLORS.border : COLORS.primary,
      };
    case "destructive":
      return {
        ...base,
        backgroundColor: disabled ? COLORS.border : COLORS.error,
      };
  }
}

function getTextColor(variant: Variant, disabled: boolean): string {
  if (disabled) return COLORS.textMuted;
  switch (variant) {
    case "primary":
    case "destructive":
      return COLORS.white;
    case "secondary":
      return COLORS.text;
    case "outline":
      return COLORS.primary;
  }
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  shape = "rect",
  disabled = false,
  loading = false,
  fullWidth = false,
  prefix,
  suffix,
  style,
  textStyle,
}) => {
  const s = SIZE_STYLES[size];
  const isInactive = disabled || loading;
  const containerStyle = getContainerStyle(variant, size, shape, isInactive, fullWidth);
  const textColor = getTextColor(variant, isInactive);

  return (
    <Pressable
      style={({ pressed }) => [
        containerStyle,
        pressed && !isInactive && { opacity: 0.85 },
        style,
      ]}
      onPress={onPress}
      disabled={isInactive}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {prefix ? <View>{prefix}</View> : null}
          <Text
            style={[
              {
                fontSize: s.fontSize,
                fontWeight: "700",
                color: textColor,
                textAlign: "center",
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {suffix ? <View>{suffix}</View> : null}
        </>
      )}
    </Pressable>
  );
};
