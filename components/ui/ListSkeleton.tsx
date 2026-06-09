import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";

interface ListSkeletonProps {
  count?: number;
  rowHeight?: number;
  spacing?: number;
  style?: ViewStyle;
}

// 카드 모양의 회색 박스를 부드럽게 깜빡임. ActivityIndicator 대체.
export function ListSkeleton({
  count = 4,
  rowHeight = 80,
  spacing = SPACING.md,
  style,
}: ListSkeletonProps) {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.85, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={[styles.wrap, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.row,
            { height: rowHeight, marginBottom: i < count - 1 ? spacing : 0 },
            animatedStyle,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  row: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
