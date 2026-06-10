import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";

const SCREEN_H = Dimensions.get("window").height;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
  maxHeightPct?: number;
  bodyStyle?: ViewStyle;
}

// 커스텀 트랜지션: backdrop fade + sheet spring slide
export function Sheet({
  visible,
  onClose,
  title,
  description,
  children,
  footer,
  scrollable = true,
  maxHeightPct = 0.85,
  bodyStyle,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const [rendered, setRendered] = React.useState(visible);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      progress.value = withSpring(1, { damping: 22, stiffness: 220, mass: 0.7 });
    } else {
      progress.value = withTiming(
        0,
        { duration: 200, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) {
            // unmount after exit animation
             
            // (Reanimated worklet → runOnJS not needed because state is React)
          }
        },
      );
      // exit cleanup via setTimeout (Modal still needs to be visible during slide-out)
      const t = setTimeout(() => setRendered(false), 220);
      return () => clearTimeout(t);
    }
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: (1 - progress.value) * SCREEN_H * 0.4,
      },
    ],
    opacity: 0.4 + progress.value * 0.6,
  }));

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <AnimatedPressable
          style={[styles.backdrop, backdropStyle]}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kavWrap}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              sheetStyle,
              {
                paddingBottom: Math.max(insets.bottom, SPACING.lg) + SPACING.md,
                maxHeight: SCREEN_H * maxHeightPct,
              },
            ]}
          >
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            {title || description ? (
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  {title ? <Text style={styles.title}>{title}</Text> : null}
                  {description ? (
                    <Text style={styles.description}>{description}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={22} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            ) : null}

            {scrollable ? (
              <ScrollView
                style={styles.body}
                contentContainerStyle={[styles.bodyContent, bodyStyle]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={[styles.body, styles.bodyContent, bodyStyle]}>
                {children}
              </View>
            )}

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  kavWrap: { width: "100%" },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  handleRow: {
    alignItems: "center",
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderStrong,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: SPACING.md,
  },
  title: {
    ...TEXT.uiTitle,
    color: COLORS.text,
  },
  description: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceDark,
  },
  body: { flexGrow: 0, flexShrink: 1 },
  bodyContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
});
