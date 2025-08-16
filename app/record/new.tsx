import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { EMOTIONS, ENERGY_LEVELS } from "../../constants/emotions";
import { Asana, asanasAPI } from "../../lib/api/asanas";
import { recordsAPI } from "../../lib/api/records";
import { RecordFormData } from "../../types/record";
import { TamaguiButtonComponent } from "../../components/ui/TamaguiButton";
import { TamaguiInputComponent } from "../../components/ui/TamaguiInput";
import { AsanaCard } from "../../components/AsanaCard";

export default function NewRecordScreen() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Asana[]>([]);
  const [selectedAsanas, setSelectedAsanas] = useState<Asana[]>([]);
  const [memo, setMemo] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedEnergyLevel, setSelectedEnergyLevel] = useState<string>("");
  const [searching, setSearching] = useState(false);

  // 아사나 검색
  const searchAsanas = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const result = await asanasAPI.searchAsanas(query);
      
      if (result.success && result.data) {
        // 이미 선택된 아사나는 제외
        const filteredResults = result.data.filter(
          asana => !selectedAsanas.find(selected => selected.id === asana.id)
        );
        setSearchResults(filteredResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("아사나 검색 에러:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // 검색어 변경 시 검색 실행
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAsanas(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // 아사나 선택
  const handleAsanaSelect = (asana: Asana) => {
    if (selectedAsanas.length >= 10) {
      Alert.alert("알림", "최대 10개의 아사나만 선택할 수 있습니다.");
      return;
    }
    
    setSelectedAsanas(prev => [...prev, asana]);
    setSearchQuery("");
    setSearchResults([]);
  };

  // 아사나 선택 해제
  const handleAsanaRemove = (asanaId: string) => {
    setSelectedAsanas(prev => prev.filter(asana => asana.id !== asanaId));
  };

  // 감정 선택/해제
  const toggleEmotion = (emotionId: string) => {
    setSelectedEmotions(prev => {
      if (prev.includes(emotionId)) {
        return prev.filter(id => id !== emotionId);
      } else {
        return [...prev, emotionId];
      }
    });
  };

  // 에너지 레벨 선택
  const selectEnergyLevel = (energyLevelId: string) => {
    setSelectedEnergyLevel(energyLevelId);
  };

  // 기록 저장
  const handleSave = async () => {
    if (selectedAsanas.length === 0) {
      Alert.alert("알림", "최소 1개의 아사나를 선택해주세요.");
      return;
    }

    if (selectedEmotions.length === 0) {
      Alert.alert("알림", "감정 상태를 선택해주세요.");
      return;
    }

    if (!selectedEnergyLevel) {
      Alert.alert("알림", "에너지 레벨을 선택해주세요.");
      return;
    }

    try {
      setLoading(true);

      const recordData: RecordFormData = {
        asanas: selectedAsanas.map(asana => asana.id),
        memo: memo.trim(),
        emotions: selectedEmotions,
        energy_level: selectedEnergyLevel,
        photos: [], // TODO: 사진 첨부 기능 추가
      };

      const result = await recordsAPI.upsertRecord(recordData);

      if (result.success) {
        Alert.alert(
          "성공",
          "오늘의 수련 기록이 저장되었습니다!",
          [
            {
              text: "확인",
              onPress: () => {
                // TODO: 기록 탭으로 돌아가기
                console.log("기록 저장 완료");
              },
            },
          ]
        );
      } else {
        Alert.alert("오류", result.message || "기록 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("기록 저장 에러:", error);
      Alert.alert("오류", "기록 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>새 기록 작성</Text>
        <Text style={styles.subtitle}>오늘의 수련을 기록해보세요</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 아사나 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수련한 아사나</Text>
          <Text style={styles.sectionSubtitle}>
            최대 10개까지 선택 가능 ({selectedAsanas.length}/10)
          </Text>

          {/* 아사나 검색 */}
          <TamaguiInputComponent
            label="아사나 검색"
            placeholder="아사나 이름을 검색하세요"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ marginBottom: 16 }}
          />

          {/* 검색 결과 */}
          {searching && (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.searchingText}>검색 중...</Text>
            </View>
          )}

          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              <Text style={styles.searchResultsTitle}>검색 결과</Text>
              {searchResults.map(asana => (
                <TouchableOpacity
                  key={asana.id}
                  style={styles.searchResultItem}
                  onPress={() => handleAsanaSelect(asana)}
                >
                  <AsanaCard asana={asana} onPress={() => {}} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 선택된 아사나 */}
          {selectedAsanas.length > 0 && (
            <View style={styles.selectedAsanas}>
              <Text style={styles.selectedAsanasTitle}>선택된 아사나</Text>
              {selectedAsanas.map((asana, index) => (
                <View key={asana.id} style={styles.selectedAsanaItem}>
                  <View style={styles.selectedAsanaInfo}>
                    <Text style={styles.selectedAsanaNumber}>{index + 1}</Text>
                    <Text style={styles.selectedAsanaName}>
                      {asana.sanskrit_name_kr}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleAsanaRemove(asana.id)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 메모 작성 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수련 메모</Text>
          <Text style={styles.sectionSubtitle}>
            느낀 점이나 신체 변화를 기록해보세요 (최대 500자)
          </Text>
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

        {/* 감정 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>감정 상태</Text>
          <Text style={styles.sectionSubtitle}>
            수련 후 느낀 감정을 선택해주세요 (다중 선택 가능)
          </Text>
          <View style={styles.emotionsContainer}>
            {EMOTIONS.map(emotion => (
              <TouchableOpacity
                key={emotion.id}
                style={[
                  styles.emotionChip,
                  {
                    backgroundColor: selectedEmotions.includes(emotion.id)
                      ? emotion.color
                      : COLORS.surface,
                    borderColor: emotion.color,
                  },
                ]}
                onPress={() => toggleEmotion(emotion.id)}
              >
                <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                <Text
                  style={[
                    styles.emotionLabel,
                    {
                      color: selectedEmotions.includes(emotion.id)
                        ? "white"
                        : COLORS.text,
                    },
                  ]}
                >
                  {emotion.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 에너지 레벨 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>에너지 레벨</Text>
          <Text style={styles.sectionSubtitle}>
            수련 후 에너지 상태를 선택해주세요
          </Text>
          <View style={styles.energyLevelsContainer}>
            {ENERGY_LEVELS.map(energyLevel => (
              <TouchableOpacity
                key={energyLevel.id}
                style={[
                  styles.energyLevelChip,
                  {
                    backgroundColor:
                      selectedEnergyLevel === energyLevel.id
                        ? energyLevel.color
                        : COLORS.surface,
                    borderColor: energyLevel.color,
                  },
                ]}
                onPress={() => selectEnergyLevel(energyLevel.id)}
              >
                <Text style={styles.energyLevelEmoji}>{energyLevel.emoji}</Text>
                <Text
                  style={[
                    styles.energyLevelLabel,
                    {
                      color:
                        selectedEnergyLevel === energyLevel.id
                          ? "white"
                          : COLORS.text,
                    },
                  ]}
                >
                  {energyLevel.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 저장 버튼 */}
        <View style={styles.saveButtonContainer}>
          <TamaguiButtonComponent
            title={loading ? "저장 중..." : "기록 저장"}
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            size="large"
          />
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />
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
    marginBottom: 32,
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
  searchingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  searchingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  searchResults: {
    marginBottom: 16,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  searchResultItem: {
    marginBottom: 8,
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
  selectedAsanaItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedAsanaInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedAsanaNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
    marginRight: 12,
    minWidth: 24,
  },
  selectedAsanaName: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "white",
    fontSize: 16,
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
  emotionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emotionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    minWidth: 80,
  },
  emotionEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  emotionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  energyLevelsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  energyLevelChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    minWidth: 80,
  },
  energyLevelEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  energyLevelLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveButtonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  bottomSpacing: {
    height: 100,
  },
});
