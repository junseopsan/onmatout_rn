import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RecordCalendar from "../../components/RecordCalendar";
import RecordCard from "../../components/RecordCard";
import RecordDetailModal from "../../components/RecordDetailModal";
import { TamaguiButtonComponent } from "../../components/ui/TamaguiButton";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { Asana, asanasAPI } from "../../lib/api/asanas";
import { recordsAPI } from "../../lib/api/records";
import { RootStackParamList } from "../../navigation/types";
import { Record } from "../../types/record";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RecordScreen() {
  const { isAuthenticated, loading, user, session } = useAuth();
  const [todayRecords, setTodayRecords] = useState<Record[]>([]);
  const [allRecords, setAllRecords] = useState<Record[]>([]);
  const [allAsanas, setAllAsanas] = useState<Asana[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [loadingAsanas, setLoadingAsanas] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
  const navigation = useNavigation<NavigationProp>();

  // 디버깅을 위한 로그
  useEffect(() => {
    console.log("=== RecordScreen 렌더링 ===");
    console.log("isAuthenticated:", isAuthenticated);
    console.log("loading:", loading);
    console.log("user:", user);
    console.log("session:", session);
  }, [isAuthenticated, loading, user, session]);

  // 데이터 로드
  useEffect(() => {
    console.log("=== 데이터 로드 useEffect 실행 ===");
    console.log("isAuthenticated:", isAuthenticated);

    if (isAuthenticated) {
      console.log("인증됨 - 데이터 로드 시작");
      loadAllData();
    } else {
      console.log("인증되지 않음 - 데이터 로드 스킵");
      setLoadingRecord(false);
      setLoadingAsanas(false);
    }
  }, [isAuthenticated]);

  // 화면이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      console.log("=== 화면 포커스 - 데이터 새로고침 ===");
      if (isAuthenticated) {
        loadAllData();
      }
    }, [isAuthenticated])
  );

  const loadAllData = async () => {
    try {
      setLoadingRecord(true);
      setLoadingAsanas(true);

      // 병렬로 데이터 로드
      const [recordsResult, todayRecordsResult, asanasResult] =
        await Promise.all([
          recordsAPI.getRecentRecords(),
          recordsAPI.getTodayRecords(),
          asanasAPI.getAllAsanas(),
        ]);

      if (recordsResult.success) {
        setAllRecords(recordsResult.data || []);
      }

      if (todayRecordsResult.success) {
        setTodayRecords(todayRecordsResult.data || []);
      }

      if (asanasResult.success) {
        setAllAsanas(asanasResult.data || []);
      }
    } catch (error) {
      console.error("데이터 로드 에러:", error);
    } finally {
      setLoadingRecord(false);
      setLoadingAsanas(false);
    }
  };

  const handleNewRecord = () => {
    console.log("새 기록 작성 버튼 클릭");
    navigation.navigate("NewRecord");
  };

  // 새 기록 작성 후 돌아왔을 때 데이터 새로고침
  const handleRecordCreated = () => {
    console.log("기록 생성 완료 - 데이터 새로고침");
    loadAllData();
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setCurrentRecordIndex(0); // 날짜 변경 시 첫 번째 기록으로 리셋
  };

  const handleMonthChange = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const handleRecordPress = (record: Record) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  const handleEditRecord = (updatedRecord: Record) => {
    // 수정된 기록으로 목록 업데이트
    setAllRecords((prev) =>
      prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    );

    // 오늘 기록이 수정된 경우 todayRecords도 업데이트
    setTodayRecords((prev) =>
      prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    );

    // 모달 닫기
    setDetailModalVisible(false);
    setSelectedRecord(null);

    console.log("기록 수정 완료:", updatedRecord.id);
  };

  const handleDeleteRecord = async (record: Record) => {
    try {
      const result = await recordsAPI.deleteRecord(record.date);
      if (result.success) {
        // 기록 목록에서 제거
        setAllRecords((prev) => prev.filter((r) => r.id !== record.id));
        // 오늘 기록이 삭제된 경우 todayRecords도 업데이트
        setTodayRecords((prev) => prev.filter((r) => r.id !== record.id));
        // 모달 닫기
        setDetailModalVisible(false);
        setSelectedRecord(null);
      } else {
        Alert.alert("오류", result.message || "기록 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("기록 삭제 에러:", error);
      Alert.alert("오류", "기록 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleCloseModal = () => {
    setDetailModalVisible(false);
    setSelectedRecord(null);
  };

  // 페이지네이션 핸들러
  const handlePreviousRecord = () => {
    if (currentRecordIndex > 0) {
      setCurrentRecordIndex(currentRecordIndex - 1);
    }
  };

  const handleNextRecord = () => {
    if (currentRecordIndex < filteredRecords.length - 1) {
      setCurrentRecordIndex(currentRecordIndex + 1);
    }
  };

  // 선택된 날짜의 기록들 필터링
  const filteredRecords = allRecords.filter(
    (record) => record.date === selectedDate
  );

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading) {
    console.log("=== 인증 로딩 중 - 빈 화면 반환 ===");
    return null;
  }

  if (!isAuthenticated) {
    console.log("=== 인증되지 않음 - 빈 화면 반환 ===");
    return null;
  }

  console.log("=== RecordScreen 메인 렌더링 ===");
  console.log("loadingRecord:", loadingRecord);
  console.log("todayRecords:", todayRecords);
  console.log("filteredRecords:", filteredRecords);
  console.log("filteredRecords.length:", filteredRecords.length);
  console.log("currentRecordIndex:", currentRecordIndex);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}></Text>
        {allRecords.length > 0 && (
          <TouchableOpacity style={styles.addButton} onPress={handleNewRecord}>
            <Text style={styles.addButtonText}>+ 기록</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loadingRecord || loadingAsanas ? (
          <View style={styles.skeletonContainer}>
            {/* 캘린더 스켈레톤 */}
            <View style={styles.calendarSkeleton}>
              <View style={styles.calendarHeaderSkeleton}>
                <View style={styles.calendarTitleSkeleton} />
                <View style={styles.calendarNavSkeleton} />
              </View>
              <View style={styles.calendarGridSkeleton}>
                {[1, 2, 3, 4, 5, 6, 7].map((week) => (
                  <View key={week} style={styles.calendarWeekSkeleton}>
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <View key={day} style={styles.calendarDaySkeleton} />
                    ))}
                  </View>
                ))}
              </View>
            </View>

            {/* 기록 섹션 스켈레톤 */}
            <View style={styles.recordsSectionSkeleton}>
              <View style={styles.sectionHeaderSkeleton}>
                <View style={styles.sectionTitleSkeleton} />
                <View style={styles.recordCountSkeleton} />
              </View>

              {/* 기록 카드 스켈레톤 */}
              <View style={styles.recordCardSkeleton}>
                <View style={styles.recordCardHeaderSkeleton}>
                  <View style={styles.recordDateSkeleton} />
                  <View style={styles.recordTimeSkeleton} />
                </View>
                <View style={styles.recordContentSkeleton}>
                  <View style={styles.recordAsanaListSkeleton}>
                    {[1, 2, 3].map((item) => (
                      <View key={item} style={styles.recordAsanaItemSkeleton} />
                    ))}
                  </View>
                  <View style={styles.recordNoteSkeleton} />
                </View>
              </View>
            </View>
          </View>
        ) : allRecords.length === 0 ? (
          // 기록이 없는 경우
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>오늘의 수련을 기록해보세요</Text>
            <Text style={styles.emptyDescription}>
              수련한 아사나, 느낀 점, 상태 등을 기록하여{"\n"}
              나만의 요가 여정을 만들어가세요.
            </Text>

            <View style={styles.buttonContainer}>
              <TamaguiButtonComponent
                title="새 기록 작성"
                onPress={handleNewRecord}
                size="medium"
                style={{ marginTop: 24 }}
              />
            </View>
          </View>
        ) : (
          // 기록이 있는 경우
          <View style={styles.content}>
            {/* 캘린더 */}
            <RecordCalendar
              records={allRecords}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              currentYear={currentYear}
              currentMonth={currentMonth}
              onMonthChange={handleMonthChange}
            />

            {/* 선택된 날짜의 기록들 */}
            <View style={styles.recordsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedDate === new Date().toISOString().split("T")[0]
                    ? "오늘의 수련"
                    : `${selectedDate} `}
                </Text>
                {filteredRecords.length > 1 ? (
                  <View style={styles.paginationContainer}>
                    <TouchableOpacity
                      style={styles.paginationButton}
                      onPress={handlePreviousRecord}
                      disabled={currentRecordIndex === 0}
                    >
                      <Text style={styles.paginationButtonText}>‹</Text>
                    </TouchableOpacity>

                    <Text style={styles.recordCount}>
                      {currentRecordIndex + 1} / {filteredRecords.length}
                    </Text>

                    <TouchableOpacity
                      style={styles.paginationButton}
                      onPress={handleNextRecord}
                      disabled={
                        currentRecordIndex === filteredRecords.length - 1
                      }
                    >
                      <Text style={styles.paginationButtonText}>›</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  filteredRecords.length > 0 && (
                    <Text style={styles.recordCount}>
                      {filteredRecords.length}번
                    </Text>
                  )
                )}
              </View>

              {filteredRecords.length === 0 ? (
                <View style={styles.noRecordsContainer}>
                  <Text style={styles.noRecordsText}>
                    기록된 수련이 없습니다.
                  </Text>
                </View>
              ) : (
                <View style={styles.recordContainer}>
                  {/* 현재 기록 표시 */}
                  <RecordCard
                    record={filteredRecords[currentRecordIndex]}
                    asanas={allAsanas}
                    onPress={handleRecordPress}
                  />
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 기록 상세 모달 */}
      <RecordDetailModal
        visible={detailModalVisible}
        record={selectedRecord}
        asanas={allAsanas}
        onClose={handleCloseModal}
        onEdit={handleEditRecord}
        onDelete={handleDeleteRecord}
      />
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // 하단 여백 추가
  },
  content: {
    flex: 1,
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
  recordsSection: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  recordCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  noRecordsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  noRecordsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  recordsList: {
    paddingBottom: 24,
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
  recordContainer: {
    flex: 1,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  paginationButton: {
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  paginationButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  paginationButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  paginationText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
    marginHorizontal: 8,
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 100, // 하단 여백 추가
  },
  calendarSkeleton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  calendarHeaderSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarTitleSkeleton: {
    width: 100,
    height: 24,
    backgroundColor: COLORS.border,
    borderRadius: 8,
  },
  calendarNavSkeleton: {
    width: 50,
    height: 24,
    backgroundColor: COLORS.border,
    borderRadius: 8,
  },
  calendarGridSkeleton: {
    flexDirection: "column",
  },
  calendarWeekSkeleton: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  calendarDaySkeleton: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.border,
    borderRadius: 15,
  },
  recordsSectionSkeleton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  sectionHeaderSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleSkeleton: {
    width: 150,
    height: 24,
    backgroundColor: COLORS.border,
    borderRadius: 8,
  },
  recordCountSkeleton: {
    width: 50,
    height: 24,
    backgroundColor: COLORS.border,
    borderRadius: 8,
  },
  recordCardSkeleton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recordCardHeaderSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recordDateSkeleton: {
    width: 80,
    height: 24,
    backgroundColor: COLORS.border,
    borderRadius: 8,
  },
  recordTimeSkeleton: {
    width: 60,
    height: 24,
    backgroundColor: COLORS.border,
    borderRadius: 8,
  },
  recordContentSkeleton: {
    marginTop: 12,
  },
  recordAsanaListSkeleton: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  recordAsanaItemSkeleton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.border,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  recordNoteSkeleton: {
    width: "100%",
    height: 80,
    backgroundColor: COLORS.border,
    borderRadius: 12,
    marginTop: 12,
  },
});
