import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { COLORS } from "../../constants/Colors";
import { useAuthStore } from "../../stores/authStore";

export default function VerifyScreen() {
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [timeLeft, setTimeLeft] = useState(180); // 3분
  const [canResend, setCanResend] = useState(false);
  const {
    verifyOTP,
    signInWithPhone,
    loading,
    error,
    clearError,
    phoneNumber,
  } = useAuthStore();
  const router = useRouter();

  // 타이머 효과
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleCodeChange = (text: string) => {
    // 숫자만 입력 가능
    const numbers = text.replace(/[^0-9]/g, "");
    setCode(numbers);
    setCodeError("");
    clearError();
  };

  const handleVerify = async () => {
    console.log("=== 인증 코드 확인 시작 ===");
    console.log("입력된 코드:", code);
    console.log("전화번호:", phoneNumber);

    if (!code.trim()) {
      setCodeError("인증 코드를 입력해주세요.");
      return;
    }

    if (code.length !== 6) {
      setCodeError("6자리 인증 코드를 입력해주세요.");
      return;
    }

    // 저장된 전화번호 사용
    const phone = phoneNumber || "+821012345678"; // 기본값으로 임시 전화번호
    console.log("사용할 전화번호:", phone);

    try {
      const success = await verifyOTP({ phone, code });
      console.log("인증 결과:", success);

      if (success) {
        console.log("인증 성공! 즉시 리다이렉트 처리");

        // 사용자 정보 확인 후 적절한 화면으로 리다이렉트
        const currentUser = useAuthStore.getState().user;
        const hasNickname =
          currentUser &&
          currentUser.profile &&
          currentUser.profile.name &&
          currentUser.profile.name.trim() !== "" &&
          currentUser.profile.name !== "null";

        console.log("닉네임 존재 여부:", hasNickname);

        if (hasNickname) {
          console.log("닉네임 있음 - tabs로 리다이렉트");
          router.replace("/(tabs)");
        } else {
          console.log("닉네임 없음 - 닉네임 설정 화면으로 리다이렉트");
          router.replace("/auth/nickname");
        }
      } else {
        console.log("인증 실패");
        // OTP 만료 에러 처리
        const error = useAuthStore.getState().error;
        if (error && error.includes("expired")) {
          Alert.alert(
            "인증 코드 만료",
            "인증 코드가 만료되었습니다. 새로운 인증 코드를 요청해주세요.",
            [
              {
                text: "재전송",
                onPress: () => {
                  setTimeLeft(180);
                  setCanResend(false);
                  setCode("");
                  handleResend();
                },
              },
              { text: "취소" },
            ]
          );
        }
      }
    } catch (error) {
      console.error("인증 과정에서 에러:", error);
      Alert.alert("오류", "인증 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  // 신규 회원 판단 함수 (24시간 이내 생성된 계정)
  const isRecentlyCreated = (createdAt: string): boolean => {
    const createdTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    const hoursDiff = (currentTime - createdTime) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  const handleResend = async () => {
    if (!canResend) return;

    // 저장된 전화번호 사용
    const phone = phoneNumber || "+821012345678"; // 기본값으로 임시 전화번호

    const success = await signInWithPhone({ phone });

    if (success) {
      setTimeLeft(180);
      setCanResend(false);
      setCode("");
      Alert.alert("재전송 완료", "인증 코드가 재전송되었습니다.");
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
            인증 코드 입력
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: COLORS.textSecondary,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {phoneNumber
              ? `${phoneNumber.replace(/\+82/, "0")} 로 전송된`
              : "SMS로 전송된"}{" "}
            {"\n"}6자리 인증 코드를 입력해주세요
          </Text>

          {/* 타이머 */}
          <Text
            style={{
              fontSize: 16,
              color: COLORS.primary,
              fontWeight: "600",
              marginTop: 8,
            }}
          >
            남은 시간: {formatTime(timeLeft)}
          </Text>
        </View>

        {/* Form */}
        <View style={{ marginBottom: 32 }}>
          <Input
            label="인증 코드"
            placeholder="000000"
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="numeric"
            error={codeError || error || undefined}
            style={{ marginBottom: 24 }}
            inputStyle={{
              fontSize: 24,
              textAlign: "center",
              letterSpacing: 8,
            }}
          />

          <Button
            title="인증하기"
            onPress={handleVerify}
            loading={loading}
            disabled={code.length !== 6 || loading}
            size="large"
          />
        </View>

        {/* 재전송 */}
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 14,
              color: COLORS.textSecondary,
              marginBottom: 8,
            }}
          >
            인증 코드를 받지 못하셨나요?
          </Text>
          <Button
            title={canResend ? "인증 코드 재전송" : "재전송 대기 중"}
            onPress={handleResend}
            variant="outline"
            size="small"
            disabled={!canResend}
            style={{ marginBottom: 16 }}
          />
          ㄱ{" "}
        </View>
      </View>
    </ScrollView>
  );
}
