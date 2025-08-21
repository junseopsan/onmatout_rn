import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { STATES } from "../../constants/states";
import { Asana } from "../../lib/api/asanas";
import { Record } from "../../types/record";

interface TodayRecordCardProps {
  record: Record;
  asanas: Asana[];
  onPress: (record: Record) => void;
}

export default function TodayRecordCard({
  record,
  asanas,
  onPress,
}: TodayRecordCardProps) {
  // 아사나 정보 가져오기
  const getAsanaInfo = (asanaId: string) => {
    return asanas.find((asana) => asana.id === asanaId);
  };

  // 상태 정보 가져오기
  const getStateInfo = (stateId: string) => {
    return STATES.find((state) => state.id === stateId);
  };

  // 이미지 URL 생성
  const getImageUrl = (imageNumber: string) => {
    const formattedNumber = imageNumber.padStart(3, "0");
    return `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/thumbnail/${formattedNumber}.png`;
  };

  // 메모 요약 (1줄)
  const getMemoSummary = (memo: string) => {
    if (!memo.trim()) return "메모 없음";
    return memo.length > 30 ? memo.substring(0, 30) + "..." : memo;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(record)}>
      <View style={styles.header}>
        <Text style={styles.title}>{record.title}</Text>
        <Text style={styles.time}>
          {new Date(record.created_at).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </Text>
      </View>

      {/* 아사나 썸네일 */}
      {record.asanas.length > 0 && (
        <View style={styles.asanasSection}>
          <View style={styles.asanasGrid}>
            {record.asanas.slice(0, 3).map((asanaId, index) => {
              const asana = getAsanaInfo(asanaId);
              if (!asana) return null;

              return (
                <View key={asanaId} style={styles.asanaThumbnail}>
                  {asana.image_number ? (
                    <Image
                      source={{ uri: getImageUrl(asana.image_number) }}
                      style={styles.asanaImage}
                      contentFit="contain"
                      placeholder="🖼️"
                      placeholderContentFit="contain"
                    />
                  ) : (
                    <View style={styles.asanaImagePlaceholder}>
                      <Text style={styles.asanaImagePlaceholderText}>📝</Text>
                    </View>
                  )}
                  <Text style={styles.asanaName} numberOfLines={1}>
                    {asana.sanskrit_name_kr}
                  </Text>
                </View>
              );
            })}
            {record.asanas.length > 3 && (
              <View style={styles.moreIndicator}>
                <Text style={styles.moreText}>+{record.asanas.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 상태 칩 */}
      {record.states.length > 0 && (
        <View style={styles.statesSection}>
          {record.states.slice(0, 2).map((stateId) => {
            const state = getStateInfo(stateId);
            if (!state) return null;

            return (
              <View
                key={stateId}
                style={[
                  styles.stateChip,
                  {
                    borderColor: state.color,
                    backgroundColor: `${state.color}15`,
                  },
                ]}
              >
                <Text style={[styles.stateText, { color: state.color }]}>
                  {state.label}
                </Text>
              </View>
            );
          })}
          {record.states.length > 2 && (
            <Text style={styles.moreStatesText}>
              +{record.states.length - 2}
            </Text>
          )}
        </View>
      )}

      {/* 메모 요약 */}
      <Text style={styles.memoText}>{getMemoSummary(record.memo)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  asanasSection: {
    marginBottom: 12,
  },
  asanasGrid: {
    flexDirection: "row",
    gap: 8,
  },
  asanaThumbnail: {
    alignItems: "center",
    width: 60,
  },
  asanaImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#AAAAAA",
    marginBottom: 4,
  },
  asanaImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#AAAAAA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  asanaImagePlaceholderText: {
    fontSize: 16,
  },
  asanaName: {
    fontSize: 10,
    color: COLORS.text,
    textAlign: "center",
    fontWeight: "500",
  },
  moreIndicator: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceDark,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  moreText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  statesSection: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  stateChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  stateText: {
    fontSize: 11,
    fontWeight: "600",
  },
  moreStatesText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
    alignSelf: "center",
  },
  memoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});
