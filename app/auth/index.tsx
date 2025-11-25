import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import React, { useState } from "react";
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

const EMAIL_DOMAINS = ["gmail.com", "naver.com", "daum.net", "kakao.com"];

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);

  const { signInWithEmail, loading, clearError } = useAuthStore();
  const { showSnackbar } = useNotification();

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

  const handleSubmit = async () => {
    const isEmailValid = validateEmail(email);
    if (!isEmailValid) {
      return;
    }

    try {
      const success = await signInWithEmail({
        email,
      });

      if (success) {
        showSnackbar("로그인되었습니다.", "success");
        // Tab에서 Auth로 진입했으므로, 뒤로가기로 이전 탭으로 복귀
        navigation.goBack();
      } else {
        showSnackbar(
          "로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.",
          "error"
        );
      }
    } catch (e) {
      showSnackbar(
        "로그인 중 오류가 발생했습니다. 다시 시도해주세요.",
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
                      onPress={() => handleSelectEmailSuggestion(suggestion)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            {/* 비밀번호 입력은 사용하지 않으므로 제거 */}

            <TouchableOpacity
              style={[
                styles.button,
                (!email.trim() || loading) && {
                  opacity: 0.7,
                },
              ]}
              onPress={handleSubmit}
              disabled={loading || !email.trim()}
            >
              <Text style={styles.buttonText}>
                {loading ? "처리 중..." : "나마스떼(नमस्ते, Namaste)"}
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
  scrollContent: {
    flexGrow: 1,
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
});
