import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";

interface RenameDialogProps {
  visible: boolean;
  title: string;
  placeholder: string;
  initialValue?: string;
  saveLabel?: string;
  cancelLabel?: string;
  maxLength?: number;
  onCancel: () => void;
  onSubmit: (value: string) => void;
}

export function RenameDialog({
  visible,
  title,
  placeholder,
  initialValue = "",
  saveLabel = "저장",
  cancelLabel = "취소",
  maxLength = 60,
  onCancel,
  onSubmit,
}: RenameDialogProps) {
  const [draft, setDraft] = useState(initialValue);

  useEffect(() => {
    if (visible) setDraft(initialValue);
  }, [visible, initialValue]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.box} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            autoFocus
            maxLength={maxLength}
          />
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onCancel}
              style={[styles.btn, styles.btnCancel]}
            >
              <Text style={styles.btnCancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSubmit(draft)}
              style={[styles.btn, styles.btnSave]}
            >
              <Text style={styles.btnSaveText}>{saveLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  box: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  input: {
    backgroundColor: COLORS.surfaceDark,
    color: COLORS.text,
    fontSize: 14,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  btnCancel: { backgroundColor: COLORS.surfaceDark },
  btnSave: { backgroundColor: COLORS.primary },
  btnCancelText: { color: COLORS.text, fontWeight: "700", fontSize: 13 },
  btnSaveText: { color: COLORS.white, fontWeight: "800", fontSize: 13 },
});
