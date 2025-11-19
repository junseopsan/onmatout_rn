import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
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
  const [localLoading, setLocalLoading] = useState(false);
  const codeRef1 = React.useRef<any>(null);
  const codeRef2 = React.useRef<any>(null);
  const codeRef3 = React.useRef<any>(null);
  const codeRef4 = React.useRef<any>(null);
  const codeRef5 = React.useRef<any>(null);
  const codeRef6 = React.useRef<any>(null);
  const codeRefs = [codeRef1, codeRef2, codeRef3, codeRef4, codeRef5, codeRef6];

  const { signInWithPhone, verifyOTP, loading, error, clearError } =
    useAuthStore();
  const { showSnackbar, showDialog, hideDialog } = useNotification();

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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

    // 바로 인증번호 발송
    const formattedPhone = formatToE164(phone);
    console.log("포맷된 전화번호:", formattedPhone);

    setLocalLoading(true);
    try {
      const success = await signInWithPhone({
        phone: formattedPhone,
      });

      console.log("인증 코드 요청 결과:", success);

      if (success) {
        console.log("인증 코드 요청 성공!");
        setShowVerifyScreen(true);
        setResendTimer(60); // 60초 타이머 시작
      } else {
        showSnackbar(
          "인증번호 전송에 실패했습니다. 다시 시도해주세요.",
          "error"
        );
      }
    } catch (error) {
      showSnackbar(
        "인증번호 전송 중 오류가 발생했습니다. 다시 시도해주세요.",
        "error"
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCodeChange = (text: string, index: number) => {
    // 숫자만 허용
    const numericText = text.replace(/[^0-9]/g, "");

    // 여러 자리 숫자가 입력된 경우 (자동완성 등)
    if (numericText.length > 1) {
      const newCode = [...verificationCode];

      // 입력된 숫자들을 순차적으로 배치
      for (let i = 0; i < numericText.length && index + i < 6; i++) {
        newCode[index + i] = numericText[i];
      }

      setVerificationCode(newCode);

      // 마지막 입력된 필드로 포커스 이동
      const lastIndex = Math.min(index + numericText.length - 1, 5);
      if (lastIndex < 5) {
        codeRefs[lastIndex + 1].current?.focus();
      }

      // 6자리가 모두 입력되면 자동으로 검증
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        setTimeout(() => {
          handleVerifyCode(fullCode);
        }, 500);
      }
    } else {
      // 한 자리만 입력된 경우
      const digit = numericText.slice(0, 1);
      const newCode = [...verificationCode];
      newCode[index] = digit;
      setVerificationCode(newCode);

      // 다음 입력 필드로 포커스 이동
      if (digit && index < 5) {
        codeRefs[index + 1].current?.focus();
      }

      // 6자리가 모두 입력되면 자동으로 검증
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        setTimeout(() => {
          handleVerifyCode(fullCode);
        }, 500);
      }
    }
  };

  const handleCodeKeyPress = (e: any, index: number) => {
    // 백스페이스 키 처리
    if (
      e.nativeEvent.key === "Backspace" &&
      !verificationCode[index] &&
      index > 0
    ) {
      // 현재 필드가 비어있고 백스페이스를 누르면 이전 필드로 이동
      codeRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyCode = async (code?: string) => {
    const codeToVerify = code || verificationCode.join("");

    if (codeToVerify.length !== 6) {
      return;
    }

    console.log("=== 인증 코드 확인 시작 ===");
    console.log("입력된 인증 코드:", codeToVerify);

    // 실제 인증 코드 확인 로직
    const formattedPhone = formatToE164(phone);
    console.log("전화번호:", formattedPhone);

    try {
      const success = await verifyOTP({
        phone: formattedPhone,
        code: codeToVerify,
      });
      console.log("인증 결과:", success);

      if (success) {
        console.log("인증 성공 - 직접 대시보드로 이동");
        setShowVerifyScreen(false);
        setVerificationCode(["", "", "", "", "", ""]);
        setAttemptCount(0);

        // 인증 성공 후 직접 대시보드로 이동
        setTimeout(() => {
          const currentUser = useAuthStore.getState().user;
          const hasNickname =
            currentUser &&
            currentUser.profile &&
            currentUser.profile.name &&
            currentUser.profile.name.trim() !== "" &&
            currentUser.profile.name !== "null";

          if (hasNickname) {
            console.log("닉네임 있음 - Dashboard로 직접 이동");
            navigation.reset({
              index: 0,
              routes: [{ name: "TabNavigator" }],
            });
          } else {
            console.log("닉네임 없음 - 닉네임 설정 화면으로 직접 이동");
            navigation.reset({
              index: 0,
              routes: [{ name: "Nickname" }],
            });
          }
        }, 100);
      } else {
        console.log("인증 실패");
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);

        if (newAttemptCount >= 3) {
          showDialog(
            "인증 실패",
            "3번 연속으로 인증에 실패했습니다. 다시 시도해주세요.",
            "error",
            [
              {
                text: "확인",
                onPress: () => {
                  setShowVerifyScreen(false);
                  setVerificationCode(["", "", "", "", "", ""]);
                  setAttemptCount(0);
                  hideDialog(); // Dialog 닫기
                },
              },
            ]
          );
        } else {
          showSnackbar(
            `잘못된 인증 코드입니다. (${newAttemptCount}/3)`,
            "error"
          );
          setVerificationCode(["", "", "", "", "", ""]);
        }
      }
    } catch (error) {
      showSnackbar("인증 중 오류가 발생했습니다. 다시 시도해주세요.", "error");
    }
  };

  const handleResendCode = async () => {
    console.log("=== 인증 코드 재전송 시작 ===");

    const formattedPhone = formatToE164(phone);
    const success = await signInWithPhone({
      phone: formattedPhone,
    });

    if (success) {
      showSnackbar("인증 코드가 재전송되었습니다.", "success");
      setResendTimer(60); // 60초 타이머 시작
    } else {
      showSnackbar("인증 코드 재전송에 실패했습니다.", "error");
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
        {/* 기존 아사나 이미지 배열과 랜덤 선택 로직을 주석처리하고, 새로운 asana_bg.png 이미지를 배경으로 사용하도록 수정합니다. */}
        {/*
        {selectedBackgroundImages.map((image, index) => {
          // 화면을 6x20 그리드로 나누어 깔끔한 배치
          const row = Math.floor(index / 6);
          const col = index % 6;

          // 정확한 그리드 배치 (겹치지 않도록)
          const baseX = col * 16.67; // 100% / 6열 = 16.67%
          const baseY = row * 5; // 100% / 20행 = 5%

          return (
            <Image
              key={index}
              source={image}
              style={[
                styles.backgroundImage,
                {
                  opacity: 0.25,
                  transform: [
                    { rotate: `${(index * 15) % 360}deg` },
                    { scale: 0.7 },
                  ],
                  left: `${baseX}%`,
                  top: `${baseY}%`,
                },
              ]}
            />
          );
        })}
        */}
        {/* 새로운 asana_bg.png 이미지를 배경으로 사용 */}
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
        {showVerifyScreen ? (
          <View style={styles.verifyContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowVerifyScreen(false)}
            >
              <Text style={styles.backButtonText}>← 뒤로</Text>
            </TouchableOpacity>

            <View style={styles.verifyContent}>
              <Text style={styles.verifyTitle}>인증 코드 입력</Text>
              <Text style={styles.verifySubtitle}>
                {phone}로 전송된 6자리 인증 코드를 입력해주세요
              </Text>

              <View style={styles.codeInputContainer}>
                {verificationCode.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={codeRefs[index]}
                    style={styles.codeInput}
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(e) => handleCodeKeyPress(e, index)}
                    keyboardType="numeric"
                    maxLength={6}
                    selectTextOnFocus
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                ))}
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={styles.verifyButton}
                onPress={() => handleVerifyCode()}
                disabled={loading}
              >
                <Text style={styles.verifyButtonText}>
                  {loading ? "확인 중..." : "확인"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={resendTimer > 0}
              >
                <Text style={styles.resendButtonText}>
                  {resendTimer > 0
                    ? `${resendTimer}초 후 재전송 가능`
                    : "인증 코드 재전송"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
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
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="010-1234-5678"
                  placeholderTextColor="#999999"
                  keyboardType="phone-pad"
                />
                {phoneError && (
                  <Text style={styles.errorText}>{phoneError}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                disabled={localLoading || !phone.trim()}
              >
                <Text style={styles.buttonText}>
                  {localLoading ? "처리 중..." : "나마스떼(नमस्ते, Namaste)"}
                </Text>
              </TouchableOpacity>

              {/* 임시 로그인 버튼 */}
              {/* <TouchableOpacity
                style={[styles.button, styles.tempLoginButton]}
                onPress={() => navigation.navigate("TabNavigator")}
              >
                <Text style={styles.buttonText}>임시 로그인 (대시보드)</Text>
              </TouchableOpacity> */}

              {/* 약관 동의 텍스트 */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  나마스떼 버튼을 누르면{" "}
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
        )}
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
