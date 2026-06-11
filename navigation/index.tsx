import { useFocusEffect } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useCallback, useRef, useState } from "react";
import { BackHandler, ToastAndroid } from "react-native";
import { COLORS } from "../constants/Colors";
import { pageList } from "./pages";
import TabNavigator from "./TabNavigator";
import TeacherTabNavigator from "./TeacherTabNavigator";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  console.log("=== AppNavigator 렌더링 시작 ===");
  const backPressCountRef = useRef(0);
  const backPressTimeRef = useRef(0);
  const [currentRoute, setCurrentRoute] = useState("AppContainer");

  // 전역 BackHandler 관리
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // 현재 라우트의 설정 찾기
        const currentPage = pageList.find((page) => page.name === currentRoute);
        const isGestureDisabled =
          currentPage?.options?.gestureEnabled === false;

        // gestureEnabled: false인 화면에서만 "한번 더 누르시면 앱이 종료됩니다" 동작
        if (isGestureDisabled) {
          const currentTime = new Date().getTime();

          if (currentTime - backPressTimeRef.current < 2000) {
            backPressCountRef.current = 0;
            backPressTimeRef.current = 0;
            BackHandler.exitApp();
            return true;
          } else {
            backPressCountRef.current = 1;
            backPressTimeRef.current = currentTime;
            ToastAndroid.show(
              "한번 더 누르시면 앱이 종료됩니다.",
              ToastAndroid.SHORT
            );
            return true;
          }
        }

        // 다른 화면에서는 기본 동작 허용
        return false;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => {
        subscription?.remove?.();
      };
    }, [currentRoute]) // currentRoute가 변경될 때마다 다시 설정
  );

  return (
    <Stack.Navigator
      initialRouteName="AppContainer"
      screenOptions={() => ({
        headerBackTitle: "", // ← 핵심
        headerTitleAlign: "center",
        headerShown: true,
        gestureEnabled: true,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: {
          backgroundColor: COLORS.background,
        },
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTitleStyle: {
          color: COLORS.text,
          fontSize: 18,
          fontWeight: "600",
        },
        headerTintColor: COLORS.text,
      })}
      screenListeners={{
        focus: (e) => {
          // 화면이 포커스될 때 현재 라우트 업데이트
          const routeName = e.target?.split("-")[0];
          if (routeName) {
            console.log("=== 현재 라우트 변경 ===", routeName);
            setCurrentRoute(routeName);
          }
        },
      }}
    >
      <Stack.Screen
        name="AppContainer"
        component={pageList.find((p) => p.name === "AppContainer")?.component!}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Splash"
        component={pageList.find((p) => p.name === "Splash")?.component!}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Auth"
        component={pageList.find((p) => p.name === "Auth")?.component!}
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="PhoneLogin"
        component={pageList.find((p) => p.name === "PhoneLogin")?.component!}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Verify"
        component={pageList.find((p) => p.name === "Verify")?.component!}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Nickname"
        component={pageList.find((p) => p.name === "Nickname")?.component!}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TabNavigator"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherTabNavigator"
        component={TeacherTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NewRecord"
        component={pageList.find((p) => p.name === "NewRecord")?.component!}
        options={pageList.find((p) => p.name === "NewRecord")?.options}
      />
      <Stack.Screen
        name="RecordDetail"
        component={pageList.find((p) => p.name === "RecordDetail")?.component!}
        options={pageList.find((p) => p.name === "RecordDetail")?.options}
      />
      <Stack.Screen
        name="EditRecord"
        component={pageList.find((p) => p.name === "EditRecord")?.component!}
        options={pageList.find((p) => p.name === "EditRecord")?.options}
      />
      <Stack.Screen
        name="AsanaDetail"
        component={pageList.find((p) => p.name === "AsanaDetail")?.component!}
        options={pageList.find((p) => p.name === "AsanaDetail")?.options}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={pageList.find((p) => p.name === "PrivacyPolicy")?.component!}
        options={pageList.find((p) => p.name === "PrivacyPolicy")?.options}
      />
      <Stack.Screen
        name="TermsOfService"
        component={
          pageList.find((p) => p.name === "TermsOfService")?.component!
        }
        options={pageList.find((p) => p.name === "TermsOfService")?.options}
      />
      <Stack.Screen
        name="Settings"
        component={pageList.find((p) => p.name === "Settings")?.component!}
        options={pageList.find((p) => p.name === "Settings")?.options}
      />
      <Stack.Screen
        name="Notifications"
        component={pageList.find((p) => p.name === "Notifications")?.component!}
        options={pageList.find((p) => p.name === "Notifications")?.options}
      />
      <Stack.Screen
        name="EditNickname"
        component={pageList.find((p) => p.name === "EditNickname")?.component!}
        options={pageList.find((p) => p.name === "EditNickname")?.options}
      />
      <Stack.Screen
        name="ProfileInfo"
        component={pageList.find((p) => p.name === "ProfileInfo")?.component!}
        options={pageList.find((p) => p.name === "ProfileInfo")?.options}
      />
      <Stack.Screen
        name="CreateSupportRequest"
        component={
          pageList.find((p) => p.name === "CreateSupportRequest")?.component!
        }
        options={
          pageList.find((p) => p.name === "CreateSupportRequest")?.options
        }
      />
      <Stack.Screen
        name="RoleSelect"
        component={pageList.find((p) => p.name === "RoleSelect")?.component!}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="TeacherHome"
        component={pageList.find((p) => p.name === "TeacherHome")?.component!}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherMemberCreate"
        component={
          pageList.find((p) => p.name === "TeacherMemberCreate")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherMemberDetail"
        component={
          pageList.find((p) => p.name === "TeacherMemberDetail")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherClassCreate"
        component={
          pageList.find((p) => p.name === "TeacherClassCreate")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherClassDetail"
        component={
          pageList.find((p) => p.name === "TeacherClassDetail")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherMembershipCreate"
        component={
          pageList.find((p) => p.name === "TeacherMembershipCreate")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherMembershipPlans"
        component={
          pageList.find((p) => p.name === "TeacherMembershipPlans")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherMemberAttendance"
        component={
          pageList.find((p) => p.name === "TeacherMemberAttendance")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherNearby"
        component={
          pageList.find((p) => p.name === "TeacherNearby")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherClassAttendance"
        component={
          pageList.find((p) => p.name === "TeacherClassAttendance")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AuthMatch"
        component={pageList.find((p) => p.name === "AuthMatch")?.component!}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScanInvite"
        component={pageList.find((p) => p.name === "ScanInvite")?.component!}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StudentTeacherDetail"
        component={
          pageList.find((p) => p.name === "StudentTeacherDetail")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherRoutineList"
        component={
          pageList.find((p) => p.name === "TeacherRoutineList")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherRoutineCreate"
        component={
          pageList.find((p) => p.name === "TeacherRoutineCreate")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherRoutineDetail"
        component={
          pageList.find((p) => p.name === "TeacherRoutineDetail")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StudentRoutineList"
        component={
          pageList.find((p) => p.name === "StudentRoutineList")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StudentRoutineDetail"
        component={
          pageList.find((p) => p.name === "StudentRoutineDetail")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StudentClassSchedule"
        component={
          pageList.find((p) => p.name === "StudentClassSchedule")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherStudioList"
        component={
          pageList.find((p) => p.name === "TeacherStudioList")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherStudioForm"
        component={
          pageList.find((p) => p.name === "TeacherStudioForm")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="YogaTalkThreadList"
        component={
          pageList.find((p) => p.name === "YogaTalkThreadList")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="YogaTalkThread"
        component={
          pageList.find((p) => p.name === "YogaTalkThread")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatRooms"
        component={pageList.find((p) => p.name === "ChatRooms")?.component!}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatRoom"
        component={pageList.find((p) => p.name === "ChatRoom")?.component!}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatGroupCreate"
        component={
          pageList.find((p) => p.name === "ChatGroupCreate")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="YogaAiAssistant"
        component={
          pageList.find((p) => p.name === "YogaAiAssistant")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherProfileEdit"
        component={
          pageList.find((p) => p.name === "TeacherProfileEdit")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherClassEdit"
        component={
          pageList.find((p) => p.name === "TeacherClassEdit")?.component!
        }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherMemberEdit"
        component={
          pageList.find((p) => p.name === "TeacherMemberEdit")?.component!
        }
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
