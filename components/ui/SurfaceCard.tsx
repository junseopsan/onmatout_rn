import React, { useCallback } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import { haptics } from "../../lib/haptics";

interface SurfaceCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  animated?: boolean;
  delay?: number;
  haptic?: "light" | "medium" | "select" | false;
}

// 표준 카드 — surface + 라운드 + fade-in entry + 누르면 살짝 scale-down
export function SurfaceCard({
  children,
  onPress,
  style,
  padded = true,
  animated = true,
  delay = 0,
  haptic = "light",
}: SurfaceCardProps) {
  const scale = useSharedValue(1);
  const pressedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(0.97, { damping: 15, stiffness: 250 });
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 250 });
  }, [onPress, scale]);

  const handlePress = useCallback(() => {
    if (!onPress) return;
    if (haptic) haptics[haptic]?.();
    onPress();
  }, [onPress, haptic]);

  const inner = (
    <View style={[styles.base, padded && styles.padded, style]}>{children}</View>
  );

  // 진입 애니메이션 제거 — 탭 전환 시 흔들림 방지. 누르면 살짝 줄어드는 인터랙션은 유지.
  if (!onPress) return inner;
  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={pressedStyle}>{inner}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.surface,
    borderRadius: 10, // 살짝 깎인 모서리만 — 너무 둥글지 않게
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  padded: {
    padding: SPACING.lg,
  },
});
