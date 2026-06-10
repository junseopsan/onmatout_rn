import React, { useState } from "react";
import { Text, TextInput, TextStyle, View, ViewStyle } from "react-native";
import { COLORS } from "../../constants/Colors";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  error,
  disabled = false,
  style,
  inputStyle,
  onBlur,
  autoFocus,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const containerStyle: ViewStyle = {
    marginBottom: 16,
    ...style,
  };

  const labelStyle: TextStyle = {
    fontSize: 14,
    fontWeight: "500" as const,
    color: COLORS.text,
    marginBottom: 8,
  };

  const inputContainerStyle: ViewStyle = {
    borderWidth: 1,
    borderColor: error
      ? COLORS.error
      : isFocused
      ? COLORS.primary
      : COLORS.border,
    borderRadius: 8,
    backgroundColor: disabled ? COLORS.surface : COLORS.background,
    paddingHorizontal: 16,
    minHeight: 48,
    justifyContent: "center",
  };

  const textInputStyle: TextStyle = {
    fontSize: 16,
    color: disabled ? COLORS.textSecondary : COLORS.text,
    ...inputStyle,
  };

  const errorStyle: TextStyle = {
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.error,
    marginTop: 4,
    minHeight: 20, // 에러 유무와 상관없이 높이 고정 (레이아웃 점프 방지)
  };

  return (
    <View style={containerStyle}>
      {label && <Text style={labelStyle}>{label}</Text>}
      <View style={inputContainerStyle}>
        <TextInput
          style={textInputStyle}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!disabled}
          autoFocus={autoFocus}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
        />
      </View>
      <Text style={errorStyle} numberOfLines={1}>
        {error || ""}
      </Text>
    </View>
  );
};
