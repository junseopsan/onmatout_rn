import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { STATES } from "../../constants/states";
import { Asana } from "../../lib/api/asanas";
import { Record } from "../../types/record";

interface FeedDetailModalProps {
  visible: boolean;
  record: (Record & { user_name: string; user_avatar_url?: string }) | null;
  asanas: Asana[];
  onClose: () => void;
}

const { width } = Dimensions.get("window");

export default function FeedDetailModal({
  visible,
  record,
  asanas,
  onClose,
}: FeedDetailModalProps) {
  if (!record) return null;

  // 아사나 정보 가져오기
  const getAsanaInfo = (asanaId: string) => {
    return asanas.find((asana) => asana.id === asanaId);
  };

  // 이미지 URL 생성
  const getImageUrl = (imageNumber: string) => {
    if (!imageNumber) return null;
    const formattedNumber = imageNumber.padStart(3, "0");
    return `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/thumbnail/${formattedNumber}.png`;
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "오늘";
    } else if (diffDays === 1) {
      return "어제";
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  // 시간 포맷팅
  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // 상태 정보 가져오기
  const getStateInfo = (stateId: string) => {
    return STATES.find((state) => state.id === stateId);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 헤더 - 사용자 정보와 닫기 버튼 */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {record.user_avatar_url ? (
              <Image
                source={{ uri: record.user_avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {record.user_name.charAt(0)}
                </Text>
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{record.user_name}</Text>
              <Text style={styles.timeText}>
                {formatDate(record.practice_date || record.date)}
                {record.practice_time &&
                  ` · ${formatTime(record.practice_time)}`}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >

          {/* 아사나 그리드 - 여러 개를 한번에 보여줌 */}
          {record.asanas && record.asanas.length > 0 && (
            <View style={styles.asanasSection}>
              <Text style={styles.sectionTitle}>
                수련한 아사나 ({record.asanas.length}개)
              </Text>
              <View style={styles.asanasGrid}>
                {record.asanas.map((asanaId) => {
                  const asana = getAsanaInfo(asanaId);
                  if (!asana) return null;

                  const imageUrl = asana.image_number
                    ? getImageUrl(asana.image_number)
                    : null;

                  return (
                    <View key={asanaId} style={styles.asanaCard}>
                      <View style={styles.asanaImageContainer}>
                        {imageUrl ? (
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.asanaImage}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                            transition={0}
                          />
                        ) : (
                          <View style={styles.asanaImagePlaceholder}>
                            <Text style={styles.asanaImagePlaceholderText}>
                              📝
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.asanaInfo}>
                        <Text style={styles.asanaName} numberOfLines={2}>
                          {asana.sanskrit_name_kr}
                        </Text>
                        <Text
                          style={styles.asanaNameEn}
                          numberOfLines={1}
                        >
                          {asana.sanskrit_name_en}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 상태 */}
          {record.states && record.states.length > 0 && (
            <View style={styles.statesSection}>
              <Text style={styles.sectionTitle}>수련 후 상태</Text>
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
                      <Text style={[styles.stateText, { color: state.color }]}>
                        {state.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 메모 */}
          {record.memo && (
            <View style={styles.memoSection}>
              <Text style={styles.sectionTitle}>수련 메모</Text>
              <View style={styles.memoContainer}>
                <Text style={styles.memoText}>{record.memo}</Text>
              </View>
            </View>
          )}

          {/* 하단 여백 */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
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
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
    minWidth: 0, // 텍스트 오버플로우 방지
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  userDetails: {
    flex: 1,
    minWidth: 0, // 텍스트 오버플로우 방지
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  titleSection: {
    marginBottom: 24,
  },
  titleText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 30,
  },
  asanasSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },
  asanasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  asanaCard: {
    width: (width - 52) / 2, // 화면 너비 - 패딩(40) - gap(12) / 2
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  asanaImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
    padding: 8,
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
    fontSize: 32,
  },
  asanaInfo: {
    alignItems: "center",
    width: "100%",
  },
  asanaName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 4,
  },
  asanaNameEn: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "500",
  },
  statesSection: {
    marginBottom: 32,
  },
  statesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stateChip: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
  },
  stateText: {
    fontSize: 15,
    fontWeight: "600",
  },
  memoSection: {
    marginBottom: 32,
  },
  memoContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  memoText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 26,
    fontWeight: "500",
  },
  bottomSpacing: {
    height: 40,
  },
});

