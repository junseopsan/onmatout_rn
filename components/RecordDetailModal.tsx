import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/Colors";
import { STATES } from "../constants/states";
import { getAsanaThumbnailSource } from "../lib/asanaImages";
import { Asana } from "../lib/api/asanas";
import { recordsAPI } from "../lib/api/records";
import { Record } from "../types/record";
import AsanaSearchModal from "./AsanaSearchModal";

interface RecordDetailModalProps {
  visible: boolean;
  record: Record | null;
  asanas: Asana[];
  onClose: () => void;
  onEdit?: (record: Record) => void;
  onDelete?: (record: Record) => void;
}

export default function RecordDetailModal({
  visible,
  record,
  asanas,
  onClose,
  onEdit,
  onDelete,
}: RecordDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<{
    title: string;
    asanas: string[];
    states: string[];
    memo: string;
  }>({
    title: "",
    asanas: [],
    states: [],
    memo: "",
  });
  const [asanaSearchVisible, setAsanaSearchVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 키보드 높이 추적 (Modal 안에서도 버튼을 키보드 위로 올리기 위해)
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (!record) return null;

  // 수련 날짜 포맷팅 (YYYY년 MM월 DD일 (요일))
  const formatPracticeDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekDay = weekDays[date.getDay()];

    return `${year}년 ${month}월 ${day}일 (${weekDay})`;
  };

  // 상대 시간 포맷팅 (15시간 전, 1일 전 등)
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "방금";
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;

    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  // 아사나 정보 가져오기
  const getAsanaInfo = (asanaId: string) => {
    return asanas.find((asana) => asana.id === asanaId);
  };

  // 상태 정보 가져오기
  const getStateInfo = (stateId: string) => {
    return STATES.find((state) => state.id === stateId);
  };

  // 이미지: 로컬 썸네일
  const getImageSource = (imageNumber: string) =>
    getAsanaThumbnailSource(imageNumber);

  // 수정 모드 시작
  const handleEdit = () => {
    setEditData({
      title: record.title,
      asanas: record.asanas,
      states: record.states,
      memo: record.memo,
    });
    setIsEditMode(true);
  };

  // 수정 모드 취소
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditData({
      title: "",
      asanas: [],
      states: [],
      memo: "",
    });
  };

  // 모달 닫기 (수정 모드일 때 초기화)
  const handleClose = () => {
    if (isEditMode) {
      setIsEditMode(false);
      setEditData({
        title: "",
        asanas: [],
        states: [],
        memo: "",
      });
    }
    onClose();
  };

  // 아사나 선택 처리
  const handleAsanaSelect = (selectedAsanas: Asana[]) => {
    setEditData((prev) => ({
      ...prev,
      asanas: selectedAsanas.map((asana) => asana.id),
    }));
    setAsanaSearchVisible(false);
  };

  // 제목 수정
  const handleTitleChange = (text: string) => {
    setEditData((prev) => ({
      ...prev,
      title: text,
    }));
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    try {
      // API 호출하여 수정
      const result = await recordsAPI.updateRecord(record.id, {
        title: editData.title,
        asanas: editData.asanas,
        memo: editData.memo,
        states: editData.states,
        photos: record.photos,
      });

      if (result.success && result.data) {
        // 수정된 데이터로 콜백 호출
        onEdit?.(result.data);
        setIsEditMode(false);
        onClose();
      } else {
        Alert.alert("오류", result.message || "수정 중 오류가 발생했습니다.");
      }
    } catch {
      Alert.alert("오류", "수정 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = () => {
    Alert.alert("기록 삭제", "이 기록을 삭제하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          onClose();
          onDelete?.(record);
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.title}>
            {isEditMode ? "기록 수정" : "기록 상세"}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 제목 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>기록 제목</Text>
            {isEditMode ? (
              <TextInput
                style={styles.titleInput}
                placeholder="수련 기록의 제목을 입력해주세요..."
                value={editData.title}
                onChangeText={handleTitleChange}
                maxLength={50}
              />
            ) : (
              <Text style={styles.titleText}>{record.title}</Text>
            )}
            {isEditMode && (
              <Text style={styles.characterCount}>
                {editData.title.length}/50
              </Text>
            )}
          </View>

          {/* 수련 날짜 표시 */}
          <View style={styles.dateSection}>
            <Text style={styles.dateText}>
              {formatPracticeDate(record.practice_date || record.date)}
            </Text>
          </View>

          {/* 아사나 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>수련한 아사나</Text>
              <Text style={styles.sectionSubtitle}>
                {isEditMode
                  ? `${editData.asanas.length}/20개 선택됨`
                  : `${record.asanas.length}개의 아사나`}
              </Text>
            </View>

            {isEditMode ? (
              // 수정 모드: 기록 추가 화면과 동일한 UI
              <>
                <Text
                  style={[styles.sectionSubtitle, styles.sectionSubtitleEdit]}
                >
                  최대 20개까지 선택 가능 ({editData.asanas.length}/20)
                </Text>

                {/* 아사나 추가 버튼 */}
                <TouchableOpacity
                  style={styles.addAsanaButton}
                  onPress={() => setAsanaSearchVisible(true)}
                >
                  <Text style={styles.addAsanaButtonText}>+ 아사나 추가</Text>
                </TouchableOpacity>

                {/* 선택된 아사나 */}
                {editData.asanas.length > 0 && (
                  <View style={styles.selectedAsanas}>
                    <Text style={styles.selectedAsanasTitle}>
                      수련한 아사나
                    </Text>
                    <View style={styles.selectedAsanaGrid}>
                      {editData.asanas.map((asanaId, index) => {
                        const asana = getAsanaInfo(asanaId);
                        if (!asana) return null;

                        return (
                          <View key={asanaId} style={styles.selectedAsanaCard}>
                            <View style={styles.selectedAsanaImageContainer}>
                              {(() => {
                                const src = getImageSource(asana.image_number);
                                return src ? (
                                  <Image
                                    source={src}
                                    style={styles.selectedAsanaImage}
                                    contentFit="contain"
                                    placeholder="🖼️"
                                    placeholderContentFit="contain"
                                  />
                                ) : (
                                  <View
                                    style={styles.selectedAsanaImagePlaceholder}
                                  >
                                    <Text
                                      style={
                                        styles.selectedAsanaImagePlaceholderText
                                      }
                                    >
                                      📝
                                    </Text>
                                  </View>
                                );
                              })()}
                            </View>
                            <View style={styles.selectedAsanaInfo}>
                              <Text style={styles.selectedAsanaNumber}>
                                {index + 1}
                              </Text>
                              <Text
                                style={styles.selectedAsanaName}
                                numberOfLines={1}
                              >
                                {asana.sanskrit_name_kr}
                              </Text>
                              <Text
                                style={styles.selectedAsanaNameEn}
                                numberOfLines={1}
                              >
                                {asana.sanskrit_name_en}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.removeButton}
                              onPress={() => {
                                setEditData((prev) => ({
                                  ...prev,
                                  asanas: prev.asanas.filter(
                                    (id) => id !== asanaId
                                  ),
                                }));
                              }}
                            >
                              <Text style={styles.removeButtonText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </>
            ) : (
              // 일반 모드: 아사나 카드 그리드
              record.asanas.length > 0 && (
                <View style={styles.asanasGrid}>
                  {record.asanas.map((asanaId) => {
                    const asana = getAsanaInfo(asanaId);
                    if (!asana) return null;

                    return (
                      <View key={asanaId} style={styles.asanaCard}>
                        <View style={styles.asanaImageContainer}>
                          {(() => {
                            const src = getImageSource(asana.image_number);
                            return src ? (
                              <Image
                                source={src}
                                style={styles.asanaImage}
                                contentFit="contain"
                                placeholder="🖼️"
                                placeholderContentFit="contain"
                              />
                            ) : (
                              <View style={styles.asanaImagePlaceholder}>
                                <Text style={styles.asanaImagePlaceholderText}>
                                  📝
                                </Text>
                              </View>
                            );
                          })()}
                        </View>
                        <View style={styles.asanaInfo}>
                          <Text style={styles.asanaName}>
                            {asana.sanskrit_name_kr}
                          </Text>
                          <Text style={styles.asanaNameEn}>
                            {asana.sanskrit_name_en}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )
            )}
          </View>

          {/* 상태 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>수련 상태</Text>

            {isEditMode ? (
              // 수정 모드: 기록 추가 화면과 동일한 UI
              <>
                <Text style={styles.sectionSubtitle}>
                  수련 중 느낀 상태를 선택해주세요 (최대 3개)
                </Text>
                <View style={styles.statesContainer}>
                  {STATES.map((state) => (
                    <TouchableOpacity
                      key={state.id}
                      style={[
                        styles.stateChip,
                        {
                          backgroundColor: COLORS.surface,
                          borderColor: editData.states.includes(state.id)
                            ? state.color
                            : "#666666",
                          borderWidth: editData.states.includes(state.id)
                            ? 2
                            : 1,
                        },
                      ]}
                      onPress={() => {
                        setEditData((prev) => ({
                          ...prev,
                          states: prev.states.includes(state.id)
                            ? prev.states.filter((id) => id !== state.id)
                            : [...prev.states, state.id],
                        }));
                      }}
                    >
                      <Text
                        style={[
                          styles.stateLabel,
                          {
                            color: editData.states.includes(state.id)
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
              </>
            ) : (
              // 일반 모드: 상태 칩 표시
              record.states.length > 0 && (
                <View style={styles.statesContainer}>
                  {record.states.map((stateId) => {
                    const state = getStateInfo(stateId);
                    if (!state) return null;

                    return (
                      <View
                        key={stateId}
                        style={[
                          styles.stateChip,
                          {
                            borderColor: state.color,
                            backgroundColor: `${state.color}15`,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.stateText, { color: state.color }]}
                        >
                          {state.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )
            )}
          </View>

          {/* 메모 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>수련 메모</Text>

            {isEditMode ? (
              // 수정 모드: 메모 입력 필드
              <>
                <TextInput
                  value={editData.memo}
                  onChangeText={(text: string) =>
                    setEditData((prev) => ({ ...prev, memo: text }))
                  }
                  placeholder="오늘의 수련에 대한 메모를 작성해주세요"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  style={styles.memoInput}
                />
                <Text style={styles.charCount}>{editData.memo.length}/500</Text>
              </>
            ) : (
              // 일반 모드: 메모 텍스트 표시
              <View style={styles.memoContainer}>
                <Text style={styles.memoText}>
                  {record.memo.trim() || "메모가 없습니다."}
                </Text>
              </View>
            )}
          </View>

          {/* 하단 여백 (스크롤용) */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* 생성 시간 표시 */}
        {!isEditMode && (
          <View style={styles.createdAtContainer}>
            <Text style={styles.createdAtText}>
              {formatRelativeTime(record.created_at)}
            </Text>
          </View>
        )}

        {/* 하단 액션 버튼 - 키보드 높이만큼 위로 올림 */}
        <View
          style={[
            styles.bottomActions,
            keyboardHeight > 0 && { marginBottom: keyboardHeight },
          ]}
        >
          {isEditMode ? (
            <>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>저장</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {onEdit && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEdit}
                >
                  <Text style={styles.editButtonText}>수정</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteButtonText}>삭제</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      {/* 아사나 검색 모달 */}
      <AsanaSearchModal
        visible={asanaSearchVisible}
        onClose={() => setAsanaSearchVisible(false)}
        onSelect={handleAsanaSelect}
        selectedAsanas={
          editData.asanas
            .map((id) => asanas.find((asana) => asana.id === id))
            .filter(Boolean) as Asana[]
        }
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },
  headerLeft: {
    width: 32,
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
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
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
  editButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSecondary,
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
  searchButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceDark,
    borderStyle: "dashed",
  },
  searchButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
  selectedItemsContainer: {
    marginTop: 12,
  },
  selectedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
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
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },
  memoInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: "top",
    color: COLORS.text,
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "right",
    marginTop: 8,
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
  selectedAsanaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
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
    marginBottom: 8,
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
  stateLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingBottom: 160,
  },
  dateSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    textAlign: "center",
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  createdAtContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceDark,
  },
  createdAtText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
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
  titleText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 24,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "right",
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginBottom: 16,
  },
  sectionSubtitleEdit: {
    marginTop: -4,
  },
  asanasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  asanaCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  asanaImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
    padding: 6,
  },
  asanaImage: {
    width: "100%",
    height: "100%",
  },
  asanaImagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  asanaImagePlaceholderText: {
    fontSize: 28,
  },
  asanaInfo: {
    alignItems: "center",
    width: "100%",
  },
  asanaName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 6,
  },
  asanaNameEn: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "500",
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
  stateText: {
    fontSize: 15,
    fontWeight: "600",
  },
  memoContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  memoText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 26,
    fontWeight: "500",
  },
  bottomSpacing: {
    height: 120,
  },
});
