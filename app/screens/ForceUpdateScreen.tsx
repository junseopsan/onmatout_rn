import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";

interface ForceUpdateScreenProps {
  storeUrl: string;
  minVersion: string;
}

export default function ForceUpdateScreen({
  storeUrl,
  minVersion,
}: ForceUpdateScreenProps) {
  const handleUpdate = () => {
    if (storeUrl) {
      Linking.openURL(storeUrl);
    }
  };

  const storeName = Platform.OS === "ios" ? "App Store" : "Google Play";

  return (
    <View style={styles.updateContainer}>
      <View style={styles.updateContent}>
        {/* 아이콘 */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="cloud-download-outline"
            size={80}
            color={COLORS.primary}
          />
        </View>

        {/* 제목 */}
        <Text style={styles.updateTitle}>새로운 버전이 필요합니다</Text>

        {/* 설명 */}
        <Text style={styles.updateDescription}>
          온매트아웃의 새로운 기능과 개선사항이
          {"\n"}
          추가되었습니다.
        </Text>
        <Text style={styles.updateSubDescription}>
          {storeName}에서 최신 버전으로 업데이트하고
          {"\n"}
          이용을 계속해 주세요.
        </Text>

        {/* 업데이트 버튼 */}
        <TouchableOpacity
          style={styles.updateButton}
          activeOpacity={0.8}
          onPress={handleUpdate}
        >
          <Ionicons name="arrow-down-circle" size={20} color="white" />
          <Text style={styles.updateButtonText}>{storeName}에서 업데이트</Text>
        </TouchableOpacity>

        {/* 하단 정보 */}
        <Text style={styles.updateFooter}>
          최신 버전의 앱으로 더 나은 경험을 만나보세요
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  updateContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  updateContent: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 400,
    width: "100%",
  },
  iconContainer: {
    marginBottom: 24,
  },
  updateTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 16,
  },
  updateDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 24,
  },
  updateSubDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  versionInfo: {
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  versionLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  versionNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
  },
  updateButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 24,
    width: "100%",
  },
  updateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  updateFooter: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
});
