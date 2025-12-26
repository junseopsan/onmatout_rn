import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
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
    // 한글 입력 조합을 방해하지 않도록 입력값을 그대로 저장
    setNickname(text);

    // 에러 메시지 초기화 (실시간 검증은 하지 않음)
    if (nicknameError) {
      setNicknameError("");
    }
    clearError();
  };

  const handleNicknameBlur = () => {
    // 포커스 해제 시 허용되지 않은 문자 제거 및 검증
    const sanitized = nickname.replace(/[^가-힣a-zA-Z0-9\s]/g, "");

    if (sanitized !== nickname) {
      setNickname(sanitized);
      setNicknameError("닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.");
    } else if (nickname.trim() && nickname.trim().length < 2) {
      setNicknameError("닉네임은 2자 이상 입력해주세요.");
    } else if (nickname.trim().length > 20) {
      setNicknameError("닉네임은 20자 이하로 입력해주세요.");
    } else if (
      nickname.trim() &&
      !/^[가-힣a-zA-Z0-9\s]+$/.test(nickname.trim())
    ) {
      setNicknameError("닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.");
    } else {
      setNicknameError("");
    }
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

    // 최종 유효성 검사 (한글, 영문, 숫자, 공백만 허용)
    if (!/^[가-힣a-zA-Z0-9\s]+$/.test(nickname.trim())) {
      setNicknameError("닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.");
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
              text: "환영해요!",
              onPress: () => {
                // 회원가입 완료 후에는 닉네임/인증 화면으로 되돌아갈 수 없도록
                // 네비게이션 스택을 탭 네비게이터만 남기도록 초기화
                navigation.reset({
                  index: 0,
                  routes: [{ name: "TabNavigator" }],
                });
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
              onBlur={handleNicknameBlur}
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
    </KeyboardAvoidingView>
  );
}
