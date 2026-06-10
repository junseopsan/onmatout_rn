import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { Button } from "../../components/ui/Button";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { usePivotStudios } from "../../hooks/usePivotStudios";
import { pivotStudioApi } from "../../lib/api/pivotStudio";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "TeacherStudioForm">;

export default function TeacherStudioFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { studioId } = route.params ?? { studioId: undefined };
  const editing = !!studioId;
  const { createStudio, updateStudioLocal, setActiveStudio, reloadStudios } =
    usePivotStudios();

  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [kakao, setKakao] = useState("");
  const [description, setDescription] = useState("");
  const [policy, setPolicy] = useState("");
  const [pricing, setPricing] = useState("");

  useEffect(() => {
    if (!editing || !studioId) return;
    let mounted = true;
    (async () => {
      try {
        const s = await pivotStudioApi.getStudio(studioId);
        if (mounted && s) {
          setName(s.name);
          setLocation(s.location ?? "");
          setPhone(s.phone ?? "");
          setHours(s.hours_text ?? "");
          setWebsite(s.website_url ?? "");
          setInstagram(s.instagram_url ?? "");
          setKakao(s.kakao_url ?? "");
          setDescription(s.description ?? "");
          setPolicy(s.policy_text ?? "");
          setPricing(s.pricing_text ?? "");
        }
      } catch (e) {
        console.warn("[StudioForm] load failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [editing, studioId]);

  const canSubmit = name.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        location: location.trim() || null,
        phone: phone.trim() || null,
        hours_text: hours.trim() || null,
        website_url: website.trim() || null,
        instagram_url: instagram.trim() || null,
        kakao_url: kakao.trim() || null,
        description: description.trim() || null,
        policy_text: policy.trim() || null,
        pricing_text: pricing.trim() || null,
      };
      if (editing && studioId) {
        const updated = await pivotStudioApi.updateStudio(studioId, payload);
        updateStudioLocal(updated);
        Alert.alert("저장 완료", "요가원 정보를 업데이트했어요.");
        navigation.goBack();
      } else {
        const created = await createStudio(payload);
        if (created) {
          await setActiveStudio(created);
          await reloadStudios();
          Alert.alert(
            "요가원 추가 완료",
            `${created.name} 으로 활성 요가원을 전환했어요.`,
          );
          navigation.goBack();
        }
      }
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DetailHeader
          onBack={() => navigation.goBack()}
          title={editing ? "요가원 정보" : "새 요가원"}
        />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title={editing ? "요가원 정보" : "새 요가원"}
        trailing={{
          kind: "text",
          label: submitting ? "저장 중…" : "저장",
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
          <SectionLabel>기본 정보</SectionLabel>
          <Field
            label="상호명 *"
            placeholder="예) 시바난다 요가 강남"
            value={name}
            onChangeText={setName}
            required
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
          <Field
            label="인스타그램"
            placeholder="https://instagram.com/..."
            value={instagram}
            onChangeText={setInstagram}
            autoCapitalize="none"
            keyboardType="url"
          />
          <Field
            label="카카오톡 문의"
            placeholder="https://pf.kakao.com/... 또는 open.kakao.com/..."
            value={kakao}
            onChangeText={setKakao}
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

          <View style={{ height: SPACING.lg }} />
          <SectionLabel>등록 / 예약 안내 (선택)</SectionLabel>
          <Field
            label="등록 · 예약 안내"
            placeholder={
              "수련생이 보게 될 등록/예약 정책을 적어주세요.\n예) 모든 수련은 예약제, 당일 취소·변경 불가, 보강은 수련 3시간 전 연락 시 차주 가능 등"
            }
            value={policy}
            onChangeText={setPolicy}
            multiline
          />
          <Field
            label="수업권 가격 안내"
            placeholder={
              "수업권 종류와 가격을 적어주세요.\n예) 10회권 25만원 (사용기한 3개월), 1회권 36,000원"
            }
            value={pricing}
            onChangeText={setPricing}
            multiline
          />

          <Button
            title={editing ? "변경 저장" : "요가원 추가"}
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
            size="large"
            style={{ marginTop: SPACING.lg }}
          />

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
  required,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  required?: boolean;
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
  field: { marginBottom: SPACING.md },
  fieldLabel: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
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
});
