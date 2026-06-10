import { Ionicons } from "@expo/vector-icons";
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
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { studentApi, type MatchCandidate } from "../../lib/api/student";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AuthMatchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, "AuthMatch">>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const autoTriedRef = React.useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.phone) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const found = await studentApi.findMatchByPhone(user.phone);
        if (mounted) setCandidates(found);
      } catch (e) {
        console.warn("[AuthMatch] match query failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.phone]);

  const finish = () => {
    navigation.reset({ index: 0, routes: [{ name: "TabNavigator" }] });
  };

  // 초대 링크로 들어온 경우: 코드 자동 연결 시도 (1회)
  useEffect(() => {
    const c = route.params?.inviteCode?.trim();
    if (!c || autoTriedRef.current || loading || !user?.id) return;
    autoTriedRef.current = true;
    handleCodeSubmit(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.inviteCode, loading, user?.id]);

  const handleAccept = async (c: MatchCandidate) => {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      await studentApi.acceptMatch(user.id, c.studentProfileId);
      Alert.alert(
        "연결 완료",
        `${c.teacherStudioName ?? "선생님"} 님과 연결되었어요.`,
        [{ text: "확인", onPress: finish }],
      );
    } catch (e: any) {
      Alert.alert("연결 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeSubmit = async (rawCode: string) => {
    const value = (rawCode ?? "").trim();
    if (!user?.id || !value) return;
    setSubmitting(true);
    try {
      const linked = await studentApi.linkByInviteCode(user.id, value);
      if (!linked) {
        Alert.alert(
          "코드 확인",
          "사용 가능한 초대 코드가 아니에요. 다시 확인해 주세요.",
        );
        return;
      }
      Alert.alert(
        "연결 완료",
        `${linked.teacherStudioName ?? "선생님"} 님과 연결되었어요.`,
        [{ text: "확인", onPress: finish }],
      );
    } catch (e: any) {
      Alert.alert("연결 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : finish())}
        title="선생님과 연결"
        serif={false}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.subtitle}>
            선생님의 초대 QR을 스캔하면 가장 빠르게 연결돼요.
          </Text>

          {/* 1) QR 스캔 — 메인 */}
          <TouchableOpacity
            onPress={() => navigation.navigate("ScanInvite")}
            style={styles.qrPrimary}
            activeOpacity={0.9}
          >
            <Ionicons name="qr-code" size={26} color={COLORS.white} />
            <Text style={styles.qrPrimaryText}>QR 스캔으로 연결</Text>
          </TouchableOpacity>

          {/* 2) 전화번호 자동 매칭 후보 */}
          {candidates.length > 0 ? (
            <View style={styles.matchSection}>
              <Text style={styles.sectionLabel}>나를 등록한 선생님</Text>
              {candidates.map((c) => (
                <View key={c.studentProfileId} style={styles.card}>
                  <Text style={styles.cardEyebrow}>
                    {c.teacherStudioName ?? "선생님"}
                  </Text>
                  <Text style={styles.cardName}>{c.studentName}</Text>
                  <Button
                    title="연결 수락"
                    onPress={() => handleAccept(c)}
                    disabled={submitting}
                    loading={submitting}
                    style={{ marginTop: 12 }}
                  />
                </View>
              ))}
            </View>
          ) : null}

          {submitting ? (
            <View style={styles.connecting}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={styles.connectingText}>연결 중…</Text>
            </View>
          ) : null}

          <TouchableOpacity onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipText}>나중에 할게요</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 48 },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardEyebrow: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  cardName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardMeta: { color: COLORS.textSecondary, fontSize: 13 },
  qrPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  qrPrimaryText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  matchSection: { marginTop: 24 },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  connecting: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  connectingText: { color: COLORS.textSecondary, fontSize: 14 },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 20,
  },
  skipText: { color: COLORS.textSecondary, fontSize: 14 },
});
