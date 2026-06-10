import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/Colors";
import { useRoles } from "../hooks/useRoles";
import { RootStackParamList } from "../navigation/types";
import type { UserRole } from "../types/role";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface RoleOption {
  role: UserRole;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
}

const OPTIONS: RoleOption[] = [
  {
    role: "teacher",
    emoji: "🧘‍♀️",
    title: "선생님으로 시작",
    subtitle: "수련생과 클래스를 관리하고 싶어요",
    description: "수련생 등록, 출석 체크, 복습 시퀀스 공유",
  },
  {
    role: "student",
    emoji: "📒",
    title: "수련생으로 시작",
    subtitle: "선생님과 연결되어 수업을 듣고 있어요",
    description: "출석, 잔여 횟수, 복습 시퀀스 확인",
  },
];

export default function RoleSelectScreen() {
  const navigation = useNavigation<Nav>();
  const { addRole, setActiveRole } = useRoles();
  const [submitting, setSubmitting] = useState<UserRole | null>(null);

  const handleSelect = async (role: UserRole) => {
    if (submitting) return;
    setSubmitting(role);
    try {
      const ok = await addRole(role);
      if (!ok) {
        Alert.alert("잠시 후 다시 시도해 주세요", "역할을 저장하지 못했어요.");
        return;
      }
      await setActiveRole(role);
      navigation.reset({
        index: 0,
        routes: [
          {
            name: role === "teacher" ? "TeacherTabNavigator" : "TabNavigator",
          },
        ],
      });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>어떻게 시작할까요?</Text>
          <Text style={styles.subtitle}>
            나중에 다른 역할도 추가할 수 있어요.
          </Text>
        </View>

        <View style={styles.options}>
          {OPTIONS.map((opt) => {
            const isLoading = submitting === opt.role;
            const disabled = submitting !== null && !isLoading;
            return (
              <TouchableOpacity
                key={opt.role}
                style={[styles.card, disabled && styles.cardDisabled]}
                onPress={() => handleSelect(opt.role)}
                activeOpacity={0.85}
                disabled={disabled}
              >
                <Text style={styles.emoji}>{opt.emoji}</Text>
                <Text style={styles.cardTitle}>{opt.title}</Text>
                <Text style={styles.cardSubtitle}>{opt.subtitle}</Text>
                <Text style={styles.cardDescription}>{opt.description}</Text>
                {isLoading ? (
                  <ActivityIndicator
                    color={COLORS.primary}
                    style={styles.loader}
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.footnote}>
          선생님 + 수련생 둘 다 사용하시려면, 먼저 한 가지로 시작하고 설정에서
          역할을 추가할 수 있어요.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 32 },
  header: { marginBottom: 32 },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  options: { gap: 16, flex: 1 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardDisabled: { opacity: 0.5 },
  emoji: { fontSize: 36, marginBottom: 12 },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardSubtitle: {
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 8,
  },
  cardDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  loader: { marginTop: 12 },
  footnote: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 16,
  },
});
