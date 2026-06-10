import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../components/ui/Avatar";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import { haptics } from "../../lib/haptics";
import { getCurrentCoords } from "../../lib/location";
import { nearbyApi, type NearbyStudent } from "../../lib/api/nearby";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function distLabel(m: number): string {
  if (m < 10) return "바로 옆";
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export default function TeacherNearbyScreen() {
  const navigation = useNavigation<Nav>();
  const [students, setStudents] = useState<NearbyStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [denied, setDenied] = useState(false);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const scan = useCallback(async () => {
    const coords = await getCurrentCoords();
    if (!coords) {
      setDenied(true);
      setLoading(false);
      return;
    }
    setDenied(false);
    try {
      await nearbyApi.updateLocation(coords.lat, coords.lng);
      const list = await nearbyApi.findNearbyStudents(
        coords.lat,
        coords.lng,
        200,
      );
      setStudents(list);
    } catch (e) {
      console.warn("[Nearby] scan failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    scan();
  }, [scan]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await scan();
    setRefreshing(false);
  }, [scan]);

  const invite = async (s: NearbyStudent) => {
    if (busyId) return;
    setBusyId(s.user_id);
    haptics.medium();
    try {
      await nearbyApi.inviteNearbyStudent(s.user_id);
      setInvited((prev) => new Set(prev).add(s.user_id));
    } catch (e) {
      console.warn("[Nearby] invite failed", e);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title="근처 수련생"
        serif={false}
      />

      <View style={styles.intro}>
        <Ionicons name="location" size={14} color={COLORS.primary} />
        <Text style={styles.introText}>
          가까이 있고 발견을 허용한 수련생이에요. 초대하면 수락 후 바로 연결돼요.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : denied ? (
        <EmptyState
          icon="📍"
          title="위치 권한이 필요해요"
          description={"근처 수련생을 찾으려면 위치 권한을 허용해 주세요."}
          action={{ label: "다시 시도", onPress: scan }}
        />
      ) : students.length === 0 ? (
        <EmptyState
          icon="🧭"
          title="근처에 수련생이 없어요"
          description={
            "수련생이 앱에서 '발견 허용'을 켜고 가까이 있어야 보여요.\n당겨서 다시 검색해 보세요."
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {students.map((s) => {
            const done = invited.has(s.user_id);
            return (
              <View key={s.user_id} style={styles.row}>
                <Avatar
                  name={s.nickname ?? "수련생"}
                  colorKey={s.user_id}
                  size={44}
                />
                <View style={styles.rowMain}>
                  <Text style={styles.name} numberOfLines={1}>
                    {s.nickname ?? "수련생"}
                  </Text>
                  <Text style={styles.dist}>{distLabel(s.distance_m)}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.inviteBtn, done && styles.inviteBtnDone]}
                  disabled={done || busyId === s.user_id}
                  onPress={() => invite(s)}
                  activeOpacity={0.85}
                >
                  {busyId === s.user_id ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text
                      style={[
                        styles.inviteBtnText,
                        done && styles.inviteBtnDoneText,
                      ]}
                    >
                      {done ? "초대됨" : "초대"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  intro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  introText: { flex: 1, color: COLORS.textSecondary, fontSize: 12, lineHeight: 17 },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rowMain: { flex: 1, gap: 2 },
  name: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  dist: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },
  inviteBtn: {
    minWidth: 64,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  inviteBtnDone: {
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inviteBtnText: { color: COLORS.white, fontSize: 13, fontWeight: "800" },
  inviteBtnDoneText: { color: COLORS.textSecondary },
});
