import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { useNotification } from "../../contexts/NotificationContext";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";

export default function PhoneLoginScreen() {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { signInWithPhone, loading, error, clearError } = useAuthStore();

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const { showSnackbar } = useNotification();

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePhoneChange = (text: string) => {
    // 숫자만 입력 가능
    const numbers = text.replace(/[^0-9]/g, "");
    setPhone(numbers);
    setPhoneError("");
    clearError();
  };

  const validatePhone = (value: string) => {
    if (!value) {
      setPhoneError("전화번호를 입력해주세요.");
      return false;
    }
    // 전화번호 형식 검증 (010으로 시작하는 11자리 또는 10자리)
    const phoneRegex = /^010\d{7,8}$/;
    if (!phoneRegex.test(value)) {
      setPhoneError("올바른 전화번호 형식을 입력해주세요. (010-0000-0000)");
      return false;
    }
    return true;
  };

  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, "");
    // 010-0000-0000 형식으로 포맷
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handleSubmit = async () => {
    const isPhoneValid = validatePhone(phone);
    if (!isPhoneValid) {
      return;
    }

    try {
      // 전화번호 정규화 (하이픈 제거)
      const normalizedPhone = phone.replace(/[^0-9]/g, "");
      // 국제 형식으로 변환 (+82)
      const internationalPhone = `+82${normalizedPhone.slice(1)}`;

      const success = await signInWithPhone({
        phone: internationalPhone,
      });

      if (success) {
        showSnackbar("인증 코드가 전화번호로 전송되었습니다.", "success");
        // OTP 입력 화면으로 이동
        navigation.navigate("Verify", { phone: internationalPhone });
      } else {
        // authStore에서 설정된 에러 메시지 사용
        const errorMessage =
          error || "인증번호 발송에 실패했습니다. 전화번호를 확인해주세요.";

        // Rate Limiting 에러인지 확인하고 타이머 시작
        if (error && error.includes("초 후에 다시 시도해주세요")) {
          const match = error.match(/(\d+)초 후에/);
          if (match) {
            const seconds = parseInt(match[1]);
            setRateLimitSeconds(seconds);

            // 기존 타이머가 있다면 정리
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }

            // 1초마다 카운트다운
            timerRef.current = setInterval(() => {
              setRateLimitSeconds((prev) => {
                if (prev === null || prev <= 1) {
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                  }
                  return null;
                }
                return prev - 1;
              });
            }, 1000);
          }
        }

        showSnackbar(errorMessage, "error");
      }
    } catch (e) {
      showSnackbar(
        "인증번호 발송 중 오류가 발생했습니다. 다시 시도해주세요.",
        "error"
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* 배경 레이어 - 요가 이미지 전체화면 */}
      <View style={styles.backgroundLayer}>
        <Image
          source={require("../../images/asanas/asana_bg.png")}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>

      {/* UI 레이어 - 슬로건, 입력, 버튼 */}
      <ScrollView
        style={styles.uiLayer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* 뒤로가기 버튼 */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>

          {/* 중앙 슬로건 */}
          <View style={styles.sloganContainer}>
            <Image
              source={require("../../images/onthemat_rm_bg.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* 하단 입력 섹션 */}
          <View style={styles.bottomSection}>
            <Text style={styles.menuText}>전화번호로 로그인</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="010-0000-0000"
                placeholderTextColor="#999999"
                keyboardType="phone-pad"
                maxLength={13}
              />
              {phoneError ? (
                <Text style={styles.errorText}>{phoneError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (!phone.trim() || loading || rateLimitSeconds !== null) && {
                  opacity: 0.7,
                },
              ]}
              onPress={handleSubmit}
              disabled={loading || !phone.trim() || rateLimitSeconds !== null}
            >
              <Text style={styles.buttonText}>
                {loading
                  ? "처리 중..."
                  : rateLimitSeconds !== null
                  ? `${rateLimitSeconds}초 후 재시도`
                  : "인증번호 받기"}
              </Text>
            </TouchableOpacity>

            {/* 약관 동의 텍스트 */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                로그인 / 회원가입을 진행하면{" "}
                <TouchableOpacity
                  onPress={() => navigation.navigate("TermsOfService")}
                >
                  <Text style={styles.termsLink}>이용약관</Text>
                </TouchableOpacity>{" "}
                및{" "}
                <TouchableOpacity
                  onPress={() => navigation.navigate("PrivacyPolicy")}
                >
                  <Text style={styles.termsLink}>개인정보처리방침에</Text>
                </TouchableOpacity>
                {"\n"}동의하게 됩니다.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    zIndex: 1,
  },
  backgroundLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  uiLayer: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backgroundImage: {
    opacity: 0.4,
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    zIndex: 1,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 12,
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  sloganContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 300,
    height: 100,
    alignSelf: "center",
  },
  menuText: {
    fontSize: 18,
    color: "#666666",
    textAlign: "center",
    marginBottom: 18,
    fontWeight: "bold",
  },
  bottomSection: {
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333333",
    backgroundColor: "#FFFFFF",
    width: "80%",
    alignSelf: "center",
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    width: "80%",
    alignSelf: "center",
  },
  buttonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },
  termsText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    lineHeight: 18,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 8,
    textAlign: "center",
  },
  termsContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  termsLink: {
    fontSize: 12,
    color: COLORS.primary,
    textDecorationLine: "underline",
    fontWeight: "500",
  },
});

