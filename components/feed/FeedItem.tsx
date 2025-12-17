import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { STATES } from "../../constants/states";
import { useRecordStats, useToggleLike } from "../../hooks/useRecords";
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
  const [isLiking, setIsLiking] = useState(false);

  // 소셜 기능 훅들
  const { data: stats } = useRecordStats(record.id);
  const toggleLikeMutation = useToggleLike();

  // 아사나 정보 가져오기
  const getAsanaInfo = (asanaId: string) => {
    return asanas.find((asana) => asana.id === asanaId);
  };

  // 이미지 URL 생성 (메모이제이션)
  const getImageUrl = useMemo(() => {
    return (imageNumber: string) => {
      if (!imageNumber) return null;
      const formattedNumber = imageNumber.padStart(3, "0");
      return `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/thumbnail/${formattedNumber}.png`;
    };
  }, []);
  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return "";
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

  // 상태 정보 가져오기
  const getStateInfo = (stateId: string) => {
    return STATES.find((state) => state.id === stateId);
  };

  // 소셜 기능 핸들러들
  const handleLike = () => {
    if (isLiking || toggleLikeMutation.isPending) {
      return;
    }
    console.log("좋아요 버튼 클릭:", record.id);
    setIsLiking(true);
    toggleLikeMutation.mutate(record.id, {
      onSettled: () => {
        setIsLiking(false);
      },
    });
  };

  const handleComment = () => {
    setShowCommentModal(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.content}
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
            </View>
          </View>
        </View>

        {/* 아사나 정보 */}
        {record.asanas && record.asanas.length > 0 && (
          <View style={styles.asanasContainer}>
            <View style={styles.asanasList}>
              {record.asanas.slice(0, 6).map((asanaId, index) => {
                const asana = getAsanaInfo(asanaId);
                if (!asana) {
                  console.log(
                    `피드: 아사나 정보를 찾을 수 없음 - ID: ${asanaId}`
                  );
                  return null;
                }

                const imageUrl = asana.image_number
                  ? getImageUrl(asana.image_number)
                  : null;

                return (
                  <View
                    key={`${asanaId}-${index}`}
                    style={styles.asanaThumbnail}
                  >
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.asanaImage}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                        transition={0}
                        placeholder="🖼️"
                        placeholderContentFit="contain"
                        onError={(error) => {
                          console.log(
                            `피드 아사나 이미지 로딩 실패: ${asana.image_number}`,
                            error
                          );
                        }}
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

        {/* 메모 - 아이콘 위쪽 */}
        {record.memo && <Text style={styles.memo}>{record.memo}</Text>}
      </TouchableOpacity>

      {/* 액션 버튼들 - 메모 아래쪽 (부모 터치 이벤트와 분리) */}
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
            <Text style={styles.actionCount}>{String(stats.likeCount)}</Text>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleComment}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={COLORS.textSecondary}
          />
          {stats?.commentCount && stats.commentCount > 0 ? (
            <Text style={styles.actionCount}>{String(stats.commentCount)}</Text>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* 시간 정보 */}
      <Text style={styles.timeText}>
        {formatRelativeTime(
          record.practice_time ||
            record.created_at ||
            record.practice_date ||
            record.date
        )}
      </Text>

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
  content: {
    flex: 1,
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
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 0,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 4,
  },
  stateEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  stateText: {
    fontSize: 12,
    fontWeight: "500",
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
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
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
