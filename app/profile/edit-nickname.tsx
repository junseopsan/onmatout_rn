import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { COLORS } from "../../constants/Colors";
import { useNotification } from "../../contexts/NotificationContext";
import { userAPI } from "../../lib/api/user";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";

export default function EditNicknameScreen() {
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, getUserProfile, saveUserProfile } = useAuthStore();
  const { showSnackbar, showDialog } = useNotification();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 현재 닉네임 로드
  React.useEffect(() => {
    const loadCurrentNickname = async () => {
      try {
        const profile = await getUserProfile();
        if (profile?.name) {
          setNickname(profile.name);
        }
        setIsLoaded(true);
      } catch (error) {
        setIsLoaded(true);
      }
    };

    loadCurrentNickname();
  }, [getUserProfile]);

  const handleNicknameChange = (text: string) => {
    // 한글 입력 조합을 방해하지 않도록 입력값을 그대로 저장
    setNickname(text);
    
    // 에러 메시지 초기화 (실시간 검증은 하지 않음)
    if (nicknameError) {
      setNicknameError("");
    }
  };

  const handleNicknameBlur = () => {
    // 포커스 해제 시 허용되지 않은 문자 제거 및 검증
    const sanitized = nickname.replace(/[^가-힣a-zA-Z0-9\s]/g, "");
    
    if (sanitized !== nickname) {
      setNickname(sanitized);
      setNicknameError("닉네임은 한글, 영문, 숫자만 사용 가능합니다.");
    } else if (nickname.trim() && nickname.trim().length < 2) {
      setNicknameError("닉네임은 2자 이상이어야 합니다.");
    } else if (nickname.trim().length > 15) {
      setNicknameError("닉네임은 15자 이하여야 합니다.");
    } else if (nickname.trim() && !/^[가-힣a-zA-Z0-9\s]*$/.test(nickname.trim())) {
      setNicknameError("닉네임은 한글, 영문, 숫자만 사용 가능합니다.");
    } else {
      setNicknameError("");
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      setNicknameError("닉네임을 입력해주세요.");
      return;
    }

    if (nicknameError) {
      return;
    }

    setLoading(true);

    try {
      // 현재 사용자의 기존 닉네임과 동일한지 확인
      const currentProfile = await getUserProfile();
      const isSameNickname =
        currentProfile?.name?.toLowerCase() === nickname.trim().toLowerCase();

      // 닉네임이 변경된 경우에만 중복 확인
      if (!isSameNickname) {
        const duplicateCheck = await userAPI.checkNicknameDuplicate(
          nickname.trim(),
          user?.id
        );

        if (!duplicateCheck.success) {
          setNicknameError(
            duplicateCheck.message || "닉네임 확인 중 오류가 발생했습니다."
          );
          setLoading(false);
          return;
        }

        if (duplicateCheck.isDuplicate) {
          setNicknameError("이미 사용 중인 닉네임입니다.");
          setLoading(false);
          return;
        }
      }

      const result = await saveUserProfile(nickname.trim());

      if (result) {
        // 개인정보 화면으로 돌아간 후 스낵바 표시
        navigation.goBack();
        setTimeout(() => {
          showSnackbar("닉네임이 성공적으로 변경되었습니다.", "success");
        }, 100);
      } else {
        showSnackbar("닉네임 변경에 실패했습니다.", "error");
      }
    } catch (error) {
      showSnackbar("닉네임 변경 중 오류가 발생했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>닉네임 변경</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>닉네임</Text>
            {isLoaded ? (
              <Input
                value={nickname}
                onChangeText={handleNicknameChange}
                onBlur={handleNicknameBlur}
                placeholder="닉네임을 입력해주세요."
                error={nicknameError}
                // 닉네임 입력창은 placeholder/텍스트 간격을 기본값(0)에 가깝게 유지
                inputStyle={{ letterSpacing: 0 }}
              />
            ) : (
              <View style={styles.loadingInput}>
                <Text style={styles.loadingText}>닉네임을 불러오는 중...</Text>
              </View>
            )}
            <Text style={styles.characterCount}>{nickname.length}/15</Text>
          </View>

          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>닉네임 가이드라인</Text>
            <Text style={styles.guidelinesText}>
              • 2자 이상 15자 이하로 입력해주세요
            </Text>
            <Text style={styles.guidelinesText}>
              • 한글, 영문, 숫자만 사용 가능합니다
            </Text>
            <Text style={styles.guidelinesText}>
              • 특수문자나 이모지는 사용할 수 없습니다
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.buttonContainer}>
        <Button
          title="저장"
          onPress={handleSave}
          loading={loading}
          disabled={!nickname.trim() || !!nicknameError}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60, // 상태바 높이 + 여백
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  placeholder: {
    width: 40, // 뒤로가기 버튼과 같은 크기로 균형 맞춤
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formContainer: {
    paddingTop: 32,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "right",
    marginTop: 4,
  },
  guidelines: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  loadingInput: {
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
