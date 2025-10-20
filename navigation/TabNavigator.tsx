import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Alert } from "react-native";
import { COLORS } from "../constants/Colors";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../stores/authStore";

// Screens
import AsanasScreen from "../app/(tabs)/asanas";
import DashboardScreen from "../app/(tabs)/index";
import ProfileScreen from "../app/(tabs)/profile";
import RecordScreen from "../app/(tabs)/record";
import StudiosScreen from "../app/(tabs)/studios";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { isAuthenticated } = useAuth();
  const { user } = useAuthStore();
  const navigation = useNavigation();

  // 비회원 사용자가 로그인이 필요한 탭을 클릭했을 때
  const handleTabPress = (routeName: string) => {
    // 아사나 탭은 비회원도 접근 가능
    if (routeName === "Asanas") {
      return true;
    }

    // 로그인되지 않은 경우 Alert 표시
    if (!isAuthenticated || !user) {
      Alert.alert(
        "로그인이 필요합니다",
        "이 기능을 사용하려면 로그인해주세요.",
        [
          {
            text: "취소",
            style: "cancel",
          },
          {
            text: "로그인",
            onPress: () => navigation.navigate("Auth" as never),
          },
        ]
      );
      return false; // 탭 전환 방지
    }

    return true; // 탭 전환 허용
  };

  return (
    <>
      <Tab.Navigator
        id={undefined}
        initialRouteName="Asanas"
        screenOptions={({ route }: any) => ({
          tabBarIcon: ({ focused, color, size }: any) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === "Dashboard") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Asanas") {
              iconName = focused ? "fitness" : "fitness-outline";
            } else if (route.name === "Record") {
              iconName = focused ? "add-circle" : "add-circle-outline";
            } else if (route.name === "Studios") {
              iconName = focused ? "location" : "location-outline";
            } else if (route.name === "Profile") {
              iconName = focused ? "person" : "person-outline";
            } else {
              iconName = "help-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.surfaceDark,
            height: 70,
            paddingBottom: 12,
            paddingTop: 8,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderBottomWidth: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
          headerShown: false,
        })}
        screenListeners={
          {
            tabPress: (e) => {
              const routeName = e.target?.split("-")[0];
              if (routeName && !handleTabPress(routeName)) {
                e.preventDefault();
              }
            },
          } as any
        }
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ tabBarLabel: "홈" }}
        />
        <Tab.Screen
          name="Asanas"
          component={AsanasScreen}
          options={{ tabBarLabel: "아사나" }}
        />
        <Tab.Screen
          name="Record"
          component={RecordScreen}
          options={{ tabBarLabel: "기록" }}
        />
        <Tab.Screen
          name="Studios"
          component={StudiosScreen}
          options={{ tabBarLabel: "요가원" }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarLabel: "프로필" }}
        />
      </Tab.Navigator>
    </>
  );
}
