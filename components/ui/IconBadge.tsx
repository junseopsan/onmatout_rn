import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { COLORS } from "../../constants/Colors";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface IconBadgeProps {
  name: IoniconName;
  /** 아이콘/틴트 색. 기본 primary */
  color?: string;
  /** 뱃지(틴트 박스) 한 변 크기. 기본 24 */
  size?: number;
  /** 아이콘 글리프 크기. 기본 = size * 0.6 */
  iconSize?: number;
  style?: ViewStyle;
}

// 리스트 행 앞에 붙는 아이콘을 일관된 틴트 뱃지로 통일.
// 글리프(name)만 바뀌고 스타일은 항상 동일하다.
export function IconBadge({
  name,
  color = COLORS.primary,
  size = 24,
  iconSize,
  style,
}: IconBadgeProps) {
  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size / 3),
          backgroundColor: color + "26", // ~15% 틴트
        },
        style,
      ]}
    >
      <Ionicons name={name} size={iconSize ?? Math.round(size * 0.6)} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    justifyContent: "center",
  },
});
