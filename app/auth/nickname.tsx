import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { COLORS } from "../../constants/Colors";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";

export default function NicknameScreen() {
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const { loading, clearError, saveUserProfile } = useAuthStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
      // 닉네임 중복 확인
      const { userAPI } = await import("../../lib/api/user");
      const duplicateCheck = await userAPI.checkNicknameDuplicate(
        nickname.trim()
      );

      if (!duplicateCheck.success) {
        setNicknameError(
          duplicateCheck.message || "닉네임 확인 중 오류가 발생했습니다."
        );
        return;
      }

      if (duplicateCheck.isDuplicate) {
        setNicknameError("이미 사용 중인 닉네임입니다.");
        return;
      }

      // 사용자 프로필 저장
      const success = await saveUserProfile(nickname.trim());

      if (success) {
        Alert.alert(
          "환영합니다! 🧘‍♀️",
          `${nickname}님, ONMATOUT에 가입해주셔서 감사합니다.\n요가를 일상의 습관으로 만들어보세요!`,
          [
            {
              text: "시작하기",
              onPress: () => {
                navigation.navigate("TabNavigator");
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
      console.error("닉네임 저장 오류:", error);
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
      </View>
    </ScrollView>
  );
}
