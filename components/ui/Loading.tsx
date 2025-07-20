import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { COLORS } from "../../constants/Colors";

interface LoadingProps {
  size?: "small" | "large";
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = "large",
  color = COLORS.primary,
  text,
  fullScreen = false,
}) => {
  const containerStyle = fullScreen
    ? {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        backgroundColor: COLORS.background,
      }
    : {
        justifyContent: "center" as const,
        alignItems: "center" as const,
        padding: 20,
      };

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text
          style={{
            marginTop: 12,
            fontSize: 16,
            color: COLORS.textSecondary,
            textAlign: "center",
          }}
        >
          {text}
        </Text>
      )}
    </View>
  );
};
