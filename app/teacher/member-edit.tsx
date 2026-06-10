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
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { PillInput } from "../../components/ui/PillInput";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "TeacherMemberEdit">;

type Status = "active" | "paused" | "archived";
type StatusMode = "active" | "paused" | "custom";

const STATUS_OPTIONS: { value: StatusMode; label: string; color: string }[] = [
  { value: "active", label: "수련중", color: COLORS.success },
  { value: "paused", label: "휴식중", color: COLORS.warning },
  { value: "custom", label: "커스텀", color: COLORS.primary },
];

export default function TeacherMemberEditScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { studentProfileId } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneConsent, setPhoneConsent] = useState(false);
  const [memo, setMemo] = useState("");
  const [, setStatus] = useState<Status>("active");
  const [statusMode, setStatusMode] = useState<StatusMode>("active");
  const [customStatus, setCustomStatus] = useState("");
  const [originalPhone, setOriginalPhone] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    teacherApi
      .getStudent(studentProfileId)
      .then((s) => {
        if (!mounted) return;
        setName(s.name);
        setPhone(s.phone ?? "");
        setOriginalPhone(s.phone);
        setPhoneConsent(!!s.phone_consent_at);
        setMemo(s.memo ?? "");
        setStatus(s.status as Status);
        const cs = (s as any).custom_status as string | null;
        if (cs && cs.trim()) {
          setStatusMode("custom");
          setCustomStatus(cs);
        } else {
          setStatusMode(s.status === "active" ? "active" : "paused");
        }
      })
      .catch((e) => console.warn("[MemberEdit] load failed", e))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [studentProfileId]);

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert("입력 확인", "이름을 입력해 주세요.");
      return;
    }
    const phoneTrimmed = phone.trim();
    if (phoneTrimmed && !phoneConsent) {
      Alert.alert(
        "동의 확인",
        "전화번호를 저장하려면 수련생의 동의 체크가 필요해요.",
      );
      return;
    }
    let finalStatus: Status;
    let finalCustom: string | null = null;
    if (statusMode === "active") {
      finalStatus = "active";
    } else if (statusMode === "paused") {
      finalStatus = "paused";
    } else {
      // 커스텀
      const t = customStatus.trim();
      if (!t) {
        Alert.alert("입력 확인", "커스텀 상태 텍스트를 입력해 주세요.");
        return;
      }
      finalStatus = "paused";
      finalCustom = t;
    }
    setSubmitting(true);
    try {
      const phoneChanged = phoneTrimmed !== (originalPhone ?? "");
      await teacherApi.updateStudent(studentProfileId, {
        name: name.trim(),
        phone: phoneTrimmed || null,
        phone_consent_at: phoneTrimmed
          ? phoneChanged
            ? new Date().toISOString()
            : undefined
          : null,
        memo: memo.trim() || null,
        status: finalStatus,
        custom_status: finalCustom,
      } as any);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("저장 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        title="수련생 정보 수정"
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
          />
          <PillInput
            label="전화번호"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="010-1234-5678"
          />
          {phone.trim() ? (
            <View style={styles.consentRow}>
              <Switch
                value={phoneConsent}
                onValueChange={setPhoneConsent}
                trackColor={{ true: COLORS.primary, false: COLORS.border }}
              />
              <Text style={styles.consentText}>
                수련생의 동의를 받고 전화번호를 저장합니다.
              </Text>
            </View>
          ) : null}
          <PillInput
            label="메모"
            value={memo}
            onChangeText={setMemo}
            multiline
            placeholder="예: 오십견 회복 중 — 어깨 무리 X"
          />

          <Text style={styles.label}>상태</Text>
          <View style={styles.chipsRow}>
            {STATUS_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                color={opt.color}
                active={statusMode === opt.value}
                onPress={() => setStatusMode(opt.value)}
              />
            ))}
          </View>
          {statusMode === "custom" ? (
            <View style={{ marginTop: SPACING.sm }}>
              <PillInput
                value={customStatus}
                onChangeText={setCustomStatus}
                placeholder="예: 해외 체류, 부상 회복중 등"
                maxLength={20}
              />
            </View>
          ) : null}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.submitWrap}>
        <Button
          title="저장"
          size="large"
          onPress={submit}
          loading={submitting}
          disabled={submitting}
        />
      </View>
    </SafeAreaView>
  );
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
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  chipsRow: { flexDirection: "row", gap: SPACING.sm, flexWrap: "wrap" },
  submitWrap: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    bottom: SPACING.lg,
  },
});
