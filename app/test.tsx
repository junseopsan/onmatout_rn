import React from "react";
import { Text, View } from "react-native";
import { COLORS } from "../constants/Colors";

export default function TestScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 24, color: COLORS.text }}>테스트 화면</Text>
      <Text
        style={{ fontSize: 16, color: COLORS.textSecondary, marginTop: 10 }}
      >
        앱이 정상적으로 작동합니다
      </Text>
    </View>
  );
}
