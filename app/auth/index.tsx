import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { COLORS } from "../../constants/Colors";
import { useAuthStore } from "../../stores/authStore";

export default function AuthScreen() {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const { signInWithPhone, loading, error, clearError } = useAuthStore();

  const validatePhone = (phoneNumber: string): boolean => {
    // 한국 전화번호 형식 검증 (010-1234-5678 또는 01012345678)
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    return phoneRegex.test(phoneNumber);
  };

  const formatToE164 = (phoneNumber: string): string => {
    // 숫자만 추출
    const numbers = phoneNumber.replace(/[^0-9]/g, "");

    // 한국 전화번호인 경우 +82로 변환
    if (numbers.startsWith("010")) {
      return `+82${numbers.slice(1)}`;
    }

    return phoneNumber;
  };

  const formatPhone = (phoneNumber: string): string => {
    // 숫자만 추출
    const numbers = phoneNumber.replace(/[^0-9]/g, "");

    // 010-1234-5678 형식으로 변환
    if (numbers.length >= 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(
        7,
        11
      )}`;
    }

    return phoneNumber;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhone(text);
    setPhone(formatted);
    setPhoneError("");
    clearError();
  };

  const handleSubmit = async () => {
    if (!phone.trim()) {
      setPhoneError("전화번호를 입력해주세요.");
      return;
    }

    if (!validatePhone(phone)) {
      setPhoneError("올바른 전화번호 형식을 입력해주세요.");
      return;
    }

    const success = await signInWithPhone({
      phone: formatToE164(phone),
    });

    if (success) {
      // 인증 코드 확인 화면으로 이동
      router.push("/auth/verify");
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
            ONMATOUT
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: COLORS.textSecondary,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            요가를 일상의 습관으로
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: COLORS.textSecondary,
              textAlign: "center",
            }}
          >
            전화번호로 간편하게 시작하세요
          </Text>
        </View>

        {/* Form */}
        <View style={{ marginBottom: 32 }}>
          <Input
            label="전화번호"
            placeholder="010-1234-5678"
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            error={phoneError || error || undefined}
            style={{ marginBottom: 24 }}
          />

          <Button
            title="인증 코드 받기"
            onPress={handleSubmit}
            loading={loading}
            disabled={!validatePhone(phone) || loading}
            size="large"
          />
        </View>

        {/* Info */}
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 14,
              color: COLORS.textSecondary,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            계속하기를 누르면{" "}
            <Text style={{ color: COLORS.primary }}>이용약관</Text>과{" "}
            <Text style={{ color: COLORS.primary }}>개인정보처리방침</Text>에
            동의하는 것으로 간주됩니다.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
