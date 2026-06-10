import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useStudentStudios } from "../../hooks/useStudentStudios";
import { haptics } from "../../lib/haptics";
import { RootStackParamList } from "../../navigation/types";
import { Sheet } from "../ui/Sheet";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function StudentStudioSwitcher() {
  const navigation = useNavigation<Nav>();
  const {
    memberships,
    activeStudentProfileId,
    activeStudio,
    setActiveProfile,
    loaded,
  } = useStudentStudios();
  const [open, setOpen] = useState(false);

  if (!loaded) return null;
  if (memberships.length === 0) return null;

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
        {memberships.length > 1 ? (
          <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
        ) : null}
      </TouchableOpacity>

      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title="등록된 요가원"
      >
        <View style={styles.list}>
          {memberships.map((m) => {
            const isActive = m.studentProfileId === activeStudentProfileId;
            return (
              <TouchableOpacity
                key={m.studentProfileId}
                onPress={async () => {
                  haptics.select();
                  await setActiveProfile(m.studentProfileId);
                  setOpen(false);
                }}
                style={[styles.row, isActive && styles.rowActive]}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isActive ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={isActive ? COLORS.primary : COLORS.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {m.studio.name}
                  </Text>
                  {m.studio.location ? (
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {m.studio.location}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setOpen(false);
            navigation.navigate(
              "AuthMatch" as never,
              { title: "요가원 등록" } as never,
            );
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={16} color={COLORS.primary} />
          <Text style={styles.addBtnText}>다른 요가원</Text>
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
  list: { marginBottom: SPACING.md },
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
    marginBottom: SPACING.sm,
  },
  rowActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(139, 92, 246, 0.08)",
  },
  rowName: { ...TEXT.bodyMed, color: COLORS.text },
  rowSub: { ...TEXT.caption, color: COLORS.textSecondary, marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: SPACING.md,
    backgroundColor: "rgba(139, 92, 246, 0.10)",
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.35)",
  },
  addBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
});
