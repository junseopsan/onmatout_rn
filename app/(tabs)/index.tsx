import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MyTeachersBanner } from "../../components/student/MyTeachersBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { useRoles } from "../../hooks/useRoles";
import { useStudentMatchCheck } from "../../hooks/useStudentMatchCheck";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { activeRole } = useRoles();

  useStudentMatchCheck(
    useCallback(() => {
      navigation.navigate("AuthMatch" as never);
    }, [navigation]),
  );

  const greeting =
    activeRole === "student" ? "수련 잘 다녀오세요" : "오늘 한 호흡";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <PageHeader eyebrow="홈" title={greeting} />

        <MyTeachersBanner />

        <View style={styles.quickRow}>
          <QuickAction
            icon="calendar"
            tint={COLORS.primary}
            label="수업 신청"
            sub="내 요가원 스케줄"
            onPress={() => navigation.navigate("StudentClassSchedule")}
          />
          <QuickAction
            icon="create"
            tint={COLORS.chakraSacral}
            label="기록 쓰기"
            sub="오늘 한 자리"
            onPress={() => navigation.navigate("NewRecord")}
          />
        </View>

        <View style={styles.quickRow}>
          <QuickAction
            icon="list"
            tint={COLORS.chakraHeart}
            label="복습 시퀀스"
            sub="공유 받은 시퀀스"
            onPress={() => navigation.navigate("StudentRoutineList")}
          />
          <QuickAction
            icon="book"
            tint={COLORS.chakraThroat}
            label="아사나 사전"
            sub="자세 둘러보기"
            onPress={() => navigation.navigate("Asanas" as never)}
          />
        </View>

        {!user ? (
          <SurfaceCard style={styles.guestCard}>
            <Text style={styles.guestTitle}>로그인하고 시작하기</Text>
            <Text style={styles.guestText}>
              선생님이 보낸 복습 시퀀스, 출석, 잔여 횟수를 한 곳에서 볼 수 있어요.
            </Text>
            <TouchableOpacity
              style={styles.guestBtn}
              onPress={() => navigation.navigate("Auth" as never)}
              activeOpacity={0.9}
            >
              <Text style={styles.guestBtnText}>로그인 / 시작하기</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </SurfaceCard>
        ) : null}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  tint,
  label,
  sub,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  sub?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.quick}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.quickIconWrap, { backgroundColor: `${tint}1A`, borderColor: `${tint}55` }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
      {sub ? <Text style={styles.quickSub}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: SPACING.xxl },
  quickRow: {
    flexDirection: "row",
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  quick: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  quickLabel: { ...TEXT.bodyMed, color: COLORS.text, marginBottom: 2 },
  quickSub: { ...TEXT.micro, color: COLORS.textSecondary, fontSize: 12 },
  guestCard: {
    margin: SPACING.lg,
    marginTop: SPACING.xl,
  },
  guestTitle: {
    ...TEXT.uiTitle,
    color: COLORS.text,
    marginBottom: 6,
  },
  guestText: {
    ...TEXT.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  guestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
  },
  guestBtnText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
});
