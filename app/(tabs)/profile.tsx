import { router } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../stores/authStore";

export default function ProfileScreen() {
  const { signOut, user } = useAuthStore();
  const { isAuthenticated, loading } = useAuth();

  // 인증 상태 확인 및 보호
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, loading]);

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading || !isAuthenticated) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    // router.replace("/auth"); // 제거 - AppContainer에서 자동으로 처리됨
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>마이페이지</Text>
      <Text style={styles.subtitle}>사용자 정보 및 설정</Text>

      <View style={styles.userInfo}>
        <Text style={styles.userLabel}>전화번호</Text>
        <Text style={styles.userValue}>{user?.phone || "정보 없음"}</Text>
      </View>

      <View style={styles.settingsContainer}>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>알림 설정</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>테마 설정</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>개인정보 처리방침</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  userInfo: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  userLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  userValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  settingsContainer: {
    marginBottom: 32,
  },
  settingItem: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  settingText: {
    fontSize: 16,
    color: COLORS.text,
  },
  signOutButton: {
    backgroundColor: COLORS.error,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },
});
