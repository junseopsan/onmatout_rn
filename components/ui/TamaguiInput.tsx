import { Label, styled, Input as TamaguiInput, YStack } from "tamagui";
import { InputProps } from "./types";

const StyledInput = styled(TamaguiInput, {
  backgroundColor: "$surface",
  borderColor: "$border",
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 16,
  color: "$text",
  minHeight: 48,

  placeholderTextColor: "$textSecondary",

  focusStyle: {
    borderColor: "$primary",
    backgroundColor: "$surface",
  },

  variants: {
    hasError: {
      true: {
        borderColor: "$error",
      },
    },
  } as const,
});

const StyledLabel = styled(Label, {
  fontSize: 14,
  fontWeight: "500",
  color: "$text",
  marginBottom: 8,
});

const ErrorText = styled(Label, {
  fontSize: 12,
  color: "$error",
  marginTop: 4,
});

export function TamaguiInputComponent({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  keyboardType = "default",
  secureTextEntry = false,
  style,
  inputStyle,
}: InputProps) {
  return (
    <YStack space="$2" style={style}>
      {label && <StyledLabel>{label}</StyledLabel>}
      <StyledInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        hasError={!!error}
        style={inputStyle}
      />
      {error && <ErrorText>{error}</ErrorText>}
    </YStack>
  );
}
