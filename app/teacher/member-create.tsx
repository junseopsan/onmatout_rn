import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { PillInput } from "../../components/ui/PillInput";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { useAuth } from "../../hooks/useAuth";
import { usePivotStudios } from "../../hooks/usePivotStudios";
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";
import type { StudentProfile } from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TeacherMemberCreateScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { activeStudio } = usePivotStudios();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneConsent, setPhoneConsent] = useState(false);
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<StudentProfile | null>(
    null,
  );

  const phoneTrimmed = phone.replace(/[^0-9]/g, "");
  const phoneProvided = phoneTrimmed.length > 0;
  const phoneValid = !phoneProvided || phoneTrimmed.length >= 9;
  const phoneConsentNeeded = phoneProvided && !phoneConsent;

  const canSubmit =
    name.trim().length > 0 && phoneValid && !phoneConsentNeeded && !submitting;

  const handleSubmit = async () => {
    if (!user?.id || !canSubmit) return;
    setSubmitting(true);
    try {
      const created = await teacherApi.createStudent({
        teacher_id: user.id,
        studio_id: activeStudio?.id ?? null,
        name: name.trim(),
        phone: phoneProvided ? formatPhone(phoneTrimmed) : null,
        phone_consent_at: phoneProvided ? new Date().toISOString() : null,
        memo: memo.trim() || null,
        invite_code: "",
      } as any);
      setCreatedStudent(created);
    } catch (e: any) {
      Alert.alert("등록 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareInvite = async (student: StudentProfile) => {
    try {
      await Share.share({
        message: `${student.name}님, 온매트아웃에서 함께해요 🧘\n\n초대 코드: ${student.invite_code}\n앱에서 가입 후 코드를 입력하시면 연결됩니다.`,
      });
    } catch {
      // canceled
    }
  };

  if (createdStudent) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DetailHeader
          title="등록 완료"
          serif={false}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.successWrap}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>{createdStudent.name} 님 등록</Text>
          <Text style={styles.successSubtitle}>
            초대 코드를 카톡/메시지로 보내 가입을 유도하세요.
          </Text>

          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>초대 코드</Text>
            <Text style={styles.codeValue}>{createdStudent.invite_code}</Text>
          </View>

          <Button
            title="📤 카톡 / 메시지로 공유"
            size="large"
            onPress={() => handleShareInvite(createdStudent)}
          />

          <View style={styles.secondaryRow}>
            <Button
              title="수련생 더 등록"
              variant="secondary"
              size="medium"
              style={{ flex: 1 }}
              onPress={() => {
                setCreatedStudent(null);
                setName("");
                setPhone("");
                setPhoneConsent(false);
                setMemo("");
              }}
            />
            <Button
              title="수련생 목록"
              variant="secondary"
              size="medium"
              style={{ flex: 1 }}
              onPress={() => navigation.goBack()}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        title="수련생 등록"
        serif={false}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.form}>
          <PillInput
            label="이름"
            required
            value={name}
            onChangeText={setName}
            placeholder="예: 김미정"
          />
          <PillInput
            label="전화번호"
            value={phone}
            onChangeText={setPhone}
            placeholder="010-1234-5678"
            keyboardType="phone-pad"
            error={!phoneValid ? "전화번호 형식을 확인해 주세요." : undefined}
          />

          {phoneProvided ? (
            <View style={styles.consentRow}>
              <Switch
                value={phoneConsent}
                onValueChange={setPhoneConsent}
                trackColor={{ true: COLORS.primary, false: COLORS.border }}
              />
              <Text style={styles.consentText}>
                수련생의 동의를 받고 전화번호를 입력합니다.
              </Text>
            </View>
          ) : null}

          <PillInput
            label="메모"
            value={memo}
            onChangeText={setMemo}
            placeholder="예: 오십견 회복 중 — 어깨 무리 X"
            multiline
          />

          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              💡 등록 시{" "}
              <Text style={styles.noticeBold}>고유 초대 코드</Text>가 자동
              생성됩니다.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.submitWrap}>
        <Button
          title="수련생 등록"
          size="large"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!canSubmit}
        />
      </View>
    </SafeAreaView>
  );
}

function formatPhone(digits: string): string {
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  form: { padding: SPACING.xl, paddingTop: SPACING.lg },
  consentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.md,
    paddingHorizontal: 4,
  },
  consentText: { color: COLORS.text, fontSize: 13, flex: 1 },
  notice: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  noticeText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  noticeBold: { color: COLORS.text, fontWeight: "600" },
  submitWrap: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    bottom: SPACING.lg,
  },

  // 성공 화면
  successWrap: { flex: 1, padding: SPACING.xl, paddingTop: SPACING.xxl },
  successEmoji: { fontSize: 64, textAlign: "center", marginBottom: SPACING.md },
  successTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  successSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: SPACING.xxl,
  },
  codeCard: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.xl,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    alignItems: "center",
  },
  codeLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.sm,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  codeValue: {
    color: COLORS.primary,
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: 3,
  },
  secondaryRow: { flexDirection: "row", gap: SPACING.md, marginTop: SPACING.md },
});
