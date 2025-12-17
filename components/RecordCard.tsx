import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/Colors";
import { STATES } from "../constants/states";
import { Asana } from "../lib/api/asanas";
import { Record } from "../types/record";

interface RecordCardProps {
  record: Record;
  asanas: Asana[];
  onPress: (record: Record) => void;
}

export default function RecordCard({
  record,
  asanas,
  onPress,
}: RecordCardProps) {
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
      {/* 제목 섹션 */}
      <View style={styles.memoSection}>
        <Text style={styles.sectionTitle}>제목</Text>
        <Text style={styles.recordTitle}>{record.title}</Text>
      </View>
      {/* 아사나 썸네일 - 맨 위로 이동 */}
      {record.asanas.length > 0 && (
        <View style={styles.asanasSection}>
          <View style={styles.asanasHeader}>
            <Text style={styles.sectionTitle}>수련한 아사나</Text>
            {/* 상태 칩 - 오른쪽 끝 */}
            {record.states.length > 0 && (
              <View style={styles.statesContainer}>
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
          </View>
          <View style={styles.asanasThumbnailContainer}>
            <View style={styles.asanasGrid}>
              {record.asanas.slice(0, 4).map((asanaId, index) => {
                const asana = getAsanaInfo(asanaId);
                if (!asana) return null;

                return (
                  <View key={asanaId} style={styles.asanaThumbnail}>
                    <View style={styles.asanaImageContainer}>
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
                          <Text style={styles.asanaImagePlaceholderText}>
                            📝
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.asanaName} numberOfLines={1}>
                      {asana.sanskrit_name_kr}
                    </Text>
                  </View>
                );
              })}
              {record.asanas.length > 4 && (
                <View style={styles.moreIndicator}>
                  <Text style={styles.moreText}>
                    +{record.asanas.length - 4}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 상단 헤더 - 두 번째로 이동 */}
      <View style={styles.header}>
        <View style={styles.dateInfo}></View>
      </View>

      {/* 메모 요약 */}
      <View style={styles.memoSection}>
        <Text style={styles.sectionTitle}>메모</Text>
        <Text style={styles.memoText}>{getMemoSummary(record.memo)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  titleSection: {
    marginBottom: 16,
  },
  recordTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  asanasSection: {
    marginBottom: 16,
  },
  asanasHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  asanasThumbnailContainer: {
    marginHorizontal: -20, // RecordCard의 padding(20)을 상쇄하여 달력과 동일한 너비로 맞추기
  },
  asanasGrid: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20, // 썸네일 영역 내부에 패딩 추가
  },
  asanaThumbnail: {
    alignItems: "center",
    width: 70,
  },
  asanaImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 4,
    marginBottom: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  asanaImage: {
    width: "100%",
    height: "100%",
  },
  asanaImagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  asanaImagePlaceholderText: {
    fontSize: 20,
  },
  asanaName: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
  moreIndicator: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceDark,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  moreText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  statesContainer: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  stateChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  stateText: {
    fontSize: 12,
    fontWeight: "600",
  },
  moreStatesText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  memoSection: {
    marginBottom: 4,
  },
  memoText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    fontWeight: "500",
  },
});
