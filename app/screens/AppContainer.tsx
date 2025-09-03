import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { RootStackParamList } from "../../navigation/types";
import SplashScreen from "./SplashScreen";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AppContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    // 2초 후 스플래시 종료하고 바로 Auth 화면으로 이동
    const timer = setTimeout(() => {
      setIsLoading(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  // 스플래시 화면 표시 중
  if (isLoading) {
    return <SplashScreen />;
  }

  // 여기까지 오면 안됨 (스플래시 종료 후 바로 리다이렉트)
  return null;
}
