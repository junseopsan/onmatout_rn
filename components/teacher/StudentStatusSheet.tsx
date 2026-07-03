import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { teacherApi } from "../../lib/api/teacher";
import { Button } from "../ui/Button";
import { PillInput } from "../ui/PillInput";
import { Sheet } from "../ui/Sheet";

// 수련생 상태 변경(수련중/휴식/커스텀) 시트 — 회원 상세와 상태 내역 화면이 공유.
export function StudentStatusSheet({
  visible,
  onClose,
  studentId,
  initialCustom,
  onChanged,
}: {
  visible: boolean;
  onClose: () => void;
  studentId: string;
  initialCustom?: string | null;
  onChanged?: (next: { status: "active" | "paused"; custom_status: string | null }) => void;
}) {
  const [customDraft, setCustomDraft] = useState(initialCustom ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setCustomDraft(initialCustom ?? "");
  }, [visible, initialCustom]);

  const applyStatus = async (
    mode: "active" | "paused" | "custom",
    custom?: string,
  ) => {
    if (mode === "custom" && !custom?.trim()) {
      Alert.alert("입력 확인", "커스텀 상태를 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      const finalStatus = mode === "active" ? "active" : "paused";
      const finalCustom = mode === "custom" ? custom!.trim() : null;
      await teacherApi.updateStudent(studentId, {
        status: finalStatus,
        custom_status: finalCustom,
      } as any);
      onChanged?.({ status: finalStatus, custom_status: finalCustom });
      setCustomDraft("");
      onClose();
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="상태 변경" scrollable={false}>
      <TouchableOpacity
        style={styles.statusOpt}
        activeOpacity={0.7}
        disabled={saving}
        onPress={() => applyStatus("active")}
      >
        <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
        <Text style={styles.statusOptText}>수련중 (활성)</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.statusOpt}
        activeOpacity={0.7}
        disabled={saving}
        onPress={() => applyStatus("paused")}
      >
        <View style={[styles.statusDot, { backgroundColor: COLORS.warning }]} />
        <Text style={styles.statusOptText}>휴식중</Text>
      </TouchableOpacity>

      <View style={styles.statusCustomRow}>
        <View style={{ flex: 1 }}>
          <PillInput
            value={customDraft}
            onChangeText={setCustomDraft}
            placeholder="커스텀 상태 (예: 어깨 회복 중)"
            containerStyle={{ marginBottom: 0 }}
          />
        </View>
        <Button
          title="적용"
          size="medium"
          loading={saving}
          disabled={saving || !customDraft.trim()}
          onPress={() => applyStatus("custom", customDraft)}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  statusOpt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusOptText: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
  statusCustomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
});
