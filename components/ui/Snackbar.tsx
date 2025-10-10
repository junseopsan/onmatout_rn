import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";

interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onHide?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export default function Snackbar({
  visible,
  message,
  type = "info",
  duration = 3000,
  onHide,
  action,
}: SnackbarProps) {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          hideSnackbar();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      hideSnackbar();
    }
  }, [visible, duration]);

  const hideSnackbar = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onHide?.();
    });
  };

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "#4CAF50",
          icon: "checkmark-circle" as const,
        };
      case "error":
        return {
          backgroundColor: "#F44336",
          icon: "close-circle" as const,
        };
      case "warning":
        return {
          backgroundColor: "#FF9800",
          icon: "warning" as const,
        };
      default:
        return {
          backgroundColor: COLORS.primary,
          icon: "information-circle" as const,
        };
    }
  };

  const typeStyles = getTypeStyles();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.snackbar,
          { backgroundColor: typeStyles.backgroundColor },
        ]}
      >
        <View style={styles.content}>
          <Ionicons
            name={typeStyles.icon}
            size={20}
            color="white"
            style={styles.icon}
          />
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>
        {action && (
          <TouchableOpacity
            onPress={action.onPress}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={hideSnackbar} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100, // 탭바 위에 표시
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  snackbar: {
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  actionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});
