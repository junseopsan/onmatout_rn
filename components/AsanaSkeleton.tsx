import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { COLORS } from "../constants/Colors";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = (screenWidth - 48) / 2; // 2열 그리드, 좌우 패딩 16씩

interface AsanaSkeletonProps {
  count?: number;
}

export const AsanaSkeleton: React.FC<AsanaSkeletonProps> = ({ count = 6 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.cardContainer}>
          <View style={styles.card}>
            {/* 이미지 스켈레톤 */}
            <View style={styles.imageSkeleton} />

            {/* 텍스트 스켈레톤들 */}
            <View style={styles.contentContainer}>
              <View style={styles.titleSkeleton} />
              <View style={styles.subtitleSkeleton} />
              <View style={styles.categorySkeleton} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: cardWidth,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageSkeleton: {
    width: "100%",
    height: 120,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 12,
  },
  contentContainer: {
    padding: 12,
  },
  titleSkeleton: {
    height: 16,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 8,
    width: "80%",
  },
  subtitleSkeleton: {
    height: 14,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 8,
    width: "60%",
  },
  categorySkeleton: {
    height: 20,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    width: "40%",
  },
});
