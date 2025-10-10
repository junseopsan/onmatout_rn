import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";

interface DialogButton {
  text: string;
  onPress: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface DialogProps {
  visible: boolean;
  title?: string;
  message?: string;
  buttons?: DialogButton[];
  onClose?: () => void;
  type?: "info" | "success" | "warning" | "error";
  showCloseButton?: boolean;
}

export default function Dialog({
  visible,
  title,
  message,
  buttons = [],
  onClose,
  type = "info",
  showCloseButton = true,
}: DialogProps) {
  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          icon: "checkmark-circle" as const,
          iconColor: "#4CAF50",
        };
      case "warning":
        return {
          icon: "warning" as const,
          iconColor: "#FF9800",
        };
      case "error":
        return {
          icon: "close-circle" as const,
          iconColor: "#F44336",
        };
      default:
        return {
          icon: "information-circle" as const,
          iconColor: COLORS.primary,
        };
    }
  };

  const typeStyles = getTypeStyles();

  const getButtonStyle = (buttonStyle: string = "default") => {
    switch (buttonStyle) {
      case "cancel":
        return [styles.button, styles.cancelButton];
      case "destructive":
        return [styles.button, styles.destructiveButton];
      default:
        return [styles.button, styles.defaultButton];
    }
  };

  const getButtonTextStyle = (buttonStyle: string = "default") => {
    switch (buttonStyle) {
      case "cancel":
        return styles.cancelButtonText;
      case "destructive":
        return styles.destructiveButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialog}>
              {/* 헤더 */}
              {showCloseButton && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              )}

              {/* 아이콘 */}
              <View style={styles.iconContainer}>
                <Ionicons
                  name={typeStyles.icon}
                  size={48}
                  color={typeStyles.iconColor}
                />
              </View>

              {/* 제목 */}
              {title && <Text style={styles.title}>{title}</Text>}

              {/* 메시지 */}
              {message && <Text style={styles.message}>{message}</Text>}

              {/* 버튼들 */}
              {buttons.length > 0 && (
                <View style={styles.buttonContainer}>
                  {buttons.map((button, index) => (
                    <TouchableOpacity
                      key={index}
                      style={getButtonStyle(button.style)}
                      onPress={button.onPress}
                    >
                      <Text style={getButtonTextStyle(button.style)}>
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dialog: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  defaultButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  destructiveButton: {
    backgroundColor: "#F44336",
  },
  defaultButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  destructiveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
