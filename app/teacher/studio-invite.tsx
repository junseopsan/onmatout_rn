import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { usePivotStudios } from "../../hooks/usePivotStudios";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// 요가원 단위 초대: 링크 + QR. 누구나 이 링크/QR 로 가입하면
// 전화번호 자동매칭(미가입 명단) 또는 신규 수련생으로 연결된다.
export default function TeacherStudioInviteScreen() {
  const navigation = useNavigation<Nav>();
  const { activeStudio } = usePivotStudios();

  const code = activeStudio?.invite_code ?? null;
  const link = code ? `https://onmatout.com/a/${code}` : null;
  const studioName = activeStudio?.name ?? "요가원";

  const handleShare = async () => {
    if (!link) return;
    try {
      await Share.share({
        message: `${studioName}에 초대합니다.\n\n아래 링크를 누르면 바로 연결돼요. (앱 설치/로그인 필요)\n${link}`,
      });
    } catch {
      // 사용자 취소 등은 무시
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title="요가원 초대"
        serif={false}
      />
      {!link ? (
        <EmptyState
          icon="🔗"
          title="초대 링크를 준비 중이에요"
          description={"요가원 정보를 먼저 만들어 주세요."}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.subtitle}>
            이 링크나 QR을 회원에게 보내면 가입할 수 있어요. 가입하면{"\n"}
            자동으로 요가원 명단에 연결돼요.
          </Text>

          <SurfaceCard style={styles.card}>
            <View style={styles.qrBox}>
              <QRCode
                value={link}
                size={180}
                backgroundColor="#FFFFFF"
                color="#0A0A0A"
              />
            </View>
            <Text style={styles.qrHint}>
              현장에서 이 QR을 보여주고 스캔하게 하세요.
            </Text>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <Ionicons name="share-outline" size={18} color={COLORS.white} />
              <Text style={styles.shareText}>초대 링크 보내기</Text>
            </TouchableOpacity>
          </SurfaceCard>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  card: { alignItems: "center", padding: SPACING.lg },
  qrBox: {
    backgroundColor: "#FFFFFF",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  qrHint: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: SPACING.md,
    textAlign: "center",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "stretch",
    marginTop: SPACING.lg,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  shareText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
});
