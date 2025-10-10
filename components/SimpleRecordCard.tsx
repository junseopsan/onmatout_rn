import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/Colors";
import { Record } from "../types/record";

interface SimpleRecordCardProps {
  record: Record;
  onPress: (record: Record) => void;
}

export default function SimpleRecordCard({
  record,
  onPress,
}: SimpleRecordCardProps) {
  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[date.getDay()];

    return `${month}월 ${day}일 (${weekday})`;
  };

  // 첫 번째 아사나 이미지 가져오기
  const getFirstAsanaImage = () => {
    if (record.asanas && record.asanas.length > 0) {
      const firstAsana = record.asanas[0];

      if (firstAsana.image_number) {
        const baseNumber = firstAsana.image_number.padStart(3, "0");
        const imageUrl = `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/${baseNumber}_001.png`;
        return imageUrl;
      }
    }
    return null;
  };

  // 아사나 제목 가져오기 (record.title 사용)
  const getAsanaTitle = () => {
    return record.title || "수련 기록";
  };

  // 추가 아사나 개수 가져오기
  const getAdditionalAsanaCount = () => {
    if (record.asanas && record.asanas.length > 1) {
      return record.asanas.length - 1;
    }
    return 0;
  };

  const imageUrl = getFirstAsanaImage();
  const title = getAsanaTitle();
  const additionalCount = getAdditionalAsanaCount();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(record)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {imageUrl ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.asanaImage}
                contentFit="contain"
                onError={(error) => {
                  console.log("SimpleRecordCard - Image load error:", error);
                }}
                onLoad={() => {
                  console.log("SimpleRecordCard - Image loaded successfully");
                }}
              />
              {additionalCount > 0 && (
                <View style={styles.overlay}>
                  <Text style={styles.overlayText}>+{additionalCount}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="fitness" size={24} color={COLORS.textSecondary} />
            </View>
          )}
          <View style={styles.textSection}>
            <Text style={styles.dateText}>{formatDate(record.created_at)}</Text>
            <Text style={styles.titleText}>{title}</Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  imageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
    position: "relative",
  },
  asanaImage: {
    width: "80%",
    height: "80%",
  },
  overlay: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: "center",
  },
  overlayText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textSection: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
});
