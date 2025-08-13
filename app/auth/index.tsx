import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { TamaguiButtonComponent } from "../../components/ui/TamaguiButton";
import { TamaguiInputComponent } from "../../components/ui/TamaguiInput";
import { COLORS } from "../../constants/Colors";
import { useAuthStore } from "../../stores/authStore";

export default function AuthScreen() {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [attemptCount, setAttemptCount] = useState(0);
  const [resendTimer, setResendTimer] = useState(0);
  const { signInWithPhone, loading, error, clearError } = useAuthStore();
  const router = useRouter();
  const [showVerifyScreen, setShowVerifyScreen] = useState(false);

  // 재전송 타이머
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

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
    console.log("=== 인증 코드 요청 시작 ===");
    console.log("입력된 전화번호:", phone);

    if (!phone.trim()) {
      setPhoneError("전화번호를 입력해주세요.");
      return;
    }

    if (!validatePhone(phone)) {
      setPhoneError("올바른 전화번호 형식을 입력해주세요.");
      return;
    }

    const formattedPhone = formatToE164(phone);
    console.log("포맷된 전화번호:", formattedPhone);

    const success = await signInWithPhone({
      phone: formattedPhone,
    });

    console.log("인증 코드 요청 결과:", success);

    if (success) {
      console.log("인증 코드 요청 성공!");

      // 간단한 상태 변경으로 화면 전환
      setShowVerifyScreen(true);
      setResendTimer(60); // 60초 타이머 시작

      // Alert.alert("인증 코드 전송 완료", "인증 코드가 전송되었습니다.", [
      //   { text: "확인" },
      // ]);
    } else {
      console.log("인증 코드 요청 실패");
    }
  };

  const handleCodeChange = (text: string) => {
    // 숫자만 허용
    const numericText = text.replace(/[^0-9]/g, "");

    // 6자리로 제한
    const limitedText = numericText.slice(0, 6);

    // 배열로 변환
    const newCode = limitedText
      .split("")
      .concat(Array(6 - limitedText.length).fill(""));

    setVerificationCode(newCode);

    // 6자리가 모두 입력되면 자동으로 검증
    if (limitedText.length === 6) {
      setTimeout(() => {
        handleVerifyCode(limitedText);
      }, 500);
    }
  };

  const handleVerifyCode = async (code?: string) => {
    const codeToVerify = code || verificationCode.join("");

    if (codeToVerify.length !== 6) {
      return;
    }

    console.log("=== 인증 코드 확인 시작 ===");
    console.log("입력된 인증 코드:", codeToVerify);

    // TODO: 실제 인증 코드 확인 로직 구현
    // 임시로 랜덤 성공/실패 (실제로는 서버 API 호출)
    const isSuccess = Math.random() > 0.5; // 50% 확률로 성공

    if (isSuccess) {
      // Alert.alert("인증 성공", "인증이 완료되었습니다!");
      // 성공 시 메인 화면으로 이동
      setShowVerifyScreen(false);
      setVerificationCode(["", "", "", "", "", ""]);
      setAttemptCount(0);

      // 임시로 인증 상태 업데이트 (실제로는 서버에서 세션 생성)
      // TODO: 실제 인증 로직에서 세션 생성
      const tempSession = {
        user: {
          id: "temp-user",
          phone: phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        access_token: "temp-token",
        refresh_token: "temp-refresh-token",
      };

      useAuthStore.getState().setSession(tempSession);
      useAuthStore.getState().setUser(tempSession.user);
      useAuthStore.getState().setLoading(false);

      console.log("인증 성공 - 메인 화면으로 이동");
    } else {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);

      if (newAttemptCount >= 3) {
        Alert.alert(
          "인증 실패",
          "3번 연속으로 인증에 실패했습니다. 다시 시도해주세요.",
          [
            {
              text: "확인",
              onPress: () => {
                setShowVerifyScreen(false);
                setVerificationCode(["", "", "", "", "", ""]);
                setAttemptCount(0);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "인증 실패",
          `잘못된 인증 코드입니다. (${newAttemptCount}/3)`
        );
        setVerificationCode(["", "", "", "", "", ""]);
      }
    }
  };

  const handleResendCode = async () => {
    console.log("=== 인증 코드 재전송 시작 ===");

    const formattedPhone = formatToE164(phone);
    const success = await signInWithPhone({
      phone: formattedPhone,
    });

    if (success) {
      Alert.alert("재전송 완료", "인증 코드가 재전송되었습니다.");
      setResendTimer(60); // 60초 타이머 시작
    } else {
      Alert.alert("재전송 실패", "인증 코드 재전송에 실패했습니다.");
    }
  };

  // verify 화면이 표시되어야 하는 경우
  if (showVerifyScreen) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        {/* 상단 백버튼 */}
        <View
          style={{ paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20 }}
        >
          <TouchableOpacity
            onPress={() => setShowVerifyScreen(false)}
            style={{
              alignSelf: "flex-start",
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: COLORS.background,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              ←
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 0 }}
        >
          <View style={{ flex: 1, justifyContent: "center" }}>
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
                  marginBottom: 8,
                }}
              >
                SMS로 전송된 6자리 인증 코드를 입력해주세요
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.textSecondary,
                  textAlign: "center",
                }}
              >
                {phone}로 전송되었습니다
              </Text>
            </View>

            {/* 인증 코드 입력 필드들 */}
            <View
              style={{
                marginBottom: 32,
                flexDirection: "row",
                justifyContent: "center",
                gap: 12,
              }}
            >
              {verificationCode.map((digit, index) => (
                <View
                  key={index}
                  style={{
                    width: 50,
                    height: 50,
                    borderWidth: 2,
                    borderColor: digit ? COLORS.primary : COLORS.textSecondary,
                    borderRadius: 8,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: COLORS.background,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: COLORS.text,
                    }}
                  >
                    {digit}
                  </Text>
                </View>
              ))}
            </View>

            {/* 숨겨진 입력 필드 */}
            <View style={{ position: "absolute", opacity: 0, height: 0 }}>
              <TextInput
                value={verificationCode.join("")}
                onChangeText={handleCodeChange}
                keyboardType="numeric"
                maxLength={6}
                autoFocus={showVerifyScreen}
                style={{ height: 0 }}
              />
            </View>

            {/* 재전송 버튼 */}
            <View style={{ marginBottom: 32, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.textSecondary,
                  marginBottom: 8,
                }}
              >
                인증 코드를 받지 못하셨나요?
              </Text>
              <TamaguiButtonComponent
                title={
                  resendTimer > 0
                    ? `${resendTimer}초 후 재전송 가능`
                    : "인증 코드 재전송"
                }
                onPress={handleResendCode}
                variant="outline"
                size="small"
                disabled={loading || resendTimer > 0}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

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
            매트 위에서 시작된 수련이
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: COLORS.textSecondary,
              textAlign: "center",
            }}
          >
            하루의 모든 순간으로 스며들도록
          </Text>
        </View>

        {/* Form */}
        <View style={{ marginBottom: 32 }}>
          <TamaguiInputComponent
            label="전화번호"
            placeholder="010-1234-5678"
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            error={phoneError || error || undefined}
            style={{ marginBottom: 24 }}
          />

          <TamaguiButtonComponent
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
            동의한 것으로 봅니다.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
