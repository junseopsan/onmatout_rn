import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { COLORS } from "../../constants/Colors";
import { useNotification } from "../../contexts/NotificationContext";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";

export default function VerifyScreen() {
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [timeLeft, setTimeLeft] = useState(180); // 3분
  const [canResend, setCanResend] = useState(false);

  const route = useRoute();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { showSnackbar } = useNotification();

  const {
    verifyOTP,
    signInWithEmail,
    signInWithPhone,
    loading,
    error,
    clearError,
    user,
    getUserProfile,
  } = useAuthStore();

  // 라우트 파라미터에서 이메일 또는 전화번호 가져오기
  const email = (route.params as any)?.email || "";
  const phone = (route.params as any)?.phone || "";
  const toastMessage = (route.params as any)?.toastMessage as
    | string
    | undefined;
  const toastType = (route.params as any)?.toastType as
    | "success"
    | "error"
    | "info"
    | "warning"
    | undefined;
  const [initialToastShown, setInitialToastShown] = useState(false);

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
    // iOS에서 키보드를 먼저 닫기
    Keyboard.dismiss();

    if (!code.trim()) {
      setCodeError("인증 코드를 입력해주세요.");
      return;
    }

    if (code.length !== 6) {
      setCodeError("6자리 인증 코드를 입력해주세요.");
      return;
    }

    if (!email && !phone) {
      showSnackbar(
        "이메일 또는 전화번호 정보가 없습니다. 다시 로그인해주세요.",
        "error"
      );
      navigation.goBack();
      return;
    }

    try {
      const success = await verifyOTP({ email, phone, code });

      if (success) {
        showSnackbar("인증되었습니다.", "success");

        // 프로필 확인을 위해 getUserProfile 직접 호출
        try {
          const userProfile = await getUserProfile();

          // 닉네임이 있는지 확인
          const hasNickname =
            userProfile?.name &&
            userProfile.name.trim() !== "" &&
            userProfile.name !== "null";

          if (hasNickname) {
            // 닉네임이 있으면 탭 네비게이터로 이동
            navigation.reset({
              index: 0,
              routes: [{ name: "TabNavigator" }],
            });
          } else {
            // 닉네임이 없으면 닉네임 설정 화면으로 이동
            navigation.reset({
              index: 0,
              routes: [{ name: "Nickname" }],
            });
          }
        } catch (error) {
          console.error("프로필 확인 중 오류:", error);
          // 에러 발생 시 닉네임 설정 화면으로 이동 (안전한 기본값)
          navigation.reset({
            index: 0,
            routes: [{ name: "Nickname" }],
          });
        }
      } else {
        // authStore에서 설정된 에러 메시지 사용
        const currentError = useAuthStore.getState().error;
        const errorMessage = currentError || "인증 코드가 올바르지 않습니다.";

        // 에러 메시지에 따른 분류 (더 구체적인 조건을 먼저 체크)
        if (
          currentError &&
          currentError.includes("올바르지 않거나 만료되었습니다")
        ) {
          // 잘못된 코드 입력 시 확인 버튼만 표시 (Supabase의 일반적인 invalid token 에러)
          Alert.alert("인증 코드 오류", errorMessage, [
            {
              text: "확인",
              onPress: () => {
                setCode(""); // 코드 필드 클리어
              },
            },
          ]);
        } else if (
          currentError &&
          currentError.includes("새로운 코드를 요청해주세요")
        ) {
          // 명확한 만료 메시지인 경우에만 재전송 옵션 제공
          Alert.alert("인증 코드 만료", errorMessage, [
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
          ]);
        } else {
          // 기타 에러는 스낵바로 표시
          showSnackbar(errorMessage, "error");
        }
      }
    } catch (error) {
      showSnackbar("인증 중 오류가 발생했습니다. 다시 시도해주세요.", "error");
    }
  };

  // 전화번호 입력 화면에서 전달된 스낵바 메시지를 최초 진입 시 한 번만 표시
  useEffect(() => {
    if (!initialToastShown && toastMessage) {
      setInitialToastShown(true);
      setTimeout(() => {
        showSnackbar(toastMessage, toastType || "success");
      }, 60);
    }
  }, [initialToastShown, toastMessage, toastType, showSnackbar]);

  // 신규 회원 판단 함수 (24시간 이내 생성된 계정)
  const isRecentlyCreated = (createdAt: string): boolean => {
    const createdTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    const hoursDiff = (currentTime - createdTime) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  const handleResend = async () => {
    if (!canResend || (!email && !phone)) return;

    try {
      let success = false;
      if (email) {
        success = await signInWithEmail({ email });
      } else if (phone) {
        success = await signInWithPhone({ phone });
      }

      if (success) {
        setTimeLeft(180);
        setCanResend(false);
        setCode("");
        showSnackbar("인증 코드가 재전송되었습니다.", "success");
      } else {
        showSnackbar("인증 코드 재전송에 실패했습니다.", "error");
      }
    } catch (error) {
      showSnackbar("재전송 중 오류가 발생했습니다.", "error");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.background }}
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
              {email
                ? `${email} 로 전송된`
                : phone
                ? `${phone} 로 전송된`
                : "전송된"}{" "}
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
                // 입력된 숫자는 약간만 간격을 주고,
                // placeholder 가 지나치게 벌어져 보이지 않도록 작은 값 사용
                letterSpacing: 2,
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
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
