import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import {
  useAddShare,
  useRecordStats,
  useToggleLike,
} from "../../hooks/useRecords";
import { Asana } from "../../lib/api/asanas";
import { Record } from "../../types/record";
import CommentModal from "./CommentModal";

interface FeedItemProps {
  record: Record & { user_name: string; user_avatar_url?: string };
  asanas: Asana[];
  onPress?: (record: Record) => void;
}

const { width } = Dimensions.get("window");

export default function FeedItem({ record, asanas, onPress }: FeedItemProps) {
  const [showCommentModal, setShowCommentModal] = useState(false);

  // 소셜 기능 훅들
  const { data: stats } = useRecordStats(record.id);
  const toggleLikeMutation = useToggleLike();
  const addShareMutation = useAddShare();

  // 아사나 정보 가져오기
  const getAsanaInfo = (asanaId: string) => {
    return asanas.find((asana) => asana.id === asanaId);
  };

  // 이미지 URL 생성
  const getImageUrl = (imageNumber: string) => {
    const formattedNumber = imageNumber.padStart(3, "0");
    return `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/thumbnail/${formattedNumber}.png`;
  };
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
        month: "short",
        day: "numeric",
      });
    }
  };

  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getStateEmoji = (state: string) => {
    const stateEmojis: { [key: string]: string } = {
      calm: "😌",
      energized: "⚡",
      tired: "😴",
      focused: "🧘",
      tense: "😰",
    };
    return stateEmojis[state] || "😌";
  };

  const getStateText = (state: string) => {
    const stateTexts: { [key: string]: string } = {
      calm: "평온한",
      energized: "에너지 넘치는",
      tired: "피곤한",
      focused: "집중된",
      tense: "긴장된",
    };
    return stateTexts[state] || "평온한";
  };

  // 소셜 기능 핸들러들
  const handleLike = () => {
    toggleLikeMutation.mutate(record.id);
  };

  const handleComment = () => {
    setShowCommentModal(true);
  };

  const handleShare = () => {
    addShareMutation.mutate(record.id, {
      onSuccess: () => {
        Alert.alert("공유 완료", "수련 기록이 공유되었습니다!");
      },
    });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(record)}
      activeOpacity={0.8}
    >
      {/* 사용자 정보 헤더 */}
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
              {record.practice_time && ` ${formatTime(record.practice_time)}`}
            </Text>
          </View>
        </View>
      </View>

      {/* 아사나 정보 */}
      {record.asanas && record.asanas.length > 0 && (
        <View style={styles.asanasContainer}>
          <View style={styles.asanasList}>
            {record.asanas.slice(0, 6).map((asanaId, index) => {
              const asana = getAsanaInfo(asanaId);
              if (!asana) return null;

              return (
                <View key={asanaId} style={styles.asanaThumbnail}>
                  {asana.image_number ? (
                    <Image
                      source={{ uri: getImageUrl(asana.image_number) }}
                      style={styles.asanaImage}
                      contentFit="contain"
                      placeholder="🖼️"
                      placeholderContentFit="contain"
                    />
                  ) : (
                    <View style={styles.asanaImagePlaceholder}>
                      <Text style={styles.asanaImagePlaceholderText}>📝</Text>
                    </View>
                  )}
                </View>
              );
            })}
            {record.asanas.length > 6 && (
              <View style={styles.moreAsanasOverlay}>
                <Text style={styles.moreAsanasText}>
                  +{String(record.asanas.length - 6)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 메모 */}
      {record.memo && <Text style={styles.memo}>{record.memo}</Text>}

      {/* 상태 정보 */}
      {record.states && record.states.length > 0 && (
        <View style={styles.statesContainer}>
          {record.states.map((state, index) => (
            <View key={index} style={styles.stateItem}>
              <Text style={styles.stateText}>{getStateText(state)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 액션 버튼들 */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            toggleLikeMutation.isPending && styles.actionButtonDisabled,
          ]}
          onPress={handleLike}
          disabled={toggleLikeMutation.isPending}
        >
          <Ionicons
            name={stats?.isLiked ? "heart" : "heart-outline"}
            size={20}
            color={stats?.isLiked ? COLORS.primary : COLORS.textSecondary}
          />
          {stats?.likeCount && stats.likeCount > 0 ? (
            <Text style={styles.actionCount}>{String(stats.likeCount)}</Text>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          {stats?.commentCount && stats.commentCount > 0 ? (
            <Text style={styles.actionCount}>{String(stats.commentCount)}</Text>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShare}
          disabled={addShareMutation.isPending}
        >
          <Ionicons
            name="share-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          {stats?.shareCount && stats.shareCount > 0 ? (
            <Text style={styles.actionCount}>{String(stats.shareCount)}</Text>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* 댓글 모달 */}
      <CommentModal
        visible={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        recordId={record.id}
        recordTitle={record.title}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  moreButton: {
    padding: 4,
  },
  memo: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  statesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  stateItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  stateEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  stateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  asanasContainer: {
    marginBottom: 12,
  },
  asanasTitle: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
    marginBottom: 8,
  },
  asanasList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  asanaThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  asanaImage: {
    width: "100%",
    height: "100%",
  },
  asanaImagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  asanaImagePlaceholderText: {
    fontSize: 16,
  },
  moreAsanasOverlay: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  moreAsanasText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  photosContainer: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 4,
  },
  photo: {
    width: (width - 64) / 3,
    height: (width - 64) / 3,
    borderRadius: 8,
  },
  singlePhoto: {
    width: width - 64,
    height: (width - 64) * 0.6,
  },
  doublePhoto: {
    width: (width - 68) / 2,
  },
  morePhotosOverlay: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: (width - 64) / 3,
    height: (width - 64) / 3,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  morePhotosText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionCount: {
    marginLeft: 4,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
