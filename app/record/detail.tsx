import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import React from "react";
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
import { COLORS } from "../../constants/Colors";
import { useNotification } from "../../contexts/NotificationContext";
import { useDeleteRecord } from "../../hooks/useRecords";
import { RootStackParamList } from "../../navigation/types";

type RecordDetailRouteProp = RouteProp<RootStackParamList, "RecordDetail">;

export default function RecordDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RecordDetailRouteProp>();
  const { record } = route.params;

  const deleteRecordMutation = useDeleteRecord();
  const { showSnackbar } = useNotification();

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

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  // 아사나 이미지 URL 생성
  const getAsanaImageUrl = (imageNumber: string) => {
    if (!imageNumber) return null;
    const baseNumber = imageNumber.padStart(3, "0");
    return `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/${baseNumber}_001.png`;
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
                {formatDate(record.created_at)}
              </Text>
              <Ionicons name="time-outline" size={16} color={COLORS.primary} />
              <Text style={styles.timeText}>
                {formatTime(record.created_at)}
              </Text>
            </View>
          </View>

          {/* 아사나 그리드 */}
          {record.asanas && record.asanas.length > 0 && (
            <View style={styles.asanasSection}>
              <View style={styles.asanasHeader}>
                <Ionicons
                  name="fitness-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.asanasTitle}>수련한 아사나</Text>
                <View style={styles.asanaCount}>
                  <Text style={styles.asanaCountText}>
                    {record.asanas.length}
                  </Text>
                </View>
              </View>
              <View style={styles.asanasGrid}>
                {record.asanas.map((asana: any, index: number) => {
                  const imageUrl = getAsanaImageUrl(asana.image_number);
                  return (
                    <View key={index} style={styles.asanaCard}>
                      {imageUrl ? (
                        <View style={styles.asanaImageContainer}>
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.asanaImage}
                            contentFit="contain"
                            placeholder="🧘‍♀️"
                            placeholderContentFit="contain"
                            onError={() => {
                              console.log("아사나 이미지 로딩 실패:", imageUrl);
                            }}
                            cachePolicy="memory-disk"
                            priority="normal"
                          />
                        </View>
                      ) : (
                        <View style={styles.asanaImagePlaceholder}>
                          <Ionicons
                            name="fitness"
                            size={24}
                            color={COLORS.textSecondary}
                          />
                        </View>
                      )}
                      <Text style={styles.asanaCardName} numberOfLines={2}>
                        {asana.sanskrit_name_kr}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 메모 카드 */}
          {record.memo && (
            <View style={styles.memoCard}>
              <View style={styles.memoHeader}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.memoTitle}>메모</Text>
              </View>
              <Text style={styles.memoContent}>{record.memo}</Text>
            </View>
          )}
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacer} />
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
    justifyContent: "flex-start",
    gap: 12,
  },
  asanaCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: 120,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  asanaImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "white",
    marginTop: 12,
    marginBottom: 8,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  asanaImage: {
    width: "100%",
    height: "100%",
  },
  asanaImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
    position: "relative",
  },
  asanaCardName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 8,
    width: "100%",
  },
  memoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  memoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  memoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  memoContent: {
    fontSize: 15,
    color: "#000000",
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 40,
  },
});
