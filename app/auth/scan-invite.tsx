import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import { haptics } from "../../lib/haptics";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// onmatout://invite?code=ONM-XXXX  또는  ONM-XXXX 형태에서 코드 추출
function extractCode(data: string): string | null {
  if (!data) return null;
  const m = data.match(/[?&]code=([^&\s]+)/i);
  if (m) return decodeURIComponent(m[1]).toUpperCase();
  const raw = data.trim().toUpperCase();
  if (/^ONM-[A-Z0-9]+$/.test(raw)) return raw;
  return null;
}

export default function ScanInviteScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const lockRef = useRef(false);

  const onScanned = (data: string) => {
    if (lockRef.current) return;
    const code = extractCode(data);
    if (!code) return;
    lockRef.current = true;
    setScanned(true);
    haptics.medium();
    navigation.replace("AuthMatch", { inviteCode: code });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title="초대 QR 스캔"
        serif={false}
      />

      {!permission ? (
        <View style={styles.center}>
          <Text style={styles.msg}>카메라를 준비 중이에요…</Text>
        </View>
      ) : !permission.granted ? (
        <View style={styles.center}>
          <Text style={styles.msg}>
            QR을 스캔하려면 카메라 권한이 필요해요.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnText}>권한 허용</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cameraWrap}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={
              scanned ? undefined : ({ data }) => onScanned(data)
            }
          />
          <View style={styles.frame} />
          <Text style={styles.hint}>
            선생님 화면의 초대 QR을 사각형 안에 맞춰 주세요.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 40,
  },
  msg: { color: COLORS.textSecondary, fontSize: 14, textAlign: "center" },
  btn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
  },
  btnText: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
  cameraWrap: { flex: 1, position: "relative" },
  frame: {
    position: "absolute",
    top: "30%",
    left: "20%",
    width: "60%",
    aspectRatio: 1,
    borderWidth: 3,
    borderColor: COLORS.white,
    borderRadius: 20,
  },
  hint: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 24,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 4,
  },
});
