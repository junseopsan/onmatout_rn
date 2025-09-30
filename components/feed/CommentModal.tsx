import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { useAddComment, useComments } from "../../hooks/useRecords";

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  recordId: string;
  recordTitle?: string;
}

const { height } = Dimensions.get("window");

export default function CommentModal({
  visible,
  onClose,
  recordId,
  recordTitle,
}: CommentModalProps) {
  const [commentText, setCommentText] = useState("");
  const [inputHeight, setInputHeight] = useState(32);
  const { data: comments, isLoading } = useComments(recordId);
  const addCommentMutation = useAddComment();

  const handleAddComment = () => {
    if (commentText.trim()) {
      addCommentMutation.mutate(
        { recordId, content: commentText.trim() },
        {
          onSuccess: () => {
            setCommentText("");
            setInputHeight(32); // 입력 후 높이 초기화
          },
        }
      );
    }
  };

  const handleTextChange = (text: string) => {
    setCommentText(text);
  };

  const handleContentSizeChange = (event: any) => {
    const contentHeight = event.nativeEvent.contentSize.height;
    console.log("Content height:", contentHeight); // 디버깅용

    // 최소 높이 32px, 최대 높이 64px로 제한 (약 3줄)
    const newHeight = Math.min(Math.max(32, contentHeight), 64);
    console.log("Setting height to:", newHeight); // 디버깅용

    setInputHeight(newHeight);
  };

  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    const now = new Date();
    const diffTime = now.getTime() - time.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return "방금 전";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return time.toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>댓글</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 댓글 목록 */}
        <ScrollView
          style={styles.commentsList}
          showsVerticalScrollIndicator={false}
        >
          {comments && comments.length > 0 ? (
            comments.map((comment: any) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentUser}>
                    {comment.user_profiles?.avatar_url ? (
                      <Image
                        source={{ uri: comment.user_profiles.avatar_url }}
                        style={styles.commentAvatar}
                      />
                    ) : (
                      <View style={styles.commentAvatarPlaceholder}>
                        <Text style={styles.commentAvatarText}>
                          {comment.user_profiles?.name?.charAt(0) || "?"}
                        </Text>
                      </View>
                    )}
                    <View style={styles.commentUserInfo}>
                      <Text style={styles.commentAuthor}>
                        {comment.user_profiles?.name || "익명"}
                      </Text>
                      <Text style={styles.commentTime}>
                        {formatTime(comment.created_at)}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyComments}>
              <Ionicons
                name="chatbubble-outline"
                size={48}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyCommentsText}>
                아직 댓글이 없어요.{"\n"}첫 번째 댓글을 작성해보세요!
              </Text>
            </View>
          )}
        </ScrollView>

        {/* 댓글 입력 */}
        <View style={styles.commentInput}>
          <View
            style={[styles.inputContainer, { minHeight: inputHeight + 20 }]}
          >
            <TextInput
              style={styles.commentTextInput}
              placeholder="댓글을 입력하세요..."
              value={commentText}
              onChangeText={handleTextChange}
              onContentSizeChange={handleContentSizeChange}
              multiline
              scrollEnabled={inputHeight >= 64}
              maxLength={200}
              placeholderTextColor={COLORS.textSecondary}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[
                styles.commentSubmitButton,
                (!commentText.trim() || addCommentMutation.isPending) &&
                  styles.commentSubmitButtonDisabled,
              ]}
              onPress={handleAddComment}
              disabled={!commentText.trim() || addCommentMutation.isPending}
            >
              <Text
                style={[
                  styles.commentSubmitText,
                  (!commentText.trim() || addCommentMutation.isPending) &&
                    styles.commentSubmitTextDisabled,
                ]}
              >
                {addCommentMutation.isPending ? "등록중..." : "등록"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  placeholder: {
    width: 32,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  commentHeader: {
    marginBottom: 8,
  },
  commentUser: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  commentAvatarText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  commentUserInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  commentContent: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginLeft: 40,
  },
  emptyComments: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyCommentsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
  commentInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "space-between",
  },
  commentTextInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: "transparent",
    marginRight: 8,
    minHeight: 32,
    maxHeight: 64,
    paddingVertical: 8,
  },
  commentSubmitButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  commentSubmitText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  commentSubmitTextDisabled: {
    color: COLORS.background,
  },
});
