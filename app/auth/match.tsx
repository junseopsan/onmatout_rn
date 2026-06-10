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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
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
  const [code, setCode] = useState(route.params?.inviteCode ?? "");
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

  const handleCodeSubmit = async (override?: string) => {
    const value = (override ?? code).trim();
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            {candidates.length > 0
              ? "선생님이 수련생으로 등록했어요"
              : "선생님과 연결할까요?"}
          </Text>
          <Text style={styles.subtitle}>
            {candidates.length > 0
              ? "수련생님이 맞는지 확인해 주세요. 거절하면 나중에 초대 코드로도 연결할 수 있어요."
              : "선생님에게 받은 초대 코드 (ONM-XXXX) 가 있다면 입력하세요."}
          </Text>

          {candidates.map((c) => (
            <View key={c.studentProfileId} style={styles.card}>
              <Text style={styles.cardEyebrow}>
                {c.teacherStudioName ?? "선생님"}
              </Text>
              <Text style={styles.cardName}>{c.studentName}</Text>
              <Text style={styles.cardMeta}>초대 코드: {c.inviteCode}</Text>
              <Button
                title="연결 수락"
                onPress={() => handleAccept(c)}
                disabled={submitting}
                loading={submitting}
                style={{ marginTop: 12 }}
              />
            </View>
          ))}

          <Text style={styles.label}>초대 코드</Text>
          <View style={styles.codeBox}>
            <TextInput
              value={code}
              onChangeText={(v) =>
                setCode(v.toUpperCase().replace(/[^A-Z0-9-]/g, ""))
              }
              placeholder="ONM-XXXX"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.codeInput}
              autoCapitalize="characters"
              maxLength={9}
            />
          </View>
          <Button
            title="코드로 연결"
            onPress={() => handleCodeSubmit()}
            disabled={submitting || code.trim().length < 5}
            variant="outline"
            style={{ marginTop: 12 }}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate("ScanInvite")}
            style={styles.scanBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="qr-code-outline" size={18} color={COLORS.primary} />
            <Text style={styles.scanText}>QR 스캔으로 연결</Text>
          </TouchableOpacity>

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
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 8,
  },
  codeBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  codeInput: {
    color: COLORS.text,
    fontSize: 18,
    letterSpacing: 1,
    textAlign: "center",
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 16,
  },
  skipText: { color: COLORS.textSecondary, fontSize: 14 },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  scanText: { color: COLORS.primary, fontSize: 14, fontWeight: "800" },
});
