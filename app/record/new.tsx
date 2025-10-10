import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsanaSearchModal from "../../components/AsanaSearchModal";
import { COLORS } from "../../constants/Colors";
import { STATES } from "../../constants/states";
import { Asana } from "../../lib/api/asanas";
import { recordsAPI } from "../../lib/api/records";
import { RecordFormData } from "../../types/record";

export default function NewRecordScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedAsanas, setSelectedAsanas] = useState<Asana[]>([]);
  const [memo, setMemo] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 아사나 선택 해제
  const handleAsanaRemove = (asanaId: string) => {
    setSelectedAsanas((prev) => prev.filter((asana) => asana.id !== asanaId));
  };

  // 모달에서 선택된 아사나 처리
  const handleAsanaSelect = (newAsanas: Asana[]) => {
    const totalCount = selectedAsanas.length + newAsanas.length;
    if (totalCount > 10) {
      Alert.alert("알림", "최대 10개의 아사나만 선택할 수 있습니다.");
      return;
    }
    setSelectedAsanas((prev) => [...prev, ...newAsanas]);
  };

  // 상태 선택/해제
  const toggleState = (stateId: string) => {
    setSelectedStates((prev) => {
      if (prev.includes(stateId)) {
        return prev.filter((id) => id !== stateId);
      } else {
        return [...prev, stateId];
      }
    });
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[date.getDay()];
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
  };

  // 날짜 선택 핸들러
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  // 모달이 열릴 때 스크롤 위치 계산
  const getInitialScrollIndex = () => {
    const today = new Date().toISOString().split("T")[0];
    const targetDate = selectedDate || today;

    // 오늘 기준으로 몇 번째 인덱스인지 계산
    const todayDate = new Date();
    const targetDateObj = new Date(targetDate);
    const diffDays = Math.floor(
      (targetDateObj.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 오늘이 7번째 인덱스이므로, 차이를 더해서 계산
    return Math.max(0, Math.min(16, 7 + diffDays));
  };

  // 기록 저장
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("알림", "제목을 입력해주세요.");
      return;
    }

    if (selectedAsanas.length === 0) {
      Alert.alert("알림", "최소 1개의 아사나를 선택해주세요.");
      return;
    }

    if (selectedStates.length === 0) {
      Alert.alert("알림", "상태를 선택해주세요.");
      return;
    }

    try {
      setLoading(true);

      const recordData: RecordFormData = {
        title: title.trim(),
        asanas: selectedAsanas.map((asana) => asana.id),
        memo: memo.trim(),
        states: selectedStates,
        photos: [], // TODO: 사진 첨부 기능 추가
        date: selectedDate, // 선택된 날짜 추가
      };

      const result = await recordsAPI.createRecord(recordData);

      if (result.success) {
        // 성공 시 바로 모달 닫기
        navigation.goBack();
      } else {
        Alert.alert("오류", result.message || "기록 저장에 실패했습니다.");
      }
    } catch (error) {
      Alert.alert("오류", "기록 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 이미지 URL 생성
  const getImageUrl = (imageNumber: string) => {
    const formattedNumber = imageNumber.padStart(3, "0");
    return `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/thumbnail/${formattedNumber}.png`;
  };

  // 선택된 아사나 카드 렌더링
  const renderSelectedAsanaCard = ({
    item,
    index,
  }: {
    item: Asana;
    index: number;
  }) => {
    return (
      <View style={styles.selectedAsanaCard}>
        <View style={styles.selectedAsanaImageContainer}>
          {item.image_number ? (
            <Image
              source={{ uri: getImageUrl(item.image_number) }}
              style={styles.selectedAsanaImage}
              contentFit="contain"
              placeholder="🖼️"
              placeholderContentFit="contain"
            />
          ) : (
            <View style={styles.selectedAsanaImagePlaceholder}>
              <Text style={styles.selectedAsanaImagePlaceholderText}>📝</Text>
            </View>
          )}
        </View>
        <View style={styles.selectedAsanaInfo}>
          <Text style={styles.selectedAsanaNumber}>{index + 1}</Text>
          <Text style={styles.selectedAsanaName} numberOfLines={1}>
            {item.sanskrit_name_kr}
          </Text>
          <Text style={styles.selectedAsanaNameEn} numberOfLines={1}>
            {item.sanskrit_name_en}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleAsanaRemove(item.id)}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 날짜 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수련 날짜</Text>
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            <Text style={styles.dateChangeText}>변경</Text>
          </TouchableOpacity>
        </View>

        {/* 제목 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기록 제목</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="수련 기록의 제목을 입력해주세요..."
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
          <Text style={styles.characterCount}>{title.length}/50</Text>
        </View>

        {/* 아사나 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수련한 아사나</Text>
          <Text style={styles.sectionSubtitle}>
            최대 10개까지 선택 가능 ({selectedAsanas.length}/10)
          </Text>

          {/* 아사나 추가 버튼 */}
          <TouchableOpacity
            style={styles.addAsanaButton}
            onPress={() => setSearchModalVisible(true)}
          >
            <Text style={styles.addAsanaButtonText}>+ 아사나 추가</Text>
          </TouchableOpacity>

          {/* 선택된 아사나 */}
          {selectedAsanas.length > 0 && (
            <View style={styles.selectedAsanas}>
              <Text style={styles.selectedAsanasTitle}>수련한 아사나</Text>
              <FlatList
                data={selectedAsanas}
                renderItem={renderSelectedAsanaCard}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.selectedAsanaRow}
                contentContainerStyle={styles.selectedAsanaList}
              />
            </View>
          )}
        </View>

        {/* 상태 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수련 후 상태</Text>
          <Text style={styles.sectionSubtitle}>
            수련 후 느낀 상태를 선택해주세요 (다중 선택 가능)
          </Text>
          <View style={styles.statesContainer}>
            {STATES.map((state) => (
              <TouchableOpacity
                key={state.id}
                style={[
                  styles.stateChip,
                  {
                    backgroundColor: COLORS.surface,
                    borderColor: selectedStates.includes(state.id)
                      ? state.color
                      : "#666666",
                    borderWidth: selectedStates.includes(state.id) ? 2 : 1,
                  },
                ]}
                onPress={() => toggleState(state.id)}
              >
                <Text
                  style={[
                    styles.stateLabel,
                    {
                      color: selectedStates.includes(state.id)
                        ? state.color
                        : COLORS.text,
                    },
                  ]}
                >
                  {state.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 메모 작성 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수련 메모</Text>
          <TextInput
            style={styles.memoInput}
            placeholder="오늘 수련에서 느낀 점을 자유롭게 기록해보세요..."
            value={memo}
            onChangeText={setMemo}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{memo.length}/500</Text>
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* 저장 버튼 */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (loading ||
              !title.trim() ||
              selectedAsanas.length === 0 ||
              selectedStates.length === 0 ||
              memo.trim().length === 0) &&
              styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={
            loading ||
            !title.trim() ||
            selectedAsanas.length === 0 ||
            selectedStates.length === 0 ||
            memo.trim().length === 0
          }
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                (!title.trim() ||
                  !selectedAsanas.length ||
                  !selectedStates.length ||
                  !memo.trim()) &&
                  styles.saveButtonTextDisabled,
              ]}
            >
              기록 저장
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 날짜 선택 모달 */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>날짜 선택</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>닫기</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              style={styles.datePickerContent}
              showsVerticalScrollIndicator={true}
              data={Array.from({ length: 17 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - 7 + i);
                return {
                  id: i,
                  dateString: date.toISOString().split("T")[0],
                  isToday: i === 7,
                  isFuture: i > 7,
                };
              })}
              keyExtractor={(item) => item.id.toString()}
              initialScrollIndex={getInitialScrollIndex()}
              getItemLayout={(data, index) => ({
                length: 56, // dateOption 높이 (48 + 8)
                offset: 56 * index,
                index,
              })}
              renderItem={({ item }) => {
                const isSelected = item.dateString === selectedDate;

                return (
                  <TouchableOpacity
                    style={[
                      styles.dateOption,
                      isSelected && styles.dateOptionSelected,
                      item.isToday && !isSelected && styles.dateOptionToday,
                      item.isFuture && styles.dateOptionDisabled,
                    ]}
                    onPress={() =>
                      !item.isFuture && handleDateSelect(item.dateString)
                    }
                    disabled={item.isFuture}
                  >
                    <Text
                      style={[
                        styles.dateOptionText,
                        isSelected && styles.dateOptionTextSelected,
                        item.isToday &&
                          !isSelected &&
                          styles.dateOptionTextToday,
                        item.isFuture && styles.dateOptionTextDisabled,
                      ]}
                    >
                      {formatDate(item.dateString)}
                      {item.isFuture && " (선택 불가)"}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* 아사나 검색 모달 */}
      <AsanaSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSelect={handleAsanaSelect}
        selectedAsanas={selectedAsanas}
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
    paddingTop: 60,
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
  section: {
    marginBottom: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  addAsanaButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  addAsanaButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  selectedAsanas: {
    marginTop: 16,
  },
  selectedAsanasTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  selectedAsanaList: {
    paddingBottom: 8,
  },
  selectedAsanaRow: {
    justifyContent: "space-between",
    marginBottom: 8,
  },
  selectedAsanaCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  selectedAsanaImageContainer: {
    width: "100%",
    height: 60,
    borderRadius: 6,
    backgroundColor: "#8A8A8A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  selectedAsanaImage: {
    width: "100%",
    height: "100%",
  },
  selectedAsanaImagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#8A8A8A",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedAsanaImagePlaceholderText: {
    fontSize: 20,
  },
  selectedAsanaInfo: {
    alignItems: "center",
    width: "100%",
  },
  selectedAsanaNumber: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 2,
  },
  selectedAsanaName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 2,
  },
  selectedAsanaNameEn: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.error,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  memoInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 120,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "right",
    marginTop: 8,
  },
  statesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stateChip: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    minWidth: 80,
  },
  stateLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  bottomActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceDark,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.surfaceDark,
    opacity: 0.5,
  },
  saveButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  saveButtonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  bottomSpacing: {
    height: 100,
  },
  titleInput: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 56,
  },
  dateSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  dateChangeText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
  },
  datePickerContent: {
    maxHeight: 300,
    paddingVertical: 8,
  },
  dateOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  dateOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateOptionToday: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  dateOptionText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 20,
  },
  dateOptionTextSelected: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  dateOptionTextToday: {
    color: COLORS.primary,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  dateOptionDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.5,
  },
  dateOptionTextDisabled: {
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
