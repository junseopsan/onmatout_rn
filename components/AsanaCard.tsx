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
        {/* 한국어 이름과 레벨을 한 행에 배치 */}
        <View style={styles.nameRow}>
          <Text style={styles.koreanName} numberOfLines={1}>
            {asana.sanskrit_name_kr}
          </Text>

          {/* 레벨 배지를 우측 끝에 배치 */}
          <View
            style={[
              styles.levelBadge,
              { backgroundColor: getLevelColor(asana.level) },
            ]}
          >
            <Text style={styles.levelText}>{getLevelText(asana.level)}</Text>
          </View>
        </View>

        {/* 영어 이름은 별도 행에 배치 */}
        <Text style={styles.englishName} numberOfLines={1}>
          {asana.sanskrit_name_en}
        </Text>
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
    height: 140, // 120에서 140으로 증가
    backgroundColor: COLORS.surfaceDark,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surfaceDark,
  },
  imageNumber: {
    fontSize: 28, // 24에서 28로 증가
    fontWeight: "bold",
    color: COLORS.textSecondary,
  },
  content: {
    padding: 10, // 12에서 10으로 감소
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4, // 0에서 4로 변경하여 영어 이름과 간격 확보
  },
  koreanName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1, // 남은 공간을 모두 차지하도록 설정
    marginRight: 8, // 배지와의 간격
  },
  englishName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 0,
    fontStyle: "italic",
  },
  levelBadge: {
    alignSelf: "flex-end",
    paddingHorizontal: 8, // 6에서 8로 증가
    paddingVertical: 4, // 2에서 4로 증가
    borderRadius: 10, // 8에서 10으로 증가
    marginLeft: 8,
  },
  levelText: {
    fontSize: 11, // 9에서 11로 증가
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
