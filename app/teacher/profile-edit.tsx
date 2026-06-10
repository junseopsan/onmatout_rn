import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FabButton } from "../../components/ui/FabButton";
import { FormHeader } from "../../components/ui/FormHeader";
import { PillInput } from "../../components/ui/PillInput";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import { useAuth } from "../../hooks/useAuth";
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TeacherProfileEditScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studioName, setStudioName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [cancellation, setCancellation] = useState("24");

  useEffect(() => {
    let mounted = true;
    if (!user?.id) return;
    teacherApi
      .getMyTeacherProfile(user.id)
      .then((p) => {
        if (!mounted) return;
        if (p) {
          setStudioName(p.studio_name ?? "");
          setBio(p.bio ?? "");
          setLocation(p.location ?? "");
          setCancellation(String(p.cancellation_hours_before ?? 24));
        }
      })
      .catch(() => undefined)
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const submit = async () => {
    if (!user?.id) return;
    const c = parseInt(cancellation, 10);
    if (!Number.isFinite(c) || c < 0) {
      Alert.alert("입력 확인", "취소 가능 시간을 0 이상 정수로 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await teacherApi.upsertTeacherProfile({
        userId: user.id,
        studio_name: studioName.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        cancellation_hours_before: c,
      });
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
      <FormHeader title="선생님 프로필" onClose={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.form}>
          <PillInput
            label="요가원 이름"
            value={studioName}
            onChangeText={setStudioName}
            placeholder="예: 온매트 요가원"
          />
          <PillInput
            label="소개"
            value={bio}
            onChangeText={setBio}
            placeholder="예: 하타요가 / 정렬 위주 수업"
            multiline
          />
          <PillInput
            label="위치"
            value={location}
            onChangeText={setLocation}
            placeholder="예: 서울 강남구"
          />
          <PillInput
            label="수련생 셀프 취소 가능 시간"
            value={cancellation}
            onChangeText={setCancellation}
            placeholder="24"
            keyboardType="numeric"
            hint="수업 시작 N시간 전까지 수련생이 직접 취소할 수 있어요."
          />
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.fabWrap}>
        <FabButton
          label={submitting ? "저장 중..." : "저장"}
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
  form: {
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  fabWrap: {
    position: "absolute",
    right: SPACING.lg,
    bottom: SPACING.xl,
  },
});
