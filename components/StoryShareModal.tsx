import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/Colors";
import { useShareStory } from "../hooks/useShareStory";
import { Record } from "../types/record";
import StoryShareCard, { StoryStatsData } from "./StoryShareCard";

type StoryShareModalProps =
  | {
      visible: boolean;
      onClose: () => void;
      mode: "stats";
      stats: StoryStatsData;
    }
  | {
      visible: boolean;
      onClose: () => void;
      mode: "record";
      record: Record;
      userName?: string;
    };

export default function StoryShareModal(props: StoryShareModalProps) {
  const insets = useSafeAreaInsets();
  const cardRef = useRef<View>(null);
  const { shareAsync, isSharing } = useShareStory(cardRef);

  const handleShare = async () => {
    const result = await shareAsync();
    if (result.success) {
      props.onClose();
    } else {
      Alert.alert("공유 실패", result.error ?? "다시 시도해 주세요.");
    }
  };

  const content =
    props.mode === "stats" ? (
      <StoryShareCard mode="stats" stats={props.stats} />
    ) : (
      <StoryShareCard
        mode="record"
        record={props.record}
        userName={props.userName}
      />
    );

  return (
    <Modal
      visible={props.visible}
      animationType="slide"
      transparent
      onRequestClose={props.onClose}
    >
      <View
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(insets.top, 24) + 8,
            paddingBottom: insets.bottom + 24,
            justifyContent: "flex-start",
          },
        ]}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>스토리 공유</Text>
            <TouchableOpacity onPress={props.onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.previewWrap}>
            <View ref={cardRef} collapsable={false} style={styles.cardWrapper}>
              {content}
            </View>
          </View>

          <Text style={styles.hint}>
            공유 시 이미지가 저장되며, 인스타 스토리 등에 올릴 수 있어요.
          </Text>

          <TouchableOpacity
            style={[
              styles.shareButton,
              isSharing && styles.shareButtonDisabled,
            ]}
            onPress={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="share-social" size={22} color="#fff" />
                <Text style={styles.shareButtonText}>공유하기</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 0,
    minHeight: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  closeBtn: {
    padding: 12,
    margin: -4,
  },
  previewWrap: {
    marginTop: -68,
    marginBottom: -30,
    alignItems: "center",
    transform: [{ scale: 0.72 }],
    transformOrigin: "center center",
  },
  cardWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    minWidth: 160,
  },
  shareButtonDisabled: {
    opacity: 0.7,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
