import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Card, YStack } from "tamagui";
import CommentModal from "../../components/feed/CommentModal";
import { COLORS } from "../../constants/Colors";
import { CATEGORIES } from "../../constants/categories";
import { STATES } from "../../constants/states";
import { useNotification } from "../../contexts/NotificationContext";
import {
  useDeleteRecord,
  useRecordStats,
  useToggleLike,
} from "../../hooks/useRecords";
import { formatDate } from "../../lib/utils/dateFormatter";
import { RootStackParamList } from "../../navigation/types";
import { AsanaCategory } from "../../types/asana";

type RecordDetailRouteProp = RouteProp<RootStackParamList, "RecordDetail">;

export default function RecordDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RecordDetailRouteProp>();
  const { record } = route.params;

  const deleteRecordMutation = useDeleteRecord();
  const { showSnackbar } = useNotification();
  const [showCommentModal, setShowCommentModal] = useState(false);
  const { data: stats } = useRecordStats(record.id);
  const toggleLikeMutation = useToggleLike();
  const [isLiking, setIsLiking] = useState(false);

  // 메뉴 표시
  const showMenu = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["취소", "수정", "삭제"],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: "수련 기록",
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleEdit();
          } else if (buttonIndex === 2) {
            handleDeleteRecord();
          }
        }
      );
    } else {
      Alert.alert("수련 기록", "작업을 선택하세요", [
        { text: "취소", style: "cancel" },
        { text: "수정", onPress: handleEdit },
        { text: "삭제", style: "destructive", onPress: handleDeleteRecord },
      ]);
    }
  };

  // 수정 처리
  const handleEdit = () => {
    navigation.navigate("EditRecord", { record });
  };

  // 아사나 이미지 URL 생성
  const getAsanaImageUrl = (imageNumber: string) => {
    if (!imageNumber) return null;
    const baseNumber = imageNumber.padStart(3, "0");
    return `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/thumbnail/${baseNumber}.png`;
  };

  // 카테고리 정보 가져오기
  const getCategoryInfo = (categoryName: string) => {
    const category = CATEGORIES[categoryName as AsanaCategory];
    if (category) {
      return {
        label: category.label,
        color: category.color,
      };
    }
    return {
      label: "기타",
      color: COLORS.textSecondary,
    };
  };

  // 상태 정보 가져오기
  const getStateInfo = (stateId: string) => {
    return STATES.find((state) => state.id === stateId);
  };

  // 기록 삭제
  const handleDeleteRecord = () => {
    Alert.alert("기록 삭제", "이 수련 기록을 삭제하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRecordMutation.mutateAsync(record.id);
            showSnackbar("수련 기록이 삭제되었습니다.", "success");
            navigation.goBack();
          } catch (error) {
            console.error("기록 삭제 실패:", error);
            showSnackbar("기록 삭제에 실패했습니다.", "error");
          }
        },
      },
    ]);
  };

  // 좋아요 토글
  const handleLike = () => {
    if (isLiking || toggleLikeMutation.isPending) {
      return;
    }
    setIsLiking(true);
    toggleLikeMutation.mutate(record.id, {
      onSettled: () => {
        setIsLiking(false);
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>수련 기록</Text>
        <TouchableOpacity onPress={showMenu} style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 메인 카드 */}
        <View style={styles.mainCard}>
          {/* 제목과 날짜 */}
          <View style={styles.headerCard}>
            <View style={styles.dateContainer}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.dateText}>
                {formatDate(
                  record.practice_date || record.date || record.created_at
                )}
              </Text>
            </View>
          </View>

          {/* 아사나 그리드 */}
          {record.asanas && record.asanas.length > 0 && (
            <View style={styles.asanasSection}>
              <View style={styles.asanasHeader}>
                <Text style={styles.asanasTitle}>수련한 아사나</Text>
              </View>
              <View style={styles.asanasGrid}>
                {record.asanas.map((asana: any, index: number) => {
                  const imageUrl = getAsanaImageUrl(asana.image_number);
                  const categoryInfo = getCategoryInfo(
                    asana.category_name_en || ""
                  );
                  return (
                    <Card
                      key={index}
                      backgroundColor="#4A4A4A"
                      borderRadius="$4"
                      overflow="hidden"
                      shadowColor="$shadow"
                      shadowOffset={{ width: 0, height: 2 }}
                      shadowOpacity={0.1}
                      shadowRadius={4}
                      elevation={3}
                      width="48%"
                      pressStyle={{ opacity: 0.8 }}
                    >
                      {/* 이미지 영역 */}
                      <YStack
                        height={160}
                        backgroundColor="#9A9A9A"
                        position="relative"
                      >
                        {imageUrl ? (
                          <YStack
                            flex={1}
                            justifyContent="center"
                            alignItems="center"
                            backgroundColor="#FFFFFF"
                          >
                            <Image
                              source={{ uri: imageUrl }}
                              style={{
                                width: "80%",
                                height: "80%",
                                maxWidth: 120,
                                maxHeight: 100,
                              }}
                              contentFit="contain"
                              placeholder="이미지 로딩 중..."
                              placeholderContentFit="contain"
                              onError={() => {
                                console.log(
                                  "아사나 이미지 로딩 실패:",
                                  imageUrl
                                );
                              }}
                            />
                          </YStack>
                        ) : (
                          <YStack
                            flex={1}
                            justifyContent="center"
                            alignItems="center"
                            backgroundColor="#9A9A9A"
                          >
                            <Text
                              style={{
                                fontSize: 28,
                                fontWeight: "bold",
                                color: COLORS.textSecondary,
                              }}
                            >
                              이미지 없음
                            </Text>
                          </YStack>
                        )}

                        {/* 카테고리 배지를 이미지 영역 좌측 상단에 배치 */}
                        <View
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 5,
                          }}
                        >
                          <Button
                            backgroundColor={categoryInfo.color}
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            borderRadius={0}
                            borderTopLeftRadius={0}
                            borderTopRightRadius={0}
                            borderBottomLeftRadius={0}
                            borderBottomRightRadius={8}
                            disabled
                            height="auto"
                            minHeight={24}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "bold",
                                color: "white",
                              }}
                            >
                              {categoryInfo.label}
                            </Text>
                          </Button>
                        </View>
                      </YStack>

                      {/* 내용 영역 */}
                      <YStack padding="$3" paddingTop="$1">
                        {/* 한국어 이름 */}
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "bold",
                            color: "#FFFFFF",
                            marginBottom: 4,
                          }}
                          numberOfLines={1}
                        >
                          {asana.sanskrit_name_kr}
                        </Text>

                        {/* 영어 이름 */}
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#E0E0E0",
                            fontStyle: "italic",
                          }}
                          numberOfLines={1}
                        >
                          {asana.sanskrit_name_en}
                        </Text>
                      </YStack>
                    </Card>
                  );
                })}
              </View>
            </View>
          )}

          {/* 감정 상태 섹션 */}
          {record.states && record.states.length > 0 && (
            <View style={styles.statesSection}>
              <View style={styles.statesHeader}>
                <Text style={styles.statesTitle}>수련 상태</Text>
              </View>
              <View style={styles.statesContainer}>
                {record.states.map((stateId: string) => {
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
                      <Text style={[styles.stateText, { color: state.color }]}>
                        {state.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 메모 섹션 */}
          {record.memo && (
            <View style={styles.memoCard}>
              <View style={styles.memoHeader}>
                <Text style={styles.memoTitle}>메모</Text>
              </View>
              <Text style={styles.memoContent}>{record.memo}</Text>
            </View>
          )}

          {/* 소셜 액션 - 메모 바로 아래 (좋아요 / 댓글) */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                (toggleLikeMutation.isPending || isLiking) &&
                  styles.actionButtonDisabled,
              ]}
              onPress={handleLike}
              disabled={toggleLikeMutation.isPending || isLiking}
              activeOpacity={0.7}
            >
              <Ionicons
                name={stats?.isLiked ? "heart" : "heart-outline"}
                size={16}
                color={stats?.isLiked ? COLORS.primary : COLORS.textSecondary}
              />
              {stats?.likeCount && stats.likeCount > 0 ? (
                <Text style={styles.actionCount}>
                  {String(stats.likeCount)}
                </Text>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowCommentModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              {stats?.commentCount && stats.commentCount > 0 ? (
                <Text style={styles.actionCount}>
                  {String(stats.commentCount)}
                </Text>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 댓글 모달 */}
      <CommentModal
        visible={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        recordId={record.id}
        recordTitle={record.title}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  menuButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  mainCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerCard: {
    marginBottom: 24,
  },
  recordTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 32,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  asanasSection: {
    marginBottom: 24,
  },
  asanasHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  asanasTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  asanaCount: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  asanaCountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  asanasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  statesSection: {
    marginBottom: 12,
  },
  statesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  statesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  statesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  stateText: {
    fontSize: 14,
    fontWeight: "500",
  },
  memoCard: {
    marginTop: 12,
  },
  memoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  memoTitle: {
    // 수련한 아사나 / 수련 상태 섹션 타이틀과 동일한 스타일
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  memoContent: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 40,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 12,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionCount: {
    marginLeft: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
