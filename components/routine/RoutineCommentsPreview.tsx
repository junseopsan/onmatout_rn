import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import {
  routineCommentsApi,
  type RoutineComment,
} from "../../lib/api/routineComments";
import { Avatar } from "../ui/Avatar";

interface Props {
  routineId: string;
  // 시트가 닫힐 때마다 값을 바꿔 넘기면 최신 댓글을 다시 불러옵니다.
  refreshKey?: number;
  onOpen: () => void;
  onCountChange?: (count: number) => void;
}

const PREVIEW_MAX = 3;

// 상세 화면 본문에 인스타그램식으로 노출되는 댓글 미리보기.
// 탭하면 전체 댓글 바텀시트가 열립니다.
export function RoutineCommentsPreview({
  routineId,
  refreshKey,
  onOpen,
  onCountChange,
}: Props) {
  const [comments, setComments] = useState<RoutineComment[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    routineCommentsApi
      .list(routineId)
      .then((list) => {
        if (!mounted) return;
        setComments(list);
        setCount(list.length);
        onCountChange?.(list.length);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineId, refreshKey]);

  const preview = comments.slice(-PREVIEW_MAX);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.headerRow}
        onPress={onOpen}
        activeOpacity={0.7}
      >
        <Ionicons name="chatbubble" size={19} color={COLORS.textSecondary} />
        <Text style={styles.header}>{count}</Text>
        <View style={{ flex: 1 }} />
        {count > preview.length ? (
          <Text style={styles.viewAll}>모두 보기</Text>
        ) : null}
      </TouchableOpacity>

      {preview.length === 0 ? (
        <TouchableOpacity onPress={onOpen} activeOpacity={0.7}>
          <Text style={styles.empty}>
            아직 댓글이 없어요. 첫 댓글을 남겨보세요.
          </Text>
        </TouchableOpacity>
      ) : (
        preview.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.row}
            onPress={onOpen}
            activeOpacity={0.7}
          >
            <Avatar name={c.author_name} colorKey={c.user_id} size={24} />
            <Text style={styles.rowText} numberOfLines={1}>
              <Text style={styles.rowAuthor}>{c.author_name} </Text>
              {c.content}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: SPACING.lg, paddingHorizontal: 4, gap: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  header: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  viewAll: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  empty: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 18 },
  rowAuthor: { fontWeight: "700", color: COLORS.text },
});
