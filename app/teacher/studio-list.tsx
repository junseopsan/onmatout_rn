import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { usePivotStudios } from "../../hooks/usePivotStudios";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TeacherStudioListScreen() {
  const navigation = useNavigation<Nav>();
  const { studios, activeStudio, setActiveStudio, loading, reloadStudios } =
    usePivotStudios();

  useFocusEffect(
    useCallback(() => {
      reloadStudios();
    }, [reloadStudios]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title="내 요가원"
        trailing={{
          kind: "icon",
          icon: "add",
          onPress: () => navigation.navigate("TeacherStudioForm"),
        }}
      />

      {loading && studios.length === 0 ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : studios.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="아직 요가원이 없어요"
          description={
            "운영 중인 요가원 정보를 추가하면\n클래스, 회원, 시퀀스을 요가원 단위로 관리할 수 있어요."
          }
          action={{
            label: "+ 요가원 추가",
            onPress: () => navigation.navigate("TeacherStudioForm"),
          }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {studios.map((s) => {
            const isActive = activeStudio?.id === s.id;
            return (
              <SurfaceCard key={s.id} style={styles.card}>
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {s.name}
                    </Text>
                    {s.location ? (
                      <Text style={styles.location} numberOfLines={1}>
                        {s.location}
                      </Text>
                    ) : null}
                  </View>
                  {isActive ? (
                    <View style={styles.activeBadge}>
                      <Ionicons name="checkmark" size={12} color={COLORS.primary} />
                      <Text style={styles.activeBadgeText}>활성</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.metaRow}>
                  {s.phone ? (
                    <Meta icon="call-outline" text={s.phone} />
                  ) : null}
                  {s.hours_text ? (
                    <Meta icon="time-outline" text={s.hours_text} />
                  ) : null}
                  {s.website_url ? (
                    <Meta icon="globe-outline" text={s.website_url} />
                  ) : null}
                </View>

                <View style={styles.actionRow}>
                  {!isActive ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionPrimary]}
                      onPress={() => setActiveStudio(s)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.actionPrimaryText}>활성으로 전환</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionGhost]}
                    onPress={() =>
                      navigation.navigate("TeacherStudioForm", { studioId: s.id })
                    }
                    activeOpacity={0.85}
                  >
                    <Ionicons name="create-outline" size={14} color={COLORS.text} />
                    <Text style={styles.actionGhostText}>정보 수정</Text>
                  </TouchableOpacity>
                </View>
              </SurfaceCard>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Meta({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={13} color={COLORS.textSecondary} />
      <Text style={styles.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.xxl },
  card: { marginBottom: SPACING.md, gap: SPACING.sm },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  name: { ...TEXT.bodyLg, color: COLORS.text },
  location: { ...TEXT.caption, color: COLORS.textSecondary, marginTop: 2 },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  activeBadgeText: { color: COLORS.primary, fontSize: 11, fontWeight: "700" },
  metaRow: { gap: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { ...TEXT.caption, color: COLORS.textSecondary, flex: 1 },
  actionRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.xs },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
  },
  actionPrimary: { backgroundColor: COLORS.primary, flex: 1 },
  actionPrimaryText: { color: COLORS.white, fontSize: 13, fontWeight: "700" },
  actionGhost: {
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionGhostText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
});
