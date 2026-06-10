import React from "react";
import { COLORS } from "../constants/Colors";
import { RootStackParamList } from "./types";

// Screens
import AsanasScreen from "../app/(tabs)/asanas";
import ProfileScreen from "../app/(tabs)/profile";
import RecordScreen from "../app/(tabs)/record";
import StudiosScreen from "../app/(tabs)/studios";
import AsanaDetailScreen from "../app/asanas/[id]";
import AuthScreen from "../app/auth/index";
import AuthMatchScreen from "../app/auth/match";
import NicknameScreen from "../app/auth/nickname";
import StudentClassScheduleScreen from "../app/student/class-schedule";
import StudentRoutineDetailScreen from "../app/student/routine-detail";
import StudentRoutineListScreen from "../app/student/routine-list";
import StudentTeacherDetailScreen from "../app/student/teacher-detail";
import TeacherClassEditScreen from "../app/teacher/class-edit";
import TeacherMemberEditScreen from "../app/teacher/member-edit";
import TeacherProfileEditScreen from "../app/teacher/profile-edit";
import TeacherRoutineCreateScreen from "../app/teacher/routine-create";
import TeacherRoutineDetailScreen from "../app/teacher/routine-detail";
import TeacherRoutineListScreen from "../app/teacher/routine-list";
import TeacherStudioApplyScreen from "../app/teacher/studio-apply";
import TeacherStudioFormScreen from "../app/teacher/studio-form";
import TeacherStudioListScreen from "../app/teacher/studio-list";
import YogaAiAssistantScreen from "../app/yoga-talk/ai-assistant";
import YogaTalkThreadListScreen from "../app/yoga-talk/thread-list";
import YogaTalkThreadScreen from "../app/yoga-talk/thread";
import PhoneLoginScreen from "../app/auth/phone-login";
import VerifyScreen from "../app/auth/verify";
import EditNicknameScreen from "../app/profile/edit-nickname";
import PrivacyPolicyScreen from "../app/profile/privacy-policy";
import ProfileInfoScreen from "../app/profile/profile-info";
import TermsOfServiceScreen from "../app/profile/terms-of-service";
import RecordDetailScreen from "../app/record/detail";
import EditRecordScreen from "../app/record/edit";
import NewRecordScreen from "../app/record/new";
import RoleSelectScreen from "../app/role-select";
import TeacherClassAttendanceScreen from "../app/teacher/class-attendance";
import TeacherClassCreateScreen from "../app/teacher/class-create";
import TeacherClassDetailScreen from "../app/teacher/class-detail";
import TeacherHomeScreen from "../app/teacher/index";
import TeacherMemberAttendanceScreen from "../app/teacher/member-attendance";
import TeacherMemberCreateScreen from "../app/teacher/member-create";
import TeacherMemberDetailScreen from "../app/teacher/member-detail";
import TeacherMembershipCreateScreen from "../app/teacher/membership-create";
import AppContainer from "../app/screens/AppContainer";
import SplashScreen from "../app/screens/SplashScreen";
import SettingsScreen from "../app/settings";
import NotificationsScreen from "../app/notifications";
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
    name: "Notifications",
    component: NotificationsScreen,
    options: {
      headerShown: false,
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
  {
    name: "RoleSelect",
    component: RoleSelectScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherHome",
    component: TeacherHomeScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherMemberCreate",
    component: TeacherMemberCreateScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherMemberDetail",
    component: TeacherMemberDetailScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherClassCreate",
    component: TeacherClassCreateScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherClassDetail",
    component: TeacherClassDetailScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherMembershipCreate",
    component: TeacherMembershipCreateScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherMemberAttendance",
    component: TeacherMemberAttendanceScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherClassAttendance",
    component: TeacherClassAttendanceScreen,
    options: { headerShown: false },
  },
  {
    name: "AuthMatch",
    component: AuthMatchScreen,
    options: { headerShown: false },
  },
  {
    name: "StudentTeacherDetail",
    component: StudentTeacherDetailScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherRoutineList",
    component: TeacherRoutineListScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherRoutineCreate",
    component: TeacherRoutineCreateScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherRoutineDetail",
    component: TeacherRoutineDetailScreen,
    options: { headerShown: false },
  },
  {
    name: "StudentRoutineList",
    component: StudentRoutineListScreen,
    options: { headerShown: false },
  },
  {
    name: "StudentRoutineDetail",
    component: StudentRoutineDetailScreen,
    options: { headerShown: false },
  },
  {
    name: "StudentClassSchedule",
    component: StudentClassScheduleScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherStudioList",
    component: TeacherStudioListScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherStudioForm",
    component: TeacherStudioFormScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherStudioApply",
    component: TeacherStudioApplyScreen,
    options: { headerShown: false },
  },
  {
    name: "YogaTalkThreadList",
    component: YogaTalkThreadListScreen,
    options: { headerShown: false },
  },
  {
    name: "YogaTalkThread",
    component: YogaTalkThreadScreen,
    options: { headerShown: false },
  },
  {
    name: "YogaAiAssistant",
    component: YogaAiAssistantScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherProfileEdit",
    component: TeacherProfileEditScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherClassEdit",
    component: TeacherClassEditScreen,
    options: { headerShown: false },
  },
  {
    name: "TeacherMemberEdit",
    component: TeacherMemberEditScreen,
    options: { headerShown: false },
  },
];
