import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { useRoles } from "../../hooks/useRoles";
import { roleRootRoutes } from "../../navigation/roleRoot";
import { RootStackParamList } from "../../navigation/types";
import { Sheet } from "../ui/Sheet";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type RoleKey = "student" | "teacher";

const ROLE_META: Record<
  RoleKey,
  { label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }
> = {
  student: {
    label: "수련생",
    icon: "leaf-outline",
    desc: "수업을 신청하고 출석, 기록을 관리해요. 선생님과 요가톡으로 대화할 수 있어요.",
  },
  teacher: {
    label: "선생님",
    icon: "school-outline",
    desc: "요가원을 만들어 클래스, 수련생, 수업권을 관리해요. (요가원을 만들면 원장)",
  },
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function RoleSheet({ visible, onClose }: Props) {
  const navigation = useNavigation<Nav>();
  const { roles, activeRole, addRole, setActiveRole } = useRoles();
  const [busy, setBusy] = useState<RoleKey | null>(null);

  const goToMode = (role: RoleKey) => {
    navigation.reset({
      index: 0,
      routes: roleRootRoutes(role === "teacher"),
    });
  };

  const switchTo = async (role: RoleKey) => {
    setBusy(role);
    try {
      await setActiveRole(role);
      onClose();
      goToMode(role);
    } finally {
      setBusy(null);
    }
  };

  const add = async (role: RoleKey) => {
    setBusy(role);
    try {
      const ok = await addRole(role);
      if (!ok) {
        Alert.alert(
          "역할을 추가하지 못했어요",
          "다시 로그인한 뒤 시도해 주세요.",
        );
        return;
      }
      await setActiveRole(role);
      onClose();
      goToMode(role);
    } finally {
      setBusy(null);
    }
  };

  const renderCard = (role: RoleKey) => {
    const has = roles.includes(role);
    const isActive = activeRole === role;
    const meta = ROLE_META[role];
    return (
      <View
        key={role}
        style={[styles.card, isActive && styles.cardActive]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: isActive ? COLORS.primary : COLORS.surfaceDark },
          ]}
        >
          <Ionicons
            name={meta.icon}
            size={20}
            color={isActive ? COLORS.white : COLORS.primary}
          />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{meta.label}</Text>
            {isActive ? (
              <View style={styles.currentChip}>
                <Text style={styles.currentChipText}>현재</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.cardDesc}>{meta.desc}</Text>
        </View>
        {isActive ? null : has ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => switchTo(role)}
            disabled={busy !== null}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>
              {busy === role ? "…" : "전환"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnAdd]}
            onPress={() => add(role)}
            disabled={busy !== null}
            activeOpacity={0.85}
          >
            <Text style={[styles.actionBtnText, styles.actionBtnAddText]}>
              {busy === role ? "…" : "추가"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="역할"
      description="수련생과 선생님 역할을 전환하거나 추가할 수 있어요. 한 계정으로 둘 다 가능합니다."
    >
      <View style={styles.list}>
        {renderCard("student")}
        {renderCard("teacher")}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: SPACING.sm, paddingBottom: SPACING.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  cardActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(139, 92, 246, 0.06)",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 3 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  currentChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  currentChipText: { color: COLORS.white, fontSize: 10, fontWeight: "800" },
  cardDesc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 17 },
  actionBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceDark,
  },
  actionBtnText: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  actionBtnAdd: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionBtnAddText: { color: COLORS.white },
});
