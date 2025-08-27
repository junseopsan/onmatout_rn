import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import AppNavigator from "../navigation";
import { AppThemeProvider } from "./_layout";

export default function App() {
  console.log("=== App 컴포넌트 렌더링 ===");
  return (
    <AppThemeProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </AppThemeProvider>
  );
}
