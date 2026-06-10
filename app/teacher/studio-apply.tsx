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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  DetailHeader,
  PillInput,
  SurfaceCard,
} from "../../components/ui";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
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
        Alert.alert("신청 접수", "신청이 접수됐어요. 검토 후 결과를 알려드릴게요.", [
          { text: "확인", onPress: () => navigation.goBack() },
        ]);
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
        serif={false}
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

          <PillInput
            label="상호명"
            required
            placeholder="상호명을 입력해주세요"
            value={name}
            onChangeText={setName}
          />
          <PillInput
            label="주소"
            placeholder="주소를 입력해주세요"
            value={location}
            onChangeText={setLocation}
          />
          <PillInput
            label="연락처"
            placeholder="연락처를 입력해주세요"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <PillInput
            label="운영 시간"
            placeholder="운영 시간을 입력해주세요"
            value={hours}
            onChangeText={setHours}
            multiline
          />
          <PillInput
            label="홈페이지"
            placeholder="홈페이지 주소를 입력해주세요"
            value={website}
            onChangeText={setWebsite}
            autoCapitalize="none"
            keyboardType="url"
          />
          <PillInput
            label="소개"
            placeholder="요가원 소개를 입력해주세요"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.hint}>
            상세 정보(운영시간, 대표사진, 수업권 등)는 승인 후 요가원 정보에서 편집할
            수 있어요.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.submitWrap}>
        <Button
          title="요가원 등록 신청"
          size="large"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!canSubmit}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 120,
  },
  intro: { marginBottom: SPACING.lg },
  introTitle: { ...TEXT.bodyMed, color: COLORS.text, marginBottom: 4 },
  introText: { ...TEXT.caption, color: COLORS.textSecondary, lineHeight: 20 },
  hint: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
    lineHeight: 18,
  },
  submitWrap: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    bottom: SPACING.lg,
  },
});
