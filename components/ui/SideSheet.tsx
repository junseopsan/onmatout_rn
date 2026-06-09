import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";

interface SideSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children: React.ReactNode;
}

export function SideSheet({
  visible,
  onClose,
  title,
  actionLabel,
  onActionPress,
  children,
}: SideSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "bottom"]}>
            <View style={styles.head}>
              <Text style={styles.title}>{title}</Text>
              {actionLabel && onActionPress ? (
                <TouchableOpacity
                  onPress={onActionPress}
                  style={styles.actionBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="add" size={14} color={COLORS.primary} />
                  <Text style={styles.actionText}>{actionLabel}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {children}
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  sheet: {
    width: "82%",
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(139, 92, 246, 0.16)",
  },
  actionText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },
});
