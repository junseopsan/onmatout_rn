import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { useDeleteRecord } from "../../hooks/useRecords";
import { RootStackParamList } from "../../navigation/types";

type RecordDetailRouteProp = {
  params: {
    record: any;
  };
};

export default function RecordDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RecordDetailRouteProp>();
  const { record } = route.params;

  const deleteRecordMutation = useDeleteRecord();

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
            navigation.goBack();
          } catch (error) {
            console.error("기록 삭제 실패:", error);
            Alert.alert("오류", "기록 삭제에 실패했습니다.");
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
        <TouchableOpacity
          onPress={handleDeleteRecord}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 제목 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제목</Text>
          <Text style={styles.sectionContent}>{record.title}</Text>
        </View>

        {/* 날짜 및 시간 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수련 일시</Text>
          <Text style={styles.sectionContent}>
            {formatDate(record.created_at)} {formatTime(record.created_at)}
          </Text>
        </View>

        {/* 아사나 목록 */}
        {record.asanas && record.asanas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>수련한 아사나</Text>
            {record.asanas.map((asana: any, index: number) => (
              <View key={index} style={styles.asanaItem}>
                <Text style={styles.asanaName}>{asana.sanskrit_name_kr}</Text>
                <Text style={styles.asanaNameEn}>{asana.sanskrit_name_en}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 메모 */}
        {record.memo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>메모</Text>
            <Text style={styles.sectionContent}>{record.memo}</Text>
          </View>
        )}

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
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  asanaItem: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  asanaName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  asanaNameEn: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  bottomSpacer: {
    height: 40,
  },
});
