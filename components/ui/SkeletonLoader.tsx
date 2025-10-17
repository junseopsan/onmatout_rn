import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { COLORS } from "../../constants/Colors";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// 피드 아이템 스켈레톤
export const FeedItemSkeleton: React.FC = () => (
  <View style={styles.feedItemSkeleton}>
    <View style={styles.feedItemHeader}>
      <SkeletonLoader width={40} height={40} borderRadius={20} />
      <View style={styles.feedItemHeaderText}>
        <SkeletonLoader width={120} height={16} />
        <SkeletonLoader width={80} height={12} style={{ marginTop: 4 }} />
      </View>
    </View>

    <View style={styles.feedItemContent}>
      <SkeletonLoader width="100%" height={200} borderRadius={12} />
    </View>

    <View style={styles.feedItemFooter}>
      <SkeletonLoader width={60} height={16} />
      <SkeletonLoader width={40} height={16} />
    </View>
  </View>
);

// 요가원 카드 스켈레톤
export const StudioCardSkeleton: React.FC = () => (
  <View style={styles.studioCardSkeleton}>
    <View style={styles.studioCardHeader}>
      <View style={styles.studioCardTitleContainer}>
        <SkeletonLoader width={200} height={20} />
        <SkeletonLoader width={150} height={14} style={{ marginTop: 8 }} />
      </View>
      <SkeletonLoader width={40} height={40} borderRadius={8} />
    </View>

    <View style={styles.studioCardContent}>
      <SkeletonLoader width="100%" height={12} style={{ marginBottom: 4 }} />
      <SkeletonLoader width="80%" height={12} style={{ marginBottom: 4 }} />
      <SkeletonLoader width="60%" height={12} />
    </View>
  </View>
);

// 아사나 카드 스켈레톤
export const AsanaCardSkeleton: React.FC = () => (
  <View style={styles.asanaCardSkeleton}>
    <SkeletonLoader width={120} height={120} borderRadius={12} />
    <View style={styles.asanaCardContent}>
      <SkeletonLoader width={100} height={16} />
      <SkeletonLoader width={80} height={12} style={{ marginTop: 4 }} />
      <SkeletonLoader width={40} height={10} style={{ marginTop: 8 }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.surface,
  },
  feedItemSkeleton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  feedItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  feedItemHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  feedItemContent: {
    marginBottom: 12,
  },
  feedItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  studioCardSkeleton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  studioCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  studioCardTitleContainer: {
    flex: 1,
  },
  studioCardContent: {
    marginTop: 8,
  },
  asanaCardSkeleton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  asanaCardContent: {
    marginTop: 8,
    alignItems: "center",
  },
});
