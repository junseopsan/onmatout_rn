import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
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
import { SelectedAsanaList } from "../../components/record/SelectedAsanaList";
import SimpleDatePicker from "../../components/SimpleDatePicker";
import { AlertDialog } from "../../components/ui/AlertDialog";
import { Button } from "../../components/ui/Button";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { COLORS } from "../../constants/Colors";
import { STATES } from "../../constants/states";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import { Asana } from "../../lib/api/asanas";
import { recordsAPI } from "../../lib/api/records";
import { storageAPI } from "../../lib/api/storage";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { RecordFormData } from "../../types/record";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface NewRecordScreenProps {
  onClose?: () => void;
}

export default function NewRecordScreen({ onClose }: NewRecordScreenProps) {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated } = useAuth();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAsanas, setSelectedAsanas] = useState<Asana[]>([]);
  const [memo, setMemo] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { showSnackbar } = useNotification();

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
    // best-effort delete from storage
    storageAPI.deleteRecordPhoto(url).catch(() => undefined);
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

  // 닫기 핸들러
  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }

    // 스택 화면으로 사용되는 경우 기본 goBack
    navigation.goBack();
  };

  // 기록 저장
  const handleSave = async () => {
    // 로그인 체크
    if (!isAuthenticated) {
      AlertDialog.login(
        () => navigation.navigate("Auth" as never),
        () => {} // 취소 시 아무것도 하지 않음
      );
      return;
    }

    // 아사나만 필수 (메모/컨디션/사진은 선택)
    if (selectedAsanas.length === 0) {
      Alert.alert("알림", "수련한 아사나를 1개 이상 선택해주세요.");
      return;
    }

    try {
      setLoading(true);

      // 메모가 없으면 아사나로 제목 자동 생성
      const fallbackTitle =
        selectedAsanas.length === 1
          ? selectedAsanas[0].sanskrit_name_kr
          : `${selectedAsanas[0].sanskrit_name_kr} 외 ${selectedAsanas.length - 1}개`;

      const recordData: RecordFormData = {
        title: memo.trim() || fallbackTitle,
        asanas: selectedAsanas.map((asana) => asana.id),
        memo: memo.trim(),
        states: selectedStates,
        photos,
        date: selectedDate.toISOString().split("T")[0], // 선택한 날짜
      };

      const result = await recordsAPI.createRecord(recordData, user?.id);

      if (result.success) {
        // 성공 시 스낵바 표시
        showSnackbar("수련 기록이 저장되었습니다.", "success");

        // React Query 캐시 무효화: 홈 탭/프로필/기록 관련 데이터 새로고침
        queryClient.invalidateQueries({ queryKey: ["feedRecords"] });
        queryClient.invalidateQueries({ queryKey: ["todayRecords"] });
        queryClient.invalidateQueries({ queryKey: ["recentRecords"] });
        queryClient.invalidateQueries({ queryKey: ["allRecords"] });

        // 저장 후 원래 화면으로 복귀 (수련 탭에서 왔으면 수련 탭으로)
        if (onClose) {
          onClose();
        } else {
          navigation.goBack();
        }
      } else {
        Alert.alert("오류", result.message || "기록 저장에 실패했습니다.");
      }
    } catch {
      Alert.alert("오류", "기록 저장 중 오류가 발생했습니다.");
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>수련 기록</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 수련 날짜 선택 */}
        <View style={styles.section}>
          <SectionLabel>수련 날짜</SectionLabel>
          <SimpleDatePicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </View>

        {/* 아사나 선택 (필수) */}
        <View style={styles.section}>
          <SectionLabel>아사나 (필수)</SectionLabel>
          <Button
            title="+ 아사나"
            size="medium"
            onPress={() => setSearchModalVisible(true)}
            style={{ alignSelf: "flex-start" }}
          />

          <Text style={styles.asanaCountText}>
            오늘 수련한 자세를 추가하세요 ({selectedAsanas.length}/20)
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

        {/* 오늘 컨디션 (선택) */}
        <View style={styles.section}>
          <SectionLabel>오늘 컨디션 (선택)</SectionLabel>
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
          <Text style={styles.stateSubtitleText}>최대 3개까지 선택</Text>
        </View>

        {/* 메모 작성 (선택) */}
        <View style={styles.section}>
          <SectionLabel>메모 (선택)</SectionLabel>
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

        {/* 사진 첨부 (선택) */}
        <View style={styles.section}>
          <SectionLabel>
            사진 (선택) {photos.length}/{MAX_PHOTOS}
          </SectionLabel>
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
          title="저장"
          size="large"
          loading={loading}
          disabled={selectedAsanas.length === 0}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
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
  sectionHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
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
  saveButtonContainer: {
    marginTop: 24,
    marginBottom: 32,
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
