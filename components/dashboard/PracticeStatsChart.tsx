import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { Record } from "../../types/record";

interface PracticeStatsChartProps {
  records: Record[];
  isLoading?: boolean;
}

export default function PracticeStatsChart({
  records,
  isLoading = false,
}: PracticeStatsChartProps) {
  // 에너지 상태 종합 분석
  const getEnergyStats = () => {
    const energyScores = {
      calm: 0, // 차분
      peaceful: 0, // 평온
      energetic: 0, // 활기
      tired: 0, // 피곤
      focused: 0, // 집중
      tense: 0, // 긴장
      pressured: 0, // 압박
      balanced: 0, // 균형
    };

    let totalRecords = 0;

    records.forEach((record) => {
      record.states.forEach((stateId) => {
        if (energyScores.hasOwnProperty(stateId)) {
          energyScores[stateId as keyof typeof energyScores]++;
          totalRecords++;
        }
      });
    });

    // 에너지 균형 계산 (모든 8개 상태를 고려)
    // 긍정적 상태: 차분, 평온, 활기, 집중, 균형
    const positiveEnergy =
      energyScores.calm +
      energyScores.peaceful +
      energyScores.energetic +
      energyScores.focused +
      energyScores.balanced;

    // 부정적 상태: 피곤, 긴장, 압박
    const negativeEnergy =
      energyScores.tired + energyScores.tense + energyScores.pressured;

    // 에너지 상태 평가
    let energyStatus = "평온한";
    let energyEmoji = "😌";
    let energyColor = "#4CAF50";
    let energyDescription = "수련으로 마음이 평온해졌어요";

    if (totalRecords === 0) {
      energyStatus = "기록 없음";
      energyEmoji = "📝";
      energyColor = "#9E9E9E";
      energyDescription = "아직 수련 기록이 없어요";
    } else if (positiveEnergy > negativeEnergy * 2) {
      energyStatus = "매우 좋은";
      energyEmoji = "🌟";
      energyColor = "#4CAF50";
      energyDescription = "수련 효과가 뛰어나요!";
    } else if (positiveEnergy > negativeEnergy) {
      energyStatus = "좋은";
      energyEmoji = "😊";
      energyColor = "#8BC34A";
      energyDescription = "수련이 도움이 되고 있어요";
    } else if (negativeEnergy > positiveEnergy * 2) {
      energyStatus = "주의가 필요한";
      energyEmoji = "😔";
      energyColor = "#F44336";
      energyDescription = "수련 강도를 조절해보세요";
    } else if (negativeEnergy > positiveEnergy) {
      energyStatus = "개선이 필요한";
      energyEmoji = "🤔";
      energyColor = "#FF9800";
      energyDescription = "수련 방식을 점검해보세요";
    }

    return {
      status: energyStatus,
      emoji: energyEmoji,
      color: energyColor,
      description: energyDescription,
      totalRecords,
      breakdown: energyScores,
      positiveCount: positiveEnergy,
      negativeCount: negativeEnergy,
    };
  };

  const energyStats = getEnergyStats();

  // 이번 주 수련 횟수 계산 함수
  const getThisWeekCount = () => {
    if (records.length === 0) return 0;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // 일요일부터 시작
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // 토요일까지
    endOfWeek.setHours(23, 59, 59, 999);

    return records.filter((r) => {
      const recordDate = new Date(r.date || r.practice_date);
      return recordDate >= startOfWeek && recordDate <= endOfWeek;
    }).length;
  };

  // 이번 달 수련 횟수 계산 함수
  const getThisMonthCount = () => {
    if (records.length === 0) return 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return records.filter((r) => {
      const recordDate = new Date(r.date || r.practice_date);
      return (
        recordDate.getFullYear() === currentYear &&
        recordDate.getMonth() === currentMonth
      );
    }).length;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* 에너지 상태 스켈레톤 */}
        <View style={styles.chartSection}>
          <View style={styles.energyContainer}>
            <View style={styles.energyStatus}>
              <View style={styles.skeletonEmoji} />
              <View style={styles.energyTextContainer}>
                <View style={styles.skeletonText} />
                <View style={styles.skeletonText} />
              </View>
            </View>
            <View style={styles.energyBreakdown}>
              {[1, 2, 3, 4].map((item) => (
                <View key={item} style={styles.energyRow}>
                  <View style={styles.skeletonEmotionLabel} />
                  <View style={styles.skeletonEmotionValue} />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 통계 스켈레톤 */}
        <View style={styles.statsGrid}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.statCard}>
              <View style={styles.skeletonStatNumber} />
              <View style={styles.skeletonStatLabel} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 에너지 상태 종합 분석 */}
      <View style={styles.chartSection}>
        <View
          style={[
            styles.energyContainer,
            { borderLeftColor: energyStats.color, borderLeftWidth: 0.5 },
          ]}
        >
          {/* 에너지 상태 표시 */}
          <View style={styles.energyStatus}>
            <Text style={styles.energyEmoji}>{energyStats.emoji}</Text>
            <View style={styles.energyTextContainer}>
              <Text style={styles.energyStatusText}>
                {energyStats.status} 상태
              </Text>
              <Text style={styles.energyDescription}>
                {energyStats.description}
              </Text>
            </View>
          </View>

          {/* 선택한 감정 상태들 */}
          <View style={styles.energyBreakdown}>
            {Object.entries(energyStats.breakdown)
              .filter(([_, count]) => count > 0)
              .map(([emotion, count]) => {
                const getEmotionInfo = (emotionId: string) => {
                  switch (emotionId) {
                    case "calm":
                      return { label: "차분", color: "#2563EB" };
                    case "peaceful":
                      return { label: "평온", color: "#059669" };
                    case "energetic":
                      return { label: "활기", color: "#D97706" };
                    case "tired":
                      return { label: "피곤", color: "#374151" };
                    case "focus":
                      return { label: "집중", color: "#7C3AED" };
                    case "tense":
                      return { label: "긴장", color: "#DC2626" };
                    case "pressured":
                      return { label: "압박", color: "#BE185D" };
                    case "balanced":
                      return { label: "균형", color: "#047857" };
                    default:
                      return { label: emotionId, color: "#374151" };
                  }
                };

                const emotionInfo = getEmotionInfo(emotion);

                return (
                  <View key={emotion} style={styles.energyRow}>
                    <Text
                      style={[styles.energyLabel, { color: emotionInfo.color }]}
                    >
                      {emotionInfo.label}
                    </Text>
                    <Text style={styles.energyValue}>{count}회</Text>
                  </View>
                );
              })}
          </View>
        </View>
      </View>

      {/* 요약 통계 */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{records.length}</Text>
          <Text style={styles.statLabel}>총 수련 횟수</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{getThisWeekCount()}</Text>
          <Text style={styles.statLabel}>이번 주</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{getThisMonthCount()}</Text>
          <Text style={styles.statLabel}>이번 달</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 16,
  },
  chartSection: {
    marginBottom: 24,
    marginHorizontal: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#000000",
    textAlign: "center",
  },
  energyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  energyStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  energyEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  energyTextContainer: {
    flex: 1,
  },
  energyStatusText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#000000",
    marginBottom: 4,
  },
  energyDescription: {
    fontSize: 14,
    fontWeight: "900",
    color: "#000000",
    lineHeight: 18,
  },
  energyBreakdown: {
    gap: 8,
  },
  energyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  energyLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: "#374151",
  },
  energyValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  // 스켈레톤 스타일
  skeletonEmoji: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginRight: 12,
    opacity: 0.6,
  },
  skeletonText: {
    height: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: 8,
    opacity: 0.6,
  },
  skeletonEmotionLabel: {
    width: 60,
    height: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 7,
    opacity: 0.6,
  },
  skeletonEmotionValue: {
    width: 40,
    height: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 7,
    opacity: 0.6,
  },
  skeletonStatNumber: {
    width: 40,
    height: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 4,
    opacity: 0.6,
  },
  skeletonStatLabel: {
    width: 60,
    height: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    opacity: 0.6,
  },
});
