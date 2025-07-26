import { Button as TamaguiButton, styled } from "tamagui";
import { ButtonProps } from "./types";

const StyledButton = styled(TamaguiButton, {
  backgroundColor: "$primary",
  borderRadius: 8,
  paddingVertical: 12,
  paddingHorizontal: 24,
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,

  variants: {
    size: {
      small: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        minHeight: 36,
      },
      large: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        minHeight: 56,
      },
    },
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

  return (
    <StyledButton
      size={size}
      variant={tamaguiVariant}
      disabled={disabled || loading}
      onPress={onPress}
      style={style}
      {...props}
    >
      {loading ? "로딩 중..." : title}
    </StyledButton>
  );
}
