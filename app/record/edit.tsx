import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsanaSearchModal from "../../components/AsanaSearchModal";
import { SelectedAsanaList } from "../../components/record/SelectedAsanaList";
import SimpleDatePicker from "../../components/SimpleDatePicker";
import { COLORS } from "../../constants/Colors";
import { STATES } from "../../constants/states";
import { useNotification } from "../../contexts/NotificationContext";
import { useUpdateRecord } from "../../hooks/useRecords";
import { Asana, asanasAPI } from "../../lib/api/asanas";
import { RootStackParamList } from "../../navigation/types";
import { RecordFormData } from "../../types/record";

type EditRecordRouteProp = RouteProp<RootStackParamList, "EditRecord">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function EditRecordScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditRecordRouteProp>();
  const { record } = route.params;

  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date(record.practice_date || record.date || record.created_at)
  );
  const [selectedAsanas, setSelectedAsanas] = useState<Asana[]>([]);
  const [memo, setMemo] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [memoSectionY, setMemoSectionY] = useState(0);
  const { showSnackbar } = useNotification();
  const updateRecordMutation = useUpdateRecord();

  // 기존 데이터로 폼 초기화
  useEffect(() => {
    if (record) {
      setMemo(record.memo || "");
      setSelectedStates(record.states || []);
      // 수련 날짜 설정
      const dateStr = record.practice_date || record.date || record.created_at;
      setSelectedDate(new Date(dateStr));
      // 아사나 데이터는 별도로 로드해야 함
      loadAsanaData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record]);

  // 아사나 데이터 로드
  const loadAsanaData = async () => {
    if (record.asanas && record.asanas.length > 0) {
      // record.asanas가 이미 아사나 객체 배열인 경우
      if (typeof record.asanas[0] === "object" && record.asanas[0].id) {
        setSelectedAsanas(record.asanas as Asana[]);
      } else {
        // record.asanas가 ID 배열인 경우
        try {
          const asanaPromises = record.asanas.map((asanaId: string) =>
            asanasAPI.getAsanaById(asanaId)
          );
          const asanaResults = await Promise.all(asanaPromises);
          const validAsanas = asanaResults
            .filter((result) => result.success && result.data)
            .map((result) => result.data!);
          setSelectedAsanas(validAsanas);
        } catch (error) {
          console.error("아사나 데이터 로드 실패:", error);
        }
      }
    }
  };

  // 아사나 선택 해제
  const handleAsanaRemove = (asanaId: string) => {
    setSelectedAsanas((prev) => prev.filter((asana) => asana.id !== asanaId));
  };

  // 모달에서 선택된 아사나 처리
  const handleAsanaSelect = (newAsanas: Asana[]) => {
    const totalCount = selectedAsanas.length + newAsanas.length;
    if (totalCount > 20) {
      Alert.alert("알림", "최대 20개의 아사나만 선택할 수 있습니다.");
      return;
    }
    setSelectedAsanas((prev) => [...prev, ...newAsanas]);
  };

  // 상태 선택/해제
  const toggleState = (stateId: string) => {
    setSelectedStates((prev) => {
      if (prev.includes(stateId)) {
        return prev.filter((id) => id !== stateId);
      }
      if (prev.length >= 3) {
        Alert.alert("알림", "최대 3개의 상태만 선택할 수 있습니다.");
        return prev;
      }
      return [...prev, stateId];
    });
  };

  // 수정 저장
  const handleSave = async () => {
    if (selectedAsanas.length === 0) {
      Alert.alert("알림", "최소 1개의 아사나를 선택해주세요.");
      return;
    }

    if (selectedStates.length === 0) {
      Alert.alert("알림", "상태를 선택해주세요.");
      return;
    }

    if (!memo.trim()) {
      Alert.alert("알림", "메모를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      const recordData: RecordFormData = {
        title: memo.trim(),
        asanas: selectedAsanas.map((asana) => asana.id),
        memo: memo.trim(),
        states: selectedStates,
        photos: [], // TODO: 사진 첨부 기능 추가
        date: selectedDate.toISOString().split("T")[0], // 선택한 날짜
      };

      const result = await updateRecordMutation.mutateAsync({
        id: record.id,
        recordData,
      });
      showSnackbar("수련 기록이 수정되었습니다.", "success");

      // API에서 반환된 실제 업데이트된 데이터 사용
      const updatedRecord = {
        ...(result.data || record),
        asanas: selectedAsanas, // Asana 객체 배열 유지
      };

      // 스택을 초기화하여 RecordDetail로 이동 (뒤로가기 시 마이페이지로 이동)
      navigation.reset({
        index: 1,
        routes: [
          { name: "TabNavigator", params: { screen: "Profile" } },
          { name: "RecordDetail", params: { record: updatedRecord } },
        ],
      });
    } catch (err) {
      console.error("기록 수정 오류:", err);
      Alert.alert("오류", "기록 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* X 버튼 */}
        <View style={styles.closeButtonContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 수련 날짜 선택 */}
        <View style={styles.section}>
          <SimpleDatePicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          <Text style={styles.stateSubtitleText}>수련 날짜를 선택해주세요</Text>
        </View>

        {/* 아사나 선택 */}
        <View style={styles.section}>
          {/* 아사나 추가 버튼 */}
          <TouchableOpacity
            style={styles.addAsanaButton}
            onPress={() => setSearchModalVisible(true)}
          >
            <Text style={styles.addAsanaButtonText}>+ 아사나</Text>
          </TouchableOpacity>

          <Text style={styles.asanaCountText}>
            최대 20개까지 선택 가능 ({selectedAsanas.length}/20)
          </Text>

          {/* 선택된 아사나 */}
          {selectedAsanas.length > 0 && (
            <View style={styles.selectedAsanas}>
              <Text style={styles.selectedAsanasTitle}>수련한 아사나</Text>
              <SelectedAsanaList
                asanas={selectedAsanas}
                onRemove={handleAsanaRemove}
              />
            </View>
          )}
        </View>

        {/* 상태 선택 */}
        <View style={styles.section}>
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
          <Text style={styles.stateSubtitleText}>
            수련 중 느낀 상태를 선택해주세요 (최대 3개)
          </Text>
        </View>

        {/* 메모 작성 */}
        <View
          style={styles.section}
          onLayout={(e) => {
            setMemoSectionY(e.nativeEvent.layout.y);
          }}
        >
          <TextInput
            style={styles.memoInput}
            placeholder="오늘 수련에서 느낀 점을 자유롭게 기록해보세요..."
            value={memo}
            onChangeText={setMemo}
            multiline
            maxLength={500}
            textAlignVertical="top"
            onFocus={() => {
              // 메모를 탭했을 때 자동으로 아래로 스크롤하여
              // 메모와 완료 버튼이 모두 보이도록 처리 (부드러운 애니메이션)
              setTimeout(() => {
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollTo({
                    y: Math.max(memoSectionY - 40, 0),
                    animated: true,
                  });
                }
              }, 200);
            }}
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
              selectedAsanas.length === 0 ||
              selectedStates.length === 0 ||
              memo.trim().length === 0) &&
              styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={
            loading ||
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
                (!selectedAsanas.length ||
                  !selectedStates.length ||
                  !memo.trim()) &&
                  styles.saveButtonTextDisabled,
              ]}
            >
              완료
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 아사나 검색 모달 */}
      <AsanaSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSelect={handleAsanaSelect}
        selectedAsanas={selectedAsanas}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  closeButtonContainer: {
    alignItems: "flex-end",
    marginBottom: 8,
    marginTop: -16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: "300",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addAsanaButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    alignSelf: "center",
    minWidth: 120,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addAsanaButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  asanaCountText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "right",
    marginTop: 8,
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
  memoInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 120,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: COLORS.border,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    minWidth: 80,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stateLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  stateSubtitleText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "right",
    marginTop: 12,
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
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  bottomSpacing: {
    height: 100,
  },
});
