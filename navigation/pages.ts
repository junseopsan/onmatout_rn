import React from "react";
import { COLORS } from "../constants/Colors";
import { RootStackParamList } from "./types";

// Screens
import AsanasScreen from "../app/(tabs)/asanas";
import DashboardScreen from "../app/(tabs)/index";
import ProfileScreen from "../app/(tabs)/profile";
import RecordScreen from "../app/(tabs)/record";
import StudiosScreen from "../app/(tabs)/studios";
import AsanaDetailScreen from "../app/asanas/[id]";
import AuthScreen from "../app/auth/index";
import NicknameScreen from "../app/auth/nickname";
import VerifyScreen from "../app/auth/verify";
import AppContainer from "../app/screens/AppContainer";
import SplashScreen from "../app/screens/SplashScreen";

export interface PageConfig {
  name: keyof RootStackParamList;
  component: React.ComponentType<any>;
  options?: {
    headerShown?: boolean;
    headerBackTitle?: string;
    headerTitleAlign?: "left" | "center";
    gestureEnabled?: boolean;
    headerBackButtonDisplayMode?: "default" | "minimal" | "generic";
    title?: string;
    headerStyle?: object;
    headerTintColor?: string;
    headerTitleStyle?: object;
  };
}

export const pageList: PageConfig[] = [
  {
    name: "AppContainer",
    component: AppContainer,
    options: {
      headerShown: false,
    },
  },
  {
    name: "Splash",
    component: SplashScreen,
    options: {
      headerShown: false,
    },
  },
  {
    name: "Auth",
    component: AuthScreen,
    options: {
      headerShown: false,
    },
  },
  {
    name: "Verify",
    component: VerifyScreen,
    options: {
      headerShown: false,
    },
  },
  {
    name: "Nickname",
    component: NicknameScreen,
    options: {
      headerShown: false,
    },
  },
  {
    name: "Dashboard",
    component: DashboardScreen,
    options: {
      headerShown: false,
    },
  },
  {
    name: "Asanas",
    component: AsanasScreen,
    options: {
      headerShown: false,
    },
  },
  {
    name: "Record",
    component: RecordScreen,
    options: {
      headerShown: false,
    },
  },
  {
    name: "Studios",
    component: StudiosScreen,
    options: {
      headerShown: false,
    },
  },
  {
    name: "Profile",
    component: ProfileScreen,
    options: {
      headerShown: false,
    },
  },
  {
    name: "AsanaDetail",
    component: AsanaDetailScreen,
    options: {
      headerShown: true,
      headerBackTitle: "",
      headerTitleAlign: "center",
      gestureEnabled: true,
      headerBackButtonDisplayMode: "minimal",
      title: "아사나 상세",
      headerStyle: {
        backgroundColor: COLORS.background,
      },
      headerTintColor: COLORS.text,
      headerTitleStyle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: "600",
      },
    },
  },
];
