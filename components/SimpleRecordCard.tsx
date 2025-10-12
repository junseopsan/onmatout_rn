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
  console.log("SimpleRecordCard 렌더링됨 - record:", record);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[date.getDay()];

    return `${month}월 ${day}일 (${weekday})`;
  };

  // 첫 번째 아사나 이미지 URL 생성 (아사나 객체에서 image_number 사용)
  const getFirstAsanaImageUrl = () => {
    console.log("SimpleRecordCard - record.asanas:", record.asanas);
    if (record.asanas && record.asanas.length > 0) {
      const firstAsana = record.asanas[0];
      console.log("SimpleRecordCard - firstAsana:", firstAsana);
      
      // 아사나 객체에서 image_number 속성 사용
      if (firstAsana && firstAsana.image_number) {
        const paddedId = firstAsana.image_number.padStart(3, "0");
        const imageUrl = `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/${paddedId}_001.png`;
        console.log("SimpleRecordCard - generated imageUrl:", imageUrl);
        return imageUrl;
      }
    }
    return null;
  };

  // 추가 아사나 개수 가져오기
  const getAdditionalAsanaCount = () => {
    if (record.asanas && record.asanas.length > 1) {
      return record.asanas.length - 1;
    }
    return 0;
  };

  const imageUrl = getFirstAsanaImageUrl();
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
                onError={() => {
                  console.log("SimpleRecordCard - Image load error:", imageUrl);
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
              {additionalCount > 0 && (
                <View style={styles.overlay}>
                  <Text style={styles.overlayText}>+{additionalCount}</Text>
                </View>
              )}
            </View>
          )}
          <View style={styles.textSection}>
            <Text style={styles.dateText}>{formatDate(record.created_at)}</Text>
            <Text style={styles.memoText} numberOfLines={2}>
              {record.memo || "메모 없음"}
            </Text>
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
    position: "relative",
  },
  textSection: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  memoText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 20,
  },
});
