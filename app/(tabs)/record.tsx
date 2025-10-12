import { useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback } from "react";
import { View } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { RootStackParamList } from "../../navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RecordScreen() {
  const { isAuthenticated, loading } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  // 화면이 포커스될 때마다 바로 새 기록 작성 페이지로 이동
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && !loading) {
        navigation.navigate("NewRecord");
      }
    }, [isAuthenticated, loading, navigation])
  );

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }} />
  );
}
