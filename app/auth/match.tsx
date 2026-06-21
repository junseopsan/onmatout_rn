import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailHeader } from "../../components/ui/DetailHeader";
import Dialog from "../../components/ui/Dialog";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { isStudioInviteCode, studentApi } from "../../lib/api/student";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AuthMatchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, "AuthMatch">>();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const autoTriedRef = React.useRef(false);
  // 가입/연결 결과 모달 (Alert 대신 공통 Dialog 로 예쁘게)
  const [result, setResult] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const finish = () => {
    navigation.reset({ index: 0, routes: [{ name: "TabNavigator" }] });
  };

  // 초대 링크로 들어온 경우: 코드 자동 연결 시도 (1회)
  useEffect(() => {
    const c = route.params?.inviteCode?.trim();
    if (!c || autoTriedRef.current || !user?.id) return;
    autoTriedRef.current = true;
    handleCodeSubmit(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.inviteCode, user?.id]);

  const handleCodeSubmit = async (rawCode: string) => {
    const value = (rawCode ?? "").trim();
    if (!user?.id || !value) return;
    // 초대는 QR/링크로만 들어오며 코드는 항상 요가원 단위(OMS-) 다.
    if (!isStudioInviteCode(value)) {
      setResult({
        type: "error",
        title: "코드 확인",
        message: "유효하지 않은 초대 링크예요.\n선생님께 다시 받아주세요.",
      });
      return;
    }
    setSubmitting(true);
    try {
      // 요가원 단위 초대(OMS-): 전화 자동매칭 또는 신규 수련생 생성
      const res = await studentApi.joinStudioByCode(
        value,
        user.id,
        user.phone ?? null,
      );
      if (res.already) {
        // 이미 그 요가원에 연결돼 있던 경우 (멱등)
        setResult({
          type: "info",
          title: "이미 연결된 요가원",
          message: `${res.studioName || "요가원"}에 이미 연결되어 있어요.`,
        });
      } else {
        setResult({
          type: "success",
          title: "요가원 연결 완료",
          message: `${res.studioName || "요가원"}에 연결되었어요.\n이제 클래스와 일정을 받아볼 수 있어요.`,
        });
      }
    } catch (e: any) {
      const msg =
        e?.message === "STUDIO_NOT_FOUND"
          ? "유효하지 않은 초대 링크예요.\n선생님께 다시 받아주세요."
          : (e?.message ?? "잠시 후 다시 시도해 주세요.");
      setResult({ type: "error", title: "연결 실패", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : finish())}
        title={route.params?.title ?? "선생님과 연결"}
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

      <Dialog
        visible={!!result}
        type={result?.type}
        title={result?.title}
        message={result?.message}
        onClose={() =>
          result?.type === "error" ? setResult(null) : finish()
        }
        buttons={[
          {
            text: "확인",
            onPress: () =>
              result?.type === "error" ? setResult(null) : finish(),
          },
        ]}
      />
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
