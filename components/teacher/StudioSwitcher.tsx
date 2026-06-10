import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { usePivotStudios } from "../../hooks/usePivotStudios";
import { haptics } from "../../lib/haptics";
import { RootStackParamList } from "../../navigation/types";
import { Sheet } from "../ui/Sheet";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function StudioSwitcher() {
  const navigation = useNavigation<Nav>();
  const { studios, activeStudio, setActiveStudio, isDirectorOfActive, loaded } =
    usePivotStudios();
  const [open, setOpen] = useState(false);

  if (!loaded) return null;

  const label = activeStudio?.name ?? "요가원 선택";

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        style={styles.pill}
      >
        <Ionicons name="storefront-outline" size={14} color={COLORS.text} />
        <Text style={styles.pillLabel} numberOfLines={1}>
          {label}
        </Text>
        {activeStudio ? (
          <View
            style={[
              styles.roleBadge,
              isDirectorOfActive ? styles.roleBadgeDirector : styles.roleBadgeTeacher,
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                isDirectorOfActive
                  ? { color: COLORS.primary }
                  : { color: COLORS.textSecondary },
              ]}
            >
              {isDirectorOfActive ? "원장" : "선생님"}
            </Text>
          </View>
        ) : null}
        <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title="요가원 선택"
        description="활성 요가원의 클래스, 수련생, 시퀀스만 보입니다."
      >
        <View style={{ gap: SPACING.sm, marginBottom: SPACING.md }}>
          {studios.map((s) => {
            const isActive = activeStudio?.id === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={async () => {
                  haptics.select();
                  await setActiveStudio(s);
                  setOpen(false);
                }}
                style={[styles.row, isActive && styles.rowActive]}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isActive ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color={isActive ? COLORS.primary : COLORS.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{s.name}</Text>
                  {s.location ? (
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {s.location}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.manageBtn}
          onPress={() => {
            setOpen(false);
            navigation.navigate("TeacherStudioList");
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="settings-outline" size={16} color={COLORS.primary} />
          <Text style={styles.manageBtnText}>요가원 관리, 추가</Text>
          <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: "flex-start",
    maxWidth: 220,
  },
  pillLabel: {
    ...TEXT.captionMed,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    maxWidth: 140,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  roleBadgeDirector: {
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  roleBadgeTeacher: {
    backgroundColor: COLORS.surfaceDark,
    borderColor: COLORS.border,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceDark,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  rowActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(139, 92, 246, 0.08)",
  },
  rowName: { ...TEXT.bodyMed, color: COLORS.text },
  rowSub: { ...TEXT.caption, color: COLORS.textSecondary, marginTop: 2 },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: SPACING.md,
    backgroundColor: "rgba(139, 92, 246, 0.10)",
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.35)",
  },
  manageBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
});
