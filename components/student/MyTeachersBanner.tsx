import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { useRoles } from "../../hooks/useRoles";
import { studentApi, type StudentTeacherLink } from "../../lib/api/student";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function MyTeachersBanner() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { activeRole } = useRoles();
  const [links, setLinks] = useState<StudentTeacherLink[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id || activeRole !== "student") {
      setLinks([]);
      setLoaded(false);
      return;
    }
    let mounted = true;
    studentApi
      .listMyTeachers(user.id)
      .then((data) => {
        if (mounted) setLinks(data);
      })
      .catch((e) => console.warn("[MyTeachersBanner] failed", e))
      .finally(() => mounted && setLoaded(true));
    return () => {
      mounted = false;
    };
  }, [user?.id, activeRole]);

  if (activeRole !== "student") return null;
  if (!loaded) return null;
  if (links.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>내 지도자</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("StudentRoutineList")}
          style={styles.routineLink}
        >
          <Text style={styles.routineLinkText}>📋 복습 시퀀스 →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {links.map((l) => (
          <TeacherCard
            key={l.studentProfile.id}
            link={l}
            onPress={() =>
              navigation.navigate("StudentTeacherDetail", {
                studentProfileId: l.studentProfile.id,
              })
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

function TeacherCard({
  link,
  onPress,
}: {
  link: StudentTeacherLink;
  onPress: () => void;
}) {
  const m = link.activeMembership;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.studio} numberOfLines={1}>
        {link.teacherName ?? "이름 없는 요가원"}
      </Text>
      {m ? (
        <Text style={styles.meta}>{describeMembership(m)}</Text>
      ) : (
        <Text style={styles.muted}>활성 수련권 없음</Text>
      )}
    </TouchableOpacity>
  );
}

function describeMembership(m: any): string {
  if (m.type === "count") {
    const remaining = (m.total_count ?? 0) - (m.used_count ?? 0);
    return `횟수권, ${remaining}/${m.total_count}회 남음`;
  }
  if (m.type === "period_weekly") {
    return `기간권 주${m.weekly_limit}회, ~${m.end_date}`;
  }
  return `기간권 무제한, ~${m.end_date}`;
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 8, paddingBottom: 12 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  routineLink: { paddingVertical: 2 },
  routineLinkText: { color: COLORS.primary, fontSize: 12, fontWeight: "600" },
  scroll: { paddingHorizontal: 16, gap: 10 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
  },
  studio: { color: COLORS.text, fontSize: 14, fontWeight: "600", marginBottom: 4 },
  meta: { color: COLORS.primary, fontSize: 13 },
  muted: { color: COLORS.textSecondary, fontSize: 13 },
});
