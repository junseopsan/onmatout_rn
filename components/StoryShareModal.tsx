import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useRef, useState } from "react";
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
import StoryShareCard, {
  StorySequenceData,
  StoryStatsData,
} from "./StoryShareCard";

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
    }
  | {
      visible: boolean;
      onClose: () => void;
      mode: "sequence";
      sequence: StorySequenceData;
      /** 시퀀스 상세로 여는 딥링크. 있으면 이미지와 함께 링크 공유 + 복사 UI 노출 */
      shareUrl?: string;
    };

export default function StoryShareModal(props: StoryShareModalProps) {
  const insets = useSafeAreaInsets();
  const cardRef = useRef<View>(null);
  const { shareAsync, isSharing } = useShareStory(cardRef);
  const [copied, setCopied] = useState(false);

  const shareUrl = props.mode === "sequence" ? props.shareUrl : undefined;
  // iOS 네이티브 시트는 이미지+텍스트 동봉 시 링크를 누락하므로,
  // 링크는 아래 복사 영역으로 따로 노출한다(스토리 링크 스티커용).
  const linkMessage =
    props.mode === "sequence" && shareUrl
      ? `"${props.sequence.title}" 시퀀스를 확인해보세요!\n${shareUrl}`
      : undefined;

  const handleShare = async () => {
    const result = await shareAsync(linkMessage);
    if (result.success) {
      props.onClose();
    } else {
      Alert.alert("공유 실패", result.error ?? "다시 시도해 주세요.");
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const content =
    props.mode === "stats" ? (
      <StoryShareCard mode="stats" stats={props.stats} />
    ) : props.mode === "sequence" ? (
      <StoryShareCard mode="sequence" sequence={props.sequence} />
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
            {shareUrl
              ? "이미지를 저장해 스토리에 올리고, 아래 링크를 붙여 시퀀스로 바로 연결하세요."
              : "공유 시 이미지가 저장되며, 인스타 스토리에 올릴 수 있어요."}
          </Text>

          {shareUrl ? (
            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={1} selectable>
                {shareUrl}
              </Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={handleCopyLink}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={15}
                  color={copied ? COLORS.success : COLORS.primary}
                />
                <Text style={[styles.copyBtnText, copied && styles.copyBtnTextOn]}>
                  {copied ? "복사됨" : "링크 복사"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

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
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    maxWidth: 340,
    backgroundColor: "rgba(139, 92, 246, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.28)",
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    marginBottom: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  copyBtnTextOn: {
    color: COLORS.success,
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
