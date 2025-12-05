import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { useNotification } from "../../contexts/NotificationContext";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";

const EMAIL_DOMAINS = [
  "gmail.com",
  "naver.com",
  "daum.net",
  "kakao.com",
  "onmatout.com",
];

export default function AuthScreen() {
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const { signInWithEmail, signInWithPhone, loading, error, clearError } =
    useAuthStore();

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

  const resetErrorsAndTimer = () => {
    setEmailError("");
    setPhoneError("");
    setRateLimitSeconds(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    clearError();
  };

  const handleToggleLoginMode = () => {
    setIsPhoneMode((prev) => !prev);
    resetErrorsAndTimer();
  };

  const handleEmailChange = (text: string) => {
    const value = text.trim();
    setEmail(value);
    setEmailError("");
    clearError();

    // 이미 @가 포함되어 있으면 추천 도메인은 숨김
    if (!value || value.includes("@")) {
      setEmailSuggestions([]);
      return;
    }

    // 로컬 파트만으로 도메인 추천 생성
    const localPart = value;
    const suggestions = EMAIL_DOMAINS.map((domain) => `${localPart}@${domain}`);
    setEmailSuggestions(suggestions);
  };

  const handlePhoneChange = (text: string) => {
    // 숫자만 입력 가능
    const numbers = text.replace(/[^0-9]/g, "");
    setPhone(numbers);
    setPhoneError("");
    clearError();
  };

  const handleSelectEmailSuggestion = (suggestion: string) => {
    setEmail(suggestion);
    setEmailSuggestions([]);
    setEmailError("");
    clearError();
  };

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError("이메일을 입력해주세요.");
      return false;
    }
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(value)) {
      setEmailError("올바른 이메일 형식을 입력해주세요.");
      return false;
    }
    return true;
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

  const startRateLimitTimerIfNeeded = () => {
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
            return (prev || 0) - 1;
          });
        }, 1000);
      }
    }
  };

  const handleEmailSubmit = async () => {
    const isEmailValid = validateEmail(email);
    if (!isEmailValid) {
      return;
    }

    try {
      const success = await signInWithEmail({
        email,
      });

      if (success) {
        showSnackbar("인증 코드가 이메일로 전송되었습니다.", "success");
        // OTP 입력 화면으로 이동
        navigation.navigate("Verify", { email });
      } else {
        const errorMessage =
          error || "이메일 전송에 실패했습니다. 이메일을 확인해주세요.";
        startRateLimitTimerIfNeeded();
        showSnackbar(errorMessage, "error");
      }
    } catch {
      showSnackbar(
        "이메일 전송 중 오류가 발생했습니다. 다시 시도해주세요.",
        "error"
      );
    }
  };

  const handlePhoneSubmit = async () => {
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
        const errorMessage =
          error || "인증번호 발송에 실패했습니다. 전화번호를 확인해주세요.";
        startRateLimitTimerIfNeeded();
        showSnackbar(errorMessage, "error");
      }
    } catch {
      showSnackbar(
        "인증번호 발송 중 오류가 발생했습니다. 다시 시도해주세요.",
        "error"
      );
    }
  };

  const handleSubmit = async () => {
    if (isPhoneMode) {
      await handlePhoneSubmit();
    } else {
      await handleEmailSubmit();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* 배경 레이어 - 요가 이미지 전체화면 */}
          <View style={styles.backgroundLayer}>
            <Image
              source={require("../../images/asanas/asana_bg.png")}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          </View>

          {/* UI 레이어 - 슬로건, 입력, 버튼 */}
          <View style={styles.uiLayer}>
            <View style={styles.content}>
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
                <Text style={styles.menuText}>
                  아사나 탐색 | 수련 기록 | 요가원 검색
                </Text>

                {isPhoneMode ? (
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
                ) : (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={handleEmailChange}
                      placeholder="example@yoga.com"
                      placeholderTextColor="#999999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {emailSuggestions.length > 0 && (
                      <View style={styles.suggestionContainer}>
                        {emailSuggestions.map((suggestion) => (
                          <TouchableOpacity
                            key={suggestion}
                            style={styles.suggestionItem}
                            onPress={() =>
                              handleSelectEmailSuggestion(suggestion)
                            }
                            activeOpacity={0.7}
                          >
                            <Text style={styles.suggestionText}>
                              {suggestion}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    {emailError ? (
                      <Text style={styles.errorText}>{emailError}</Text>
                    ) : null}
                  </View>
                )}

                {/* 비밀번호 입력은 사용하지 않으므로 제거 */}

                <TouchableOpacity
                  style={[
                    styles.button,
                    ((isPhoneMode ? !phone.trim() : !email.trim()) ||
                      loading ||
                      rateLimitSeconds !== null) && {
                      opacity: 0.7,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={
                    loading ||
                    (isPhoneMode ? !phone.trim() : !email.trim()) ||
                    rateLimitSeconds !== null
                  }
                >
                  <Text style={styles.buttonText}>
                    {loading
                      ? "..."
                      : rateLimitSeconds !== null
                      ? `${rateLimitSeconds}초 후 재시도`
                      : "나마스떼(नमस्ते, Namaste)"}
                  </Text>
                </TouchableOpacity>

                {/* 이메일 / 전화번호 로그인 토글 링크 */}
                <TouchableOpacity
                  onPress={handleToggleLoginMode}
                  style={styles.phoneLoginLink}
                >
                  <Text style={styles.phoneLoginText}>
                    {isPhoneMode ? "이메일 로그인" : "전화번호 로그인"}
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
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5", // 밝은 회색 배경
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
  backgroundImage: {
    opacity: 0.4,
    position: "absolute",
    width: "100%", // 전체 화면 너비
    height: "100%", // 전체 화면 높이
    resizeMode: "cover", // 이미지를 화면에 꽉 채우도록
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    zIndex: 1,
  },
  sloganContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slogan: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
    lineHeight: 36,
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
  suggestionContainer: {
    marginTop: 8,
    width: "80%",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  suggestionText: {
    fontSize: 14,
    color: "#333333",
  },
  label: {
    fontSize: 16,
    color: "#333333", // 어두운 텍스트
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC", // 밝은 회색 테두리
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333333", // 어두운 텍스트
    backgroundColor: "#FFFFFF", // 흰색 배경
    width: "80%", // 너비를 80%로 제한
    alignSelf: "center", // 중앙 정렬
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    width: "80%", // 너비를 80%로 제한
    alignSelf: "center", // 중앙 정렬
  },
  tempLoginButton: {
    backgroundColor: "#10B981", // 초록색으로 구분
    marginTop: 8,
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
  },
  // 인증 화면 스타일
  verifyContainer: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 12,
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: "#333333", // 어두운 텍스트
    fontWeight: "500",
  },
  verifyContent: {
    flex: 1,
    justifyContent: "center",
  },
  verifyTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333333", // 어두운 텍스트
    textAlign: "center",
    marginBottom: 8,
  },
  verifySubtitle: {
    fontSize: 16,
    color: "#666666", // 중간 회색 텍스트
    textAlign: "center",
    marginBottom: 32,
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 32,
  },
  codeInput: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: "#CCCCCC", // 밝은 회색 테두리
    borderRadius: 8,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333", // 어두운 텍스트
    backgroundColor: "#FFFFFF", // 흰색 배경
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  verifyButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },
  resendButton: {
    alignItems: "center",
  },
  resendButtonText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF", // 흰색 배경
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333", // 어두운 텍스트
    textAlign: "center",
    marginBottom: 20,
  },
  termsScrollView: {
    maxHeight: 200,
    marginBottom: 20,
  },
  termsDescription: {
    fontSize: 16,
    color: "#666666", // 중간 회색 텍스트
    marginBottom: 20,
    textAlign: "center",
  },
  termsItem: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#CCCCCC", // 밝은 회색 테두리
    borderRadius: 4,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  termsLabel: {
    fontSize: 16,
    color: "#333333", // 어두운 텍스트
    flex: 1,
  },
  termsLink: {
    fontSize: 12,
    color: COLORS.primary,
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5", // 밝은 회색 배경
    borderWidth: 1,
    borderColor: "#CCCCCC", // 밝은 회색 테두리
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#333333", // 어두운 텍스트
    fontWeight: "500",
  },
  confirmButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },
  termsContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  phoneLoginLink: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  phoneLoginText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textDecorationLine: "underline",
  },
});
