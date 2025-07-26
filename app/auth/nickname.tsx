import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { COLORS } from "../../constants/Colors";
import { useAuthStore } from "../../stores/authStore";

export default function NicknameScreen() {
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const { user, loading, clearError, saveUserProfile } = useAuthStore();

  const handleNicknameChange = (text: string) => {
    setNickname(text);
    setNicknameError("");
    clearError();
  };

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      setNicknameError("닉네임을 입력해주세요.");
      return;
    }

    if (nickname.length < 2) {
      setNicknameError("닉네임은 2자 이상 입력해주세요.");
      return;
    }

    if (nickname.length > 20) {
      setNicknameError("닉네임은 20자 이하로 입력해주세요.");
      return;
    }

    try {
      // 사용자 프로필 저장
      const success = await saveUserProfile(nickname);

      if (success) {
        // 사용자 정보 업데이트 (프로필 정보 추가)
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setUser({
            ...currentUser,
            profile: { name: nickname } as any,
          });
        }

        Alert.alert(
          "환영합니다! 🧘‍♀️",
          `${nickname}님, ONMATOUT에 가입해주셔서 감사합니다.\n요가를 일상의 습관으로 만들어보세요!`,
          [
            {
              text: "시작하기",
              onPress: () => {
                router.replace("/(tabs)");
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "오류",
          "닉네임 저장 중 오류가 발생했습니다. 다시 시도해주세요."
        );
      }
    } catch (error) {
      console.error("닉네임 저장 에러:", error);
      Alert.alert("오류", "닉네임 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ flexGrow: 1, padding: 24 }}
    >
      <View style={{ flex: 1, justifyContent: "center" }}>
        {/* Header */}
        <View style={{ marginBottom: 48, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: COLORS.text,
              marginBottom: 8,
            }}
          >
            닉네임 설정
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: COLORS.textSecondary,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            ONMATOUT에서 사용할{"\n"}
            닉네임을 입력해주세요
          </Text>
        </View>

        {/* Form */}
        <View style={{ marginBottom: 32 }}>
          <Input
            label="닉네임"
            placeholder="예: 요가러버"
            value={nickname}
            onChangeText={handleNicknameChange}
            error={nicknameError}
            style={{ marginBottom: 24 }}
          />

          <Button
            title="시작하기"
            onPress={handleSubmit}
            loading={loading}
            disabled={!nickname.trim()}
            style={{ marginBottom: 16 }}
          />
        </View>

        {/* Info */}
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 14,
              color: COLORS.textSecondary,
              textAlign: "center",
            }}
          >
            닉네임은 나중에 마이페이지에서{"\n"}
            언제든지 변경할 수 있습니다
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
