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
import { Image } from "expo-image";
import AsanaSearchModal from "../../components/AsanaSearchModal";
import { Button } from "../../components/ui/Button";
import { SelectedAsanaList } from "../../components/record/SelectedAsanaList";
import SimpleDatePicker from "../../components/SimpleDatePicker";
import { COLORS } from "../../constants/Colors";
import { STATES } from "../../constants/states";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import { useUpdateRecord } from "../../hooks/useRecords";
import { Asana, asanasAPI } from "../../lib/api/asanas";
import { storageAPI } from "../../lib/api/storage";
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
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [memoSectionY, setMemoSectionY] = useState(0);
  const { showSnackbar } = useNotification();
  const updateRecordMutation = useUpdateRecord();
  const { user } = useAuth();

  const MAX_PHOTOS = 6;
  const handleAddPhotos = async () => {
    if (!user?.id) return;
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("알림", `최대 ${MAX_PHOTOS}장까지 첨부할 수 있어요.`);
      return;
    }
    setUploadingPhoto(true);
    try {
      const remaining = MAX_PHOTOS - photos.length;
      const result = await storageAPI.uploadRecordPhotos(user.id, remaining);
      if (result.success && result.urls) {
        setPhotos((prev) => [...prev, ...result.urls!]);
      } else if (!result.canceled && result.message) {
        Alert.alert("업로드 실패", result.message);
      }
    } finally {
      setUploadingPhoto(false);
    }
  };
  const handleRemovePhoto = (url: string) => {
    setPhotos((prev) => prev.filter((p) => p !== url));
    storageAPI.deleteRecordPhoto(url).catch(() => undefined);
  };

  // 기존 데이터로 폼 초기화
  useEffect(() => {
    if (record) {
      setMemo(record.memo || "");
      setSelectedStates(record.states || []);
      // 수련 날짜 설정
      const dateStr = record.practice_date || record.date || record.created_at;
      setSelectedDate(new Date(dateStr));
      // 기존 사진 로드
      const existing: string[] = Array.isArray(record.photos)
        ? (record.photos as string[])
        : [];
      setPhotos(existing.filter((u) => typeof u === "string" && u.length > 0));
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
        photos,
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
          <Button
            title="+ 아사나"
            size="medium"
            onPress={() => setSearchModalVisible(true)}
            style={{ alignSelf: "flex-start" }}
          />

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

        {/* 사진 첨부 */}
        <View style={styles.section}>
          <Text style={styles.stateSubtitleText}>
            사진 ({photos.length}/{MAX_PHOTOS})
          </Text>
          <View style={styles.photoGrid}>
            {photos.map((url) => (
              <View key={url} style={styles.photoItem}>
                <Image source={{ uri: url }} style={styles.photoImg} contentFit="cover" />
                <TouchableOpacity
                  style={styles.photoRemoveBtn}
                  onPress={() => handleRemovePhoto(url)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.photoRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <TouchableOpacity
                style={[styles.photoItem, styles.photoAdd]}
                onPress={handleAddPhotos}
                disabled={uploadingPhoto}
                activeOpacity={0.7}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator color={COLORS.textSecondary} />
                ) : (
                  <Text style={styles.photoAddText}>＋</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* 저장 버튼 */}
      <View style={styles.bottomActions}>
        <Button
          title="완료"
          size="large"
          loading={loading}
          disabled={
            selectedAsanas.length === 0 ||
            selectedStates.length === 0 ||
            memo.trim().length === 0
          }
          onPress={handleSave}
        />
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
  bottomSpacing: {
    height: 100,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  photoItem: {
    width: 78,
    height: 78,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    position: "relative",
  },
  photoImg: { width: "100%", height: "100%" },
  photoAdd: {
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
  },
  photoAddText: { color: COLORS.textSecondary, fontSize: 28, fontWeight: "300" },
  photoRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.error,
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemoveText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
});
