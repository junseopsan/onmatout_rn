import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/Colors";
import { Asana } from "../lib/api/asanas";

interface AsanaCardProps {
  asana: Asana;
  onPress: (asana: Asana) => void;
}

export function AsanaCard({ asana, onPress }: AsanaCardProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "1":
        return COLORS.success;
      case "2":
        return COLORS.warning;
      case "3":
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case "1":
        return "초급";
      case "2":
        return "중급";
      case "3":
        return "고급";
      default:
        return "미정";
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(asana)}
      activeOpacity={0.8}
    >
      {/* 이미지 영역 (나중에 실제 이미지로 교체) */}
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageNumber}>{asana.image_number}</Text>
        </View>
      </View>

      {/* 내용 영역 */}
      <View style={styles.content}>
        <Text style={styles.koreanName} numberOfLines={1}>
          {asana.sanskrit_name_kr}
        </Text>
        <Text style={styles.englishName} numberOfLines={1}>
          {asana.sanskrit_name_en}
        </Text>

        {/* 레벨 표시 */}
        <View style={styles.levelContainer}>
          <View
            style={[
              styles.levelBadge,
              { backgroundColor: getLevelColor(asana.level) },
            ]}
          >
            <Text style={styles.levelText}>{getLevelText(asana.level)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: "100%", // 부모 컨테이너의 너비에 맞춤
  },
  imageContainer: {
    height: 120,
    backgroundColor: COLORS.surfaceDark,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surfaceDark,
  },
  imageNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textSecondary,
  },
  content: {
    padding: 12,
  },
  koreanName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  englishName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontStyle: "italic",
  },
  levelContainer: {
    marginBottom: 8,
  },
  levelBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
  },
  category: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  meaning: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },
});
