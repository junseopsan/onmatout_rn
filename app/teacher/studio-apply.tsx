import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { usePivotStudios } from "../../hooks/usePivotStudios";
import { useRoles } from "../../hooks/useRoles";
import { pivotStudioApi } from "../../lib/api/pivotStudio";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TeacherStudioApplyScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { reloadRoles, setActiveRole } = useRoles();
  const { reloadStudios } = usePivotStudios();

  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  const canSubmit = name.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!user?.id || !canSubmit) return;
    setSubmitting(true);
    try {
      const result = await pivotStudioApi.applyForStudio({
        applicantUserId: user.id,
        name: name.trim(),
        location: location.trim() || null,
        phone: phone.trim() || null,
        hours_text: hours.trim() || null,
        website_url: website.trim() || null,
        description: description.trim() || null,
      });

      // 자동승인 트리거가 동작했다면 status=auto_approved + studio_id 가 채워짐
      if (result.status === "auto_approved" && result.studio_id) {
        // 역할 + 요가원 새로 불러오기
        await reloadRoles();
        await reloadStudios();
        await setActiveRole("teacher");

        Alert.alert(
          "신청 완료",
          "요가원이 자동 승인됐어요. 선생님(원장) 모드로 전환합니다.",
          [
            {
              text: "확인",
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "TeacherTabNavigator" }],
                });
              },
            },
          ],
        );
      } else {
        Alert.alert(
          "신청 접수",
          "신청이 접수됐어요. 검토 후 결과를 알려드릴게요.",
          [{ text: "확인", onPress: () => navigation.goBack() }],
        );
      }
    } catch (e: any) {
      Alert.alert("신청 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title="요가원 등록 신청"
        trailing={{
          kind: "text",
          label: submitting ? "신청 중…" : "신청",
          tone: "primary",
          onPress: handleSubmit,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SurfaceCard style={styles.intro}>
            <Text style={styles.introTitle}>한 번의 신청으로 원장이 되세요</Text>
            <Text style={styles.introText}>
              요가원 정보를 입력하면 자동으로 승인돼요. 승인 후엔 선생님 모드에서
              클래스를 만들고 수련생을 등록할 수 있어요.
            </Text>
          </SurfaceCard>

          <SectionLabel>기본 정보</SectionLabel>
          <Field
            label="상호명 *"
            placeholder="예) 시바난다 요가 강남"
            value={name}
            onChangeText={setName}
          />
          <Field
            label="주소"
            placeholder="예) 서울 강남구 테헤란로 ..."
            value={location}
            onChangeText={setLocation}
          />

          <View style={{ height: SPACING.lg }} />
          <SectionLabel>연락, 운영</SectionLabel>
          <Field
            label="연락처"
            placeholder="02-1234-5678 또는 010-..."
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Field
            label="운영 시간"
            placeholder="예) 평일 07:00 - 22:00 / 주말 09:00 - 18:00"
            value={hours}
            onChangeText={setHours}
            multiline
          />
          <Field
            label="홈페이지"
            placeholder="https://..."
            value={website}
            onChangeText={setWebsite}
            autoCapitalize="none"
            keyboardType="url"
          />

          <View style={{ height: SPACING.lg }} />
          <SectionLabel>소개 (선택)</SectionLabel>
          <Field
            label="소개"
            placeholder="요가원의 분위기, 수업 컨셉 등을 짧게 적어주세요."
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && { opacity: 0.5 }]}
            disabled={!canSubmit}
            onPress={handleSubmit}
            activeOpacity={0.9}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? "신청 중…" : "요가원 등록 신청"}
            </Text>
          </TouchableOpacity>

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  multiline,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad" | "url" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        style={[styles.input, multiline && styles.inputMulti]}
        multiline={multiline}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  intro: { marginBottom: SPACING.lg },
  introTitle: { ...TEXT.bodyMed, color: COLORS.text, marginBottom: 4 },
  introText: { ...TEXT.caption, color: COLORS.textSecondary, lineHeight: 20 },
  field: { marginBottom: SPACING.md },
  fieldLabel: { ...TEXT.caption, color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    color: COLORS.text,
    ...TEXT.body,
  },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },
  submitBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    alignItems: "center",
  },
  submitBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
});
