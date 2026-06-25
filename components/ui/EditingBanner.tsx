import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";

// 메시지 인라인 수정 중 안내 — 입력창 위에 표시.
// 카카오톡식: 좌측 액센트 바 + "메시지 수정" 라벨 + 원문 미리보기 + 우측 상단 닫기.
export function EditingBanner({
  body,
  onCancel,
}: {
  body: string;
  onCancel: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.accent} />
      <View style={styles.content}>
        <Text style={styles.label}>메시지 수정</Text>
        <Text style={styles.body} numberOfLines={1}>
          {body}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onCancel}
        style={styles.closeBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 8 }}
      >
        <Ionicons name="close" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "stretch",
    marginHorizontal: SPACING.lg,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "rgba(139, 92, 246, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.28)",
    overflow: "hidden",
  },
  accent: { width: 4, backgroundColor: COLORS.primary },
  content: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 3,
  },
  label: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  body: { color: COLORS.text, fontSize: 13 },
  closeBtn: {
    alignSelf: "flex-start",
    paddingTop: 9,
    paddingRight: 12,
    paddingLeft: 8,
  },
});
