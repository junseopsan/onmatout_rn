import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { AlertDialog } from "../../components/ui/AlertDialog";
import { COLORS } from "../../constants/Colors";
import { STATES } from "../../constants/states";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import { Asana } from "../../lib/api/asanas";
import { recordsAPI } from "../../lib/api/records";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { RecordFormData } from "../../types/record";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NewRecordScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated } = useAuth();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedAsanas, setSelectedAsanas] = useState<Asana[]>([]);
  const [memo, setMemo] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const { showSnackbar } = useNotification();

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

  // 홈탭으로 이동
  const handleClose = () => {
    // TabNavigator로 이동하여 홈탭으로 이동
    navigation.navigate("TabNavigator");
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
        title: memo.trim(), // 메모 내용을 제목으로 사용
        asanas: selectedAsanas.map((asana) => asana.id),
        memo: memo.trim(),
        states: selectedStates,
        photos: [], // TODO: 사진 첨부 기능 추가
        date: new Date().toISOString().split("T")[0], // 오늘 날짜
      };

      const result = await recordsAPI.createRecord(recordData, user?.id);

      if (result.success) {
        // 성공 시 홈탭으로 이동하고 스낵바 표시
        showSnackbar("수련 기록이 저장되었습니다.", "success");
        navigation.reset({
          index: 0,
          routes: [{ name: "TabNavigator", params: { screen: "Dashboard" } }],
        });
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* X 버튼 */}
        <View style={styles.closeButtonContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
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
            최대 10개까지 선택 가능 ({selectedAsanas.length}/10)
          </Text>

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
            수련 후 느낀 상태를 선택해주세요 (다중 선택 가능)
          </Text>
        </View>

        {/* 메모 작성 */}
        <View style={styles.section}>
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
              저장
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
    marginBottom: 0,
    marginTop: -16,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
    paddingVertical: 8,
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
  saveButtonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  bottomSpacing: {
    height: 100,
  },
});
