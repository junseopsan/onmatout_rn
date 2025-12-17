import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
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
import { formatDate } from "../../lib/utils/dateFormatter";
import { Record } from "../../types/record";
import AsanaDisplayCard from "../AsanaDisplayCard";

interface FeedDetailModalProps {
  visible: boolean;
  record: (Record & { user_name: string; user_avatar_url?: string }) | null;
  asanas: Asana[];
  onClose: () => void;
}

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
          {/* 날짜와 시간 표시 */}
          <View style={styles.dateTimeContainer}>
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

          {/* 아사나 그리드 - 여러 개를 한번에 보여줌 */}
          {record.asanas && record.asanas.length > 0 && (
            <View style={styles.asanasSection}>
              <Text style={styles.sectionTitle}>수련한 아사나</Text>
              <View style={styles.asanasGrid}>
                {record.asanas.map((asanaId) => {
                  const asana = getAsanaInfo(asanaId);
                  if (!asana) return null;

                  return <AsanaDisplayCard key={asanaId} asana={asana} />;
                })}
              </View>
            </View>
          )}

          {/* 상태 */}
          {record.states && record.states.length > 0 && (
            <View style={styles.statesSection}>
              <Text style={styles.sectionTitle}>수련 상태</Text>
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
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
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
    justifyContent: "space-between",
    gap: 12,
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
