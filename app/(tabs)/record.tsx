import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { Record } from "../../types/record";
import { recordsAPI } from "../../lib/api/records";
import { TamaguiButtonComponent } from "../../components/ui/TamaguiButton";

export default function RecordScreen() {
  const { isAuthenticated, loading } = useAuth();
  const [todayRecord, setTodayRecord] = useState<Record | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(true);

  // 오늘 기록 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadTodayRecord();
    }
  }, [isAuthenticated]);

  const loadTodayRecord = async () => {
    try {
      setLoadingRecord(true);
      const result = await recordsAPI.getTodayRecord();
      
      if (result.success) {
        setTodayRecord(result.data || null);
      } else {
        console.error("오늘 기록 로드 실패:", result.message);
      }
    } catch (error) {
      console.error("오늘 기록 로드 예외:", error);
    } finally {
      setLoadingRecord(false);
    }
  };

  const handleNewRecord = () => {
    // TODO: 새 기록 작성 화면으로 이동
    Alert.alert("새 기록", "새 기록 작성 기능이 곧 추가됩니다!");
  };

  const handleEditRecord = () => {
    // TODO: 기록 수정 화면으로 이동
    Alert.alert("기록 수정", "기록 수정 기능이 곧 추가됩니다!");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "오늘";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "어제";
    } else {
      return date.toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "long",
      });
    }
  };

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>기록</Text>
        <Text style={styles.subtitle}>요가 수련 기록</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loadingRecord ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>기록을 불러오는 중...</Text>
          </View>
        ) : todayRecord ? (
          // 오늘 기록이 있는 경우
          <View style={styles.recordContainer}>
            <View style={styles.recordHeader}>
              <Text style={styles.recordDate}>{formatDate(todayRecord.date)}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditRecord}
              >
                <Text style={styles.editButtonText}>수정</Text>
              </TouchableOpacity>
            </View>

            {/* 선택된 아사나 */}
            {todayRecord.asanas && todayRecord.asanas.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>수련한 아사나</Text>
                <Text style={styles.sectionContent}>
                  {todayRecord.asanas.length}개의 아사나를 수련했습니다
                </Text>
              </View>
            )}

            {/* 메모 */}
            {todayRecord.memo && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>수련 메모</Text>
                <Text style={styles.sectionContent}>{todayRecord.memo}</Text>
              </View>
            )}

            {/* 감정 */}
            {todayRecord.emotions && todayRecord.emotions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>감정 상태</Text>
                <Text style={styles.sectionContent}>
                  {todayRecord.emotions.join(", ")}
                </Text>
              </View>
            )}

            {/* 에너지 레벨 */}
            {todayRecord.energy_level && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>에너지 레벨</Text>
                <Text style={styles.sectionContent}>
                  {todayRecord.energy_level}
                </Text>
              </View>
            )}

            {/* 사진 */}
            {todayRecord.photos && todayRecord.photos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>첨부 사진</Text>
                <Text style={styles.sectionContent}>
                  {todayRecord.photos.length}장의 사진이 첨부되어 있습니다
                </Text>
              </View>
            )}
          </View>
        ) : (
          // 오늘 기록이 없는 경우
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>오늘의 수련을 기록해보세요</Text>
            <Text style={styles.emptyDescription}>
              수련한 아사나, 느낀 점, 감정 상태 등을 기록하여{'\n'}
              나만의 요가 여정을 만들어가세요.
            </Text>
            
            <View style={styles.buttonContainer}>
              <TamaguiButtonComponent
                title="새 기록 작성"
                onPress={handleNewRecord}
                size="large"
                style={{ marginTop: 24 }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60, // 상태바 높이 + 여백
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  recordContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  recordDate: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
});
