import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { studentApi, type MatchCandidate } from "../../lib/api/student";
import { RootStackParamList } from "../../navigation/types";
import { Button } from "../ui/Button";
import { Sheet } from "../ui/Sheet";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ConnectTeacherSheet({ visible, onClose }: Props) {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible || !user?.phone) return;
    studentApi
      .findMatchByPhone(user.phone)
      .then(setCandidates)
      .catch(() => undefined);
  }, [visible, user?.phone]);

  const accept = async (c: MatchCandidate) => {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      await studentApi.acceptMatch(user.id, c.studentProfileId);
      onClose();
      Alert.alert(
        "연결 완료",
        `${c.teacherStudioName ?? "선생님"} 님과 연결되었어요.`,
      );
    } catch (e: any) {
      Alert.alert("연결 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="선생님과 연결">
      <Text style={styles.lead}>
        선생님의 초대 QR을 스캔하면 가장 빠르게 연결돼요.
      </Text>

      <TouchableOpacity
        style={styles.qrPrimary}
        activeOpacity={0.9}
        onPress={() => {
          onClose();
          navigation.navigate("ScanInvite");
        }}
      >
        <Ionicons name="qr-code" size={24} color={COLORS.white} />
        <Text style={styles.qrPrimaryText}>QR 스캔으로 연결</Text>
      </TouchableOpacity>

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
                onPress={() => accept(c)}
                disabled={submitting}
                loading={submitting}
                style={{ marginTop: 12 }}
              />
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.hint}>
          초대 링크를 받았다면 그 링크를 눌러도 바로 연결돼요.
        </Text>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  lead: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  qrPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  qrPrimaryText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  matchSection: { marginTop: 20 },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardEyebrow: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 },
  cardName: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
  hint: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 18,
    textAlign: "center",
  },
});
