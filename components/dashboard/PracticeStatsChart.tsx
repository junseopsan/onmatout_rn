import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Circle } from "react-native-svg";
import { COLORS } from "../../constants/Colors";
import { Record } from "../../types/record";

interface PracticeStatsChartProps {
  records: Record[];
}

export default function PracticeStatsChart({
  records,
}: PracticeStatsChartProps) {
  const screenWidth = Dimensions.get("window").width;

  // 최근 7일간의 수련 데이터 생성
  const getLast7DaysData = () => {
    const data = [];
    const labels = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];

      // 해당 날짜의 기록 수 계산
      const dayRecords = records.filter((record) => record.date === dateString);
      const recordCount = dayRecords.length;

      data.push(recordCount);
      // 날짜를 M/D 형식으로 표시 (예: 8/14)
      const month = date.getMonth() + 1;
      const day = date.getDate();
      labels.push(`${month}/${day}`);
    }

    // 원본 데이터 그대로 사용
    return { data, labels };
  };

  // 카테고리별 수련 통계
  const getCategoryStats = () => {
    const categoryCount: { [key: string]: number } = {};

    records.forEach((record) => {
      record.asanas.forEach((asanaId) => {
        // 아사나 ID로 카테고리를 찾는 것은 복잡하므로 간단히 처리
        // 실제로는 아사나 정보가 필요함
        categoryCount["기타"] = (categoryCount["기타"] || 0) + 1;
      });
    });

    return {
      data: Object.values(categoryCount),
      labels: Object.keys(categoryCount),
    };
  };

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

  const { data: weeklyData, labels: weeklyLabels } = getLast7DaysData();
  const energyStats = getEnergyStats();

  const chartConfig = {
    backgroundColor: COLORS.surface,
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: COLORS.primary,
    },
  };

  const maxY = 5;
  const len = weeklyData.length;
  return (
    <View style={styles.container}>
      {/* 주간 수련 횟수 */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>주간 수련 횟수</Text>

        <LineChart
          data={{
            labels: weeklyLabels,
            datasets: [
              // ① 실제 데이터
              {
                data: weeklyData,
                color: (o = 1) => `#E53935`,
                strokeWidth: 2,
              },
              // ② y축 최대치 5 강제용 투명 더미
              {
                data: Array(len).fill(maxY),
                color: () => `rgba(0,0,0,0)`,
                strokeWidth: 0,
              },
            ],
          }}
          width={screenWidth - 64}
          height={180}
          chartConfig={{ ...chartConfig, decimalPlaces: 0 }}
          fromZero
          segments={5}
          yAxisInterval={1}
          withShadow={false}
          bezier={false}
          withVerticalLabels
          withHorizontalLabels
          withVerticalLines={false}
          withHorizontalLines
          style={styles.chart}
          withDots={false}
          decorator={(props: any) => {
            if (!props.x || !props.y) return null;
            return (
              <>
                {weeklyData.map((v, i) => (
                  <Circle
                    key={`dot-${i}`}
                    cx={props.x(i)}
                    cy={props.y(v)}
                    r={4}
                    stroke="white"
                    strokeWidth={2}
                    fill="#FF6B6B"
                  />
                ))}
              </>
            );
          }}
        />
      </View>

      {/* 에너지 상태 종합 분석 */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>수련 후 에너지 상태</Text>
        <View
          style={[
            styles.energyContainer,
            { borderLeftColor: energyStats.color, borderLeftWidth: 4 },
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

          {/* 상태별 세부 분석 */}
          <View style={styles.energyBreakdown}>
            <View style={styles.energyRow}>
              <Text style={styles.energyLabel}>긍정적 상태</Text>
              <Text style={styles.energyValue}>
                {energyStats.positiveCount}회
              </Text>
            </View>
            <View style={styles.energyRow}>
              <Text style={styles.energyLabel}>부정적 상태</Text>
              <Text style={styles.energyValue}>
                {energyStats.negativeCount}회
              </Text>
            </View>
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
          <Text style={styles.statNumber}>
            {records.length > 0 ? Math.round(records.length / 7) : 0}
          </Text>
          <Text style={styles.statLabel}>주평균</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {new Set(records.map((r) => r.date)).size}
          </Text>
          <Text style={styles.statLabel}>수련일수</Text>
        </View>
      </View>
    </View>
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
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  energyContainer: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    overflow: "hidden",
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
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  energyDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
  },
  energyValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
});
