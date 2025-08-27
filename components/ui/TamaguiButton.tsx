import { styled, Button as TamaguiButton, Text } from "tamagui";
import { ButtonProps } from "./types";

const StyledButton = styled(TamaguiButton, {
  backgroundColor: "$primary",
  borderRadius: 8,
  alignItems: "center",
  justifyContent: "center",

  variants: {
    variant: {
      outline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "$primary",
      },
      secondary: {
        backgroundColor: "$secondary",
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        backgroundColor: "$textSecondary",
      },
    },
  } as const,
});

export function TamaguiButtonComponent({
  title,
  onPress,
  loading = false,
  disabled = false,
  size = "medium",
  variant = "default",
  style,
  ...props
}: ButtonProps) {
  // variant 매핑
  const tamaguiVariant =
    variant === "primary"
      ? undefined
      : variant === "outline"
        ? "outlined"
        : variant === "secondary"
          ? "secondary"
          : undefined;

  // 크기에 따른 스타일
  const sizeStyle = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      minHeight: 36,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      minHeight: 48,
    },
  };

  return (
    <StyledButton
      variant={tamaguiVariant}
      disabled={disabled || loading}
      onPress={onPress}
      style={[sizeStyle[size], style]}
      {...props}
    >
      <Text style={{ fontSize: size === "small" ? 14 : 16, fontWeight: "600" }}>
        {loading ? "로딩 중..." : title}
      </Text>
    </StyledButton>
  );
}
