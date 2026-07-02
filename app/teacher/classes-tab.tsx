import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RoleSheet } from "../../components/role/RoleSheet";
import { StudioSwitcher } from "../../components/teacher/StudioSwitcher";
import { NotificationBell } from "../../components/ui/NotificationBell";
import { PageHeader } from "../../components/ui/PageHeader";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import { usePivotStudios } from "../../hooks/usePivotStudios";
import { RootStackParamList } from "../../navigation/types";
import { ClassesBody } from "./classes-body";
import { MembersBody } from "./members-body";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Segment = "classes" | "members";

// 선생님 클래스 탭: 공용 헤더 + [수업 | 수련생] 세그먼트로 두 본문을 전환한다.
export default function TeacherClassesTabScreen() {
  const navigation = useNavigation<Nav>();
  const { activeStudio, isDirectorOfActive } = usePivotStudios();
  const [segment, setSegment] = useState<Segment>("classes");
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageHeader
        eyebrowSlot={<StudioSwitcher />}
        trailingSlot={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setRoleSheetOpen(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={22}
                color={COLORS.text}
              />
            </TouchableOpacity>
            {isDirectorOfActive && activeStudio ? (
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() =>
                  navigation.navigate("TeacherMembershipPlans", {
                    studioId: activeStudio.id,
                    studioName: activeStudio.name,
                  })
                }
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="ticket-outline" size={22} color={COLORS.text} />
              </TouchableOpacity>
            ) : null}
            <NotificationBell />
          </View>
        }
      />

      <View style={styles.segmentWrap}>
        <SegmentedControl<Segment>
          options={[
            { value: "classes", label: "수업" },
            { value: "members", label: "수련생" },
          ]}
          value={segment}
          onChange={setSegment}
        />
      </View>

      {segment === "classes" ? <ClassesBody /> : <MembersBody />}

      <RoleSheet visible={roleSheetOpen} onClose={() => setRoleSheetOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentWrap: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
});
