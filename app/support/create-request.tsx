import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import { supportAPI } from "../../lib/api/support";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES = [
  { value: "bug", label: "버그 신고", icon: "bug-outline" },
  { value: "feature", label: "기능 제안", icon: "bulb-outline" },
  { value: "question", label: "문의사항", icon: "help-circle-outline" },
  { value: "other", label: "기타", icon: "ellipsis-horizontal-outline" },
] as const;

export default function CreateSupportRequestScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { user: authUser } = useAuthStore();
  const { showSnackbar } = useNotification();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<
    "bug" | "feature" | "question" | "other"
  >("other");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 버튼 활성화 조건
  const isFormValid =
    title.trim().length > 0 && content.trim().length >= 10 && !isSubmitting;

  const handleSubmit = async () => {
    if (!title.trim()) {
      showSnackbar("제목을 입력해주세요.", "warning");
      return;
    }

    if (!content.trim()) {
      showSnackbar("내용을 입력해주세요.", "warning");
      return;
    }

    if (content.trim().length < 10) {
      showSnackbar("내용을 10자 이상 입력해주세요.", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = authUser?.id || user?.id;
      const result = await supportAPI.createSupportRequest(
        {
          title: title.trim(),
          content: content.trim(),
          category,
        },
        userId
      );

      if (result.success) {
        showSnackbar("건의사항이 등록되었습니다.", "success");
        navigation.goBack();
      } else {
        showSnackbar(
          result.message || "건의사항 등록에 실패했습니다.",
          "error"
        );
      }
    } catch (error) {
      showSnackbar("건의사항 등록 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>고객지원</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          {/* 카테고리 선택 */}
          <View style={styles.section}>
            <Text style={styles.label}>카테고리</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    category === cat.value && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Ionicons
                    name={cat.icon}
                    size={20}
                    color={
                      category === cat.value
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat.value && styles.categoryTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 제목 입력 */}
          <View style={styles.section}>
            <Text style={styles.label}>제목</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="제목을 입력해주세요"
              placeholderTextColor={COLORS.textSecondary}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          {/* 내용 입력 */}
          <View style={styles.section}>
            <Text style={styles.label}>내용</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="건의사항을 자세히 입력해주세요 (최소 10자)"
              placeholderTextColor={COLORS.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.charCount}>
              {content.length}/2000 (최소 10자)
            </Text>
          </View>

          {/* 제출 버튼 */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              !isFormValid && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={[
                  styles.submitButtonText,
                  !isFormValid && styles.submitButtonTextDisabled,
                ]}
              >
                등록하기
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
    paddingTop: 60,
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
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formContainer: {
    paddingVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary + "20",
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  titleInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contentInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 200,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "right",
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.surface,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  submitButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
});
