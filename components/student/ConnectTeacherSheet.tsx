import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { COLORS } from "../../constants/Colors";
import { RootStackParamList } from "../../navigation/types";
import { Sheet } from "../ui/Sheet";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ConnectTeacherSheet({ visible, onClose }: Props) {
  const navigation = useNavigation<Nav>();

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

      <Text style={styles.hint}>
        초대 링크를 받았다면 그 링크를 눌러도 바로 연결돼요.
      </Text>
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
  hint: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 18,
    textAlign: "center",
  },
});
