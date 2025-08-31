import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
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

  const { signInWithPhone, verifyOTP, loading, error, clearError } =
    useAuthStore();

  // 기존 아사나 이미지 배열 (주석처리)
  /*
  const backgroundImages = [
    require("../../images/asanas/001.png"),
    require("../../images/asanas/002.png"),
    require("../../images/asanas/003.png"),
    require("../../images/asanas/004.png"),
    require("../../images/asanas/005.png"),
    require("../../images/asanas/006.png"),
    require("../../images/asanas/007.png"),
    require("../../images/asanas/008.png"),
    require("../../images/asanas/009.png"),
    require("../../images/asanas/010.png"),
    require("../../images/asanas/011.png"),
    require("../../images/asanas/012.png"),
    require("../../images/asanas/013.png"),
    require("../../images/asanas/014.png"),
    require("../../images/asanas/015.png"),
    require("../../images/asanas/016.png"),
    require("../../images/asanas/017.png"),
    require("../../images/asanas/018.png"),
    require("../../images/asanas/019.png"),
    require("../../images/asanas/020.png"),
    require("../../images/asanas/021.png"),
    require("../../images/asanas/022.png"),
    require("../../images/asanas/023.png"),
    require("../../images/asanas/024.png"),
    require("../../images/asanas/025.png"),
    require("../../images/asanas/026.png"),
    require("../../images/asanas/027.png"),
    require("../../images/asanas/028.png"),
    require("../../images/asanas/029.png"),
    require("../../images/asanas/030.png"),
    require("../../images/asanas/031.png"),
    require("../../images/asanas/032.png"),
    require("../../images/asanas/033.png"),
    require("../../images/asanas/034.png"),
    require("../../images/asanas/035.png"),
    require("../../images/asanas/036.png"),
    require("../../images/asanas/037.png"),
    require("../../images/asanas/038.png"),
    require("../../images/asanas/039.png"),
    require("../../images/asanas/040.png"),
    require("../../images/asanas/041.png"),
    require("../../images/asanas/042.png"),
    require("../../images/asanas/043.png"),
    require("../../images/asanas/044.png"),
    require("../../images/asanas/045.png"),
    require("../../images/asanas/046.png"),
    require("../../images/asanas/047.png"),
    require("../../images/asanas/048.png"),
    require("../../images/asanas/049.png"),
    require("../../images/asanas/050.png"),
    require("../../images/asanas/051.png"),
    require("../../images/asanas/052.png"),
    require("../../images/asanas/053.png"),
    require("../../images/asanas/054.png"),
    require("../../images/asanas/055.png"),
    require("../../images/asanas/056.png"),
    require("../../images/asanas/057.png"),
    require("../../images/asanas/058.png"),
    require("../../images/asanas/059.png"),
    require("../../images/asanas/060.png"),
    require("../../images/asanas/061.png"),
    require("../../images/asanas/062.png"),
    require("../../images/asanas/063.png"),
    require("../../images/asanas/064.png"),
    require("../../images/asanas/065.png"),
    require("../../images/asanas/066.png"),
    require("../../images/asanas/067.png"),
    require("../../images/asanas/068.png"),
    require("../../images/asanas/069.png"),
    require("../../images/asanas/070.png"),
    require("../../images/asanas/071.png"),
    require("../../images/asanas/072.png"),
    require("../../images/asanas/073.png"),
    require("../../images/asanas/074.png"),
    require("../../images/asanas/075.png"),
    require("../../images/asanas/076.png"),
    require("../../images/asanas/077.png"),
    require("../../images/asanas/078.png"),
    require("../../images/asanas/079.png"),
    require("../../images/asanas/080.png"),
    require("../../images/asanas/081.png"),
    require("../../images/asanas/082.png"),
    require("../../images/asanas/083.png"),
    require("../../images/asanas/084.png"),
    require("../../images/asanas/085.png"),
    require("../../images/asanas/086.png"),
    require("../../images/asanas/087.png"),
    require("../../images/asanas/088.png"),
    require("../../images/asanas/089.png"),
    require("../../images/asanas/090.png"),
    require("../../images/asanas/091.png"),
    require("../../images/asanas/092.png"),
    require("../../images/asanas/093.png"),
    require("../../images/asanas/094.png"),
    require("../../images/asanas/095.png"),
    require("../../images/asanas/096.png"),
    require("../../images/asanas/097.png"),
    require("../../images/asanas/098.png"),
    require("../../images/asanas/099.png"),
    require("../../images/asanas/100.png"),
    require("../../images/asanas/101.png"),
    require("../../images/asanas/102.png"),
    require("../../images/asanas/103.png"),
    require("../../images/asanas/104.png"),
    require("../../images/asanas/105.png"),
    require("../../images/asanas/106.png"),
    require("../../images/asanas/107.png"),
    require("../../images/asanas/108.png"),
    require("../../images/asanas/109.png"),
    require("../../images/asanas/110.png"),
    require("../../images/asanas/111.png"),
    require("../../images/asanas/112.png"),
    require("../../images/asanas/113.png"),
    require("../../images/asanas/114.png"),
    require("../../images/asanas/115.png"),
    require("../../images/asanas/116.png"),
    require("../../images/asanas/117.png"),
    require("../../images/asanas/118.png"),
    require("../../images/asanas/119.png"),
    require("../../images/asanas/120.png"),
    require("../../images/asanas/121.png"),
    require("../../images/asanas/122.png"),
    require("../../images/asanas/123.png"),
    require("../../images/asanas/124.png"),
    require("../../images/asanas/125.png"),
    require("../../images/asanas/126.png"),
    require("../../images/asanas/127.png"),
    require("../../images/asanas/128.png"),
    require("../../images/asanas/129.png"),
    require("../../images/asanas/130.png"),
    require("../../images/asanas/131.png"),
    require("../../images/asanas/132.png"),
    require("../../images/asanas/133.png"),
    require("../../images/asanas/134.png"),
    require("../../images/asanas/135.png"),
    require("../../images/asanas/136.png"),
    require("../../images/asanas/137.png"),
    require("../../images/asanas/138.png"),
    require("../../images/asanas/139.png"),
    require("../../images/asanas/140.png"),
    require("../../images/asanas/141.png"),
    require("../../images/asanas/142.png"),
    require("../../images/asanas/143.png"),
    require("../../images/asanas/144.png"),
    require("../../images/asanas/145.png"),
    require("../../images/asanas/146.png"),
    require("../../images/asanas/147.png"),
    require("../../images/asanas/148.png"),
    require("../../images/asanas/149.png"),
    require("../../images/asanas/150.png"),
    require("../../images/asanas/151.png"),
    require("../../images/asanas/152.png"),
    require("../../images/asanas/153.png"),
    require("../../images/asanas/154.png"),
    require("../../images/asanas/155.png"),
    require("../../images/asanas/156.png"),
    require("../../images/asanas/157.png"),
    require("../../images/asanas/158.png"),
    require("../../images/asanas/159.png"),
    require("../../images/asanas/160.png"),
    require("../../images/asanas/161.png"),
    require("../../images/asanas/162.png"),
    require("../../images/asanas/163.png"),
    require("../../images/asanas/164.png"),
    require("../../images/asanas/165.png"),
    require("../../images/asanas/166.png"),
    require("../../images/asanas/167.png"),
    require("../../images/asanas/168.png"),
    require("../../images/asanas/169.png"),
    require("../../images/asanas/170.png"),
    require("../../images/asanas/171.png"),
    require("../../images/asanas/172.png"),
    require("../../images/asanas/173.png"),
    require("../../images/asanas/174.png"),
    require("../../images/asanas/175.png"),
    require("../../images/asanas/176.png"),
    require("../../images/asanas/177.png"),
    require("../../images/asanas/178.png"),
    require("../../images/asanas/179.png"),
    require("../../images/asanas/180.png"),
    require("../../images/asanas/181.png"),
  ];

  // 기존 랜덤 이미지 선택 로직 (주석처리)
  // const getRandomImages = () => {
  //   const shuffled = [...backgroundImages].sort(() => 0.5 - Math.random());
  //   return shuffled.slice(0, 120);
  // };

  // const [selectedBackgroundImages] = useState(() => getRandomImages());
  */

  const router = useRouter();
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

    const success = await signInWithPhone({
      phone: formattedPhone,
    });

    console.log("인증 코드 요청 결과:", success);

    if (success) {
      console.log("인증 코드 요청 성공!");
      setShowVerifyScreen(true);
      setResendTimer(60); // 60초 타이머 시작
    } else {
      console.log("인증 코드 요청 실패");
      Alert.alert("오류", "인증번호 전송에 실패했습니다. 다시 시도해주세요.");
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
              routes: [{ name: "Dashboard" }],
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
    } catch (error) {
      console.error("인증 과정에서 에러:", error);
      Alert.alert("오류", "인증 중 오류가 발생했습니다. 다시 시도해주세요.");
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

  return (
    <View style={styles.container}>
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
      <View style={styles.uiLayer}>
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
                    style={styles.codeInput}
                    value={digit}
                    onChangeText={(text) => {
                      const newCode = [...verificationCode];
                      newCode[index] = text;
                      setVerificationCode(newCode);
                    }}
                    keyboardType="numeric"
                    maxLength={1}
                    selectTextOnFocus
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
                disabled={loading || !phone.trim()}
              >
                <Text style={styles.buttonText}>
                  {loading ? "처리 중..." : "나마스떼(नमस्ते, Namaste)"}
                </Text>
              </TouchableOpacity>

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
                    <Text style={styles.termsLink}>개인정보처리방침</Text>
                  </TouchableOpacity>
                  에 동의하게 됩니다.
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
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
    width: 900,
    height: 360,
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
    paddingBottom: 10,
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
