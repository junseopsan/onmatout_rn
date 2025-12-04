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
import PhoneLoginScreen from "../app/auth/phone-login";
import VerifyScreen from "../app/auth/verify";
import EditNicknameScreen from "../app/profile/edit-nickname";
import PrivacyPolicyScreen from "../app/profile/privacy-policy";
import ProfileInfoScreen from "../app/profile/profile-info";
import TermsOfServiceScreen from "../app/profile/terms-of-service";
import RecordDetailScreen from "../app/record/detail";
import EditRecordScreen from "../app/record/edit";
import NewRecordScreen from "../app/record/new";
import AppContainer from "../app/screens/AppContainer";
import SplashScreen from "../app/screens/SplashScreen";
import SettingsScreen from "../app/settings";
import CreateSupportRequestScreen from "../app/support/create-request";

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
    name: "PhoneLogin",
    component: PhoneLoginScreen,
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
    name: "NewRecord",
    component: NewRecordScreen,
    options: {
      headerShown: false,
    },
  },
  {
    name: "RecordDetail",
    component: RecordDetailScreen,
    options: {
      headerShown: false, // 커스텀 헤더 사용
    },
  },
  {
    name: "EditRecord",
    component: EditRecordScreen,
    options: {
      headerShown: false, // 커스텀 헤더 사용
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
  {
    name: "PrivacyPolicy",
    component: PrivacyPolicyScreen,
    options: {
      headerShown: true,
      headerBackTitle: "",
      headerTitleAlign: "center",
      gestureEnabled: true,
      headerBackButtonDisplayMode: "minimal",
      title: "개인정보 처리방침",
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
  {
    name: "TermsOfService",
    component: TermsOfServiceScreen,
    options: {
      headerShown: true,
      headerBackTitle: "",
      headerTitleAlign: "center",
      gestureEnabled: true,
      headerBackButtonDisplayMode: "minimal",
      title: "이용약관",
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
  {
    name: "Settings",
    component: SettingsScreen,
    options: {
      headerShown: false, // 커스텀 헤더 사용
    },
  },
  {
    name: "EditNickname",
    component: EditNicknameScreen,
    options: {
      headerShown: false, // 커스텀 헤더 사용
    },
  },
  {
    name: "ProfileInfo",
    component: ProfileInfoScreen,
    options: {
      headerShown: false, // 커스텀 헤더 사용
    },
  },
  {
    name: "CreateSupportRequest",
    component: CreateSupportRequestScreen,
    options: {
      headerShown: false, // 커스텀 헤더 사용
    },
  },
];
