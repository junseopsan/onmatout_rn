import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { normalizeText } from "../../hooks/useAsanas";
import type { Asana } from "../../lib/api/asanas";
import { getAsanaThumbnailSource } from "../../lib/asanaImages";
import {
  AUTO_MATCH_THRESHOLD,
  matchAsanaText,
  type AsanaLineMatch,
} from "../../lib/utils/asanaMatch";
import { Button } from "../ui/Button";
import { Sheet } from "../ui/Sheet";

interface Props {
  visible: boolean;
  onClose: () => void;
  asanas: Asana[];
  onConfirm: (selected: Asana[]) => void;
}

interface Row extends AsanaLineMatch {
  key: string;
  selectedId: string | null;
}

const PLACEHOLDER = `한 줄에 아사나 하나씩 붙여넣으세요.

예)
산 자세
다운독
전사 자세 1
아기 자세`;

export function PasteSequenceSheet({
  visible,
  onClose,
  asanas,
  onConfirm,
}: Props) {
  const [phase, setPhase] = useState<"input" | "review">("input");
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  const byId = useMemo(() => {
    const m = new Map<string, Asana>();
    for (const a of asanas) m.set(a.id, a);
    return m;
  }, [asanas]);

  const reset = () => {
    setPhase("input");
    setText("");
    setRows([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const runMatch = () => {
    const matches = matchAsanaText(text, asanas);
    setRows(
      matches.map((m, i) => ({
        ...m,
        key: `${i}-${m.raw}`,
        // 충분히 확실하면 자동 선택, 아니면 직접 고르도록 비워둔다.
        selectedId:
          m.bestScore >= AUTO_MATCH_THRESHOLD
            ? (m.candidates[0]?.id ?? null)
            : null,
      })),
    );
    setPhase("review");
  };

  const select = (rowKey: string, asanaId: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.key === rowKey
          ? { ...r, selectedId: r.selectedId === asanaId ? null : asanaId }
          : r,
      ),
    );
  };

  const selectedCount = rows.filter((r) => r.selectedId).length;

  const confirm = () => {
    const picked = rows
      .map((r) => (r.selectedId ? byId.get(r.selectedId) : null))
      .filter((a): a is Asana => !!a);
    onConfirm(picked);
    reset();
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title="텍스트로 시퀀스 만들기"
      description={
        phase === "input"
          ? "아사나 이름을 한 줄에 하나씩 붙여넣으면 자동으로 찾아줍니다."
          : "각 줄에 맞는 아사나를 확인하고,\n다르면 후보에서 골라주세요."
      }
      heightPct={phase === "review" ? 0.85 : undefined}
      scrollable={phase === "review"}
      footer={
        phase === "input" ? (
          <Button title="매칭하기" onPress={runMatch} disabled={!text.trim()} />
        ) : (
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={() => setPhase("input")}>
              <Text style={styles.backText}>다시 입력</Text>
            </TouchableOpacity>
            <Button
              title={`${selectedCount}개 추가`}
              onPress={confirm}
              disabled={selectedCount === 0}
              style={{ flex: 1, marginLeft: SPACING.md }}
            />
          </View>
        )
      }
    >
      {phase === "input" ? (
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={PLACEHOLDER}
          placeholderTextColor={COLORS.textMuted}
          multiline
          textAlignVertical="top"
        />
      ) : (
        rows.map((r) => {
          const selected = r.selectedId ? byId.get(r.selectedId) : null;
          const matched = !!selected;
          // 입력값이 선택된 아사나 한글명과 같으면 "→" 없이 (일치)로 표시
          const exact =
            !!selected &&
            normalizeText(r.raw) === normalizeText(selected.sanskrit_name_kr);
          return (
            <View key={r.key} style={styles.row}>
              <View style={styles.rowHead}>
                <Ionicons
                  name={matched ? "checkmark-circle" : "alert-circle-outline"}
                  size={16}
                  color={matched ? COLORS.primary : COLORS.warning}
                />
                {exact ? (
                  <>
                    <Text style={styles.exactName} numberOfLines={1}>
                      {selected!.sanskrit_name_kr}
                    </Text>
                    <View style={styles.okBadge}>
                      <Text style={styles.okBadgeText}>일치</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.rawText} numberOfLines={1}>
                      {r.raw}
                    </Text>
                    {selected ? (
                      <>
                        <Ionicons
                          name="arrow-forward"
                          size={12}
                          color={COLORS.textMuted}
                        />
                        <Text style={styles.matchedText} numberOfLines={1}>
                          {selected.sanskrit_name_kr}
                        </Text>
                      </>
                    ) : null}
                  </>
                )}
              </View>
              {r.candidates.length === 0 ? (
                <Text style={styles.noMatch}>일치하는 아사나가 없어요</Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chips}
                >
                  {r.candidates.map((c) => {
                    const on = r.selectedId === c.id;
                    const thumb = getAsanaThumbnailSource(c.image_number);
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.chip, on && styles.chipOn]}
                        onPress={() => select(r.key, c.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.chipThumb}>
                          {thumb ? (
                            <Image
                              source={thumb}
                              style={styles.chipThumbImg}
                              contentFit="contain"
                            />
                          ) : null}
                        </View>
                        <Text
                          style={[styles.chipText, on && styles.chipTextOn]}
                          numberOfLines={1}
                        >
                          {c.sanskrit_name_kr}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          );
        })
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    color: COLORS.text,
    ...TEXT.body,
    minHeight: 180,
    maxHeight: 240,
  },
  row: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rowHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  rawText: { ...TEXT.captionMed, color: COLORS.textSecondary, flexShrink: 1 },
  matchedText: {
    ...TEXT.captionMed,
    color: COLORS.primary,
    fontWeight: "700",
    flex: 1,
  },
  exactName: {
    ...TEXT.captionMed,
    color: COLORS.text,
    fontWeight: "700",
    flexShrink: 1,
  },
  okBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: "rgba(16, 185, 129, 0.14)",
  },
  okBadgeText: { fontSize: 10, fontWeight: "800", color: COLORS.success },
  noMatch: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    marginTop: 6,
    marginLeft: 22,
  },
  chips: { gap: 8, paddingVertical: 8, paddingLeft: 22 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipOn: {
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    borderColor: COLORS.primary,
  },
  chipThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F5F0E8", // 아사나 이미지 톤(베이지) — 다크 배경에 묻히지 않게
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  chipThumbImg: { width: "100%", height: "100%" },
  chipText: { ...TEXT.captionMed, color: COLORS.text, maxWidth: 120 },
  chipTextOn: { color: COLORS.primary },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    ...TEXT.bodyMed,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.sm,
  },
});
