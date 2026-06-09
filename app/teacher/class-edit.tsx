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
import { FabButton } from "../../components/ui/FabButton";
import { FormHeader } from "../../components/ui/FormHeader";
import { PillInput } from "../../components/ui/PillInput";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "TeacherClassEdit">;

export default function TeacherClassEditScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { classId } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let mounted = true;
    teacherApi
      .getClass(classId)
      .then((c) => {
        if (!mounted) return;
        setTitle(c.title);
        setDescription(c.description ?? "");
        setLocation(c.location ?? "");
        setCapacity(c.capacity ? String(c.capacity) : "");
        setIsActive(c.is_active);
      })
      .catch((e) => console.warn("[ClassEdit] load failed", e))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [classId]);

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert("입력 확인", "클래스 이름을 입력해 주세요.");
      return;
    }
    const cap = capacity.trim() ? parseInt(capacity.trim(), 10) : null;
    setSubmitting(true);
    try {
      await teacherApi.updateClass(classId, {
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        capacity: cap && cap > 0 ? cap : null,
        is_active: isActive,
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
      <FormHeader title="클래스 수정" onClose={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.form}>
          <PillInput label="이름" value={title} onChangeText={setTitle} />
          <PillInput
            label="설명"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="예: 느린 호흡과 정렬 위주 90분"
          />
          <PillInput
            label="위치"
            value={location}
            onChangeText={setLocation}
            placeholder="예: 온매트 스튜디오 A룸"
          />
          <PillInput
            label="정원"
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="numeric"
            placeholder="예: 10"
          />

          <View style={styles.switchCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>활성</Text>
              <Text style={styles.switchHint}>
                비활성 클래스는 새 회원 배정, 출석 체크에서 제외돼요.
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ true: COLORS.primary, false: COLORS.border }}
            />
          </View>

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
  form: { padding: SPACING.xl, paddingTop: SPACING.lg },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  switchTitle: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  switchHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  fabWrap: { position: "absolute", right: SPACING.lg, bottom: SPACING.xl },
});
