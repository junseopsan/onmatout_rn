import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertDialog } from "../components/ui/AlertDialog";
import { COLORS } from "../constants/Colors";
import { useAuth } from "../hooks/useAuth";
import { useAllRecords } from "../hooks/useDashboard";
import { useAuthStore } from "../stores/authStore";

// Screens
import AsanasScreen from "../app/(tabs)/asanas";
import ProfileScreen from "../app/(tabs)/profile";
import StudentClassesTabScreen from "../app/student/classes-tab";
import StudentRoutineListScreen from "../app/student/routine-list";
import YogaTalkThreadListScreen from "../app/yoga-talk/thread-list";
import { YogaTalkTabIcon } from "../components/YogaTalkTabIcon";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { isAuthenticated } = useAuth();
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const bottomInsetForTab = Platform.OS === "android" ? insets.bottom : 0;

  // 프로필 탭 진입 전에 전체 기록을 미리 불러와 첫 로딩 체감 속도 향상
  useAllRecords(user?.id);

  // 비수련생 사용자가 로그인이 필요한 탭을 클릭했을 때
  const handleTabPress = (routeName: string) => {
    if (routeName === "Asanas") return true;
    if (!isAuthenticated || !user) {
      AlertDialog.login(
        () => navigation.navigate("Auth" as never),
        () => {},
      );
      return false;
    }
    return true;
  };

  return (
    <Tab.Navigator
        id={undefined}
        initialRouteName="Classes"
        screenOptions={({ route }: any) => ({
          tabBarIcon: ({ focused, color, size }: any) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === "Classes") {
              iconName = focused ? "calendar" : "calendar-outline";
            } else if (route.name === "Asanas") {
              iconName = focused ? "fitness" : "fitness-outline";
            } else if (route.name === "Routines") {
              iconName = focused ? "list" : "list-outline";
            } else if (route.name === "Profile") {
              iconName = focused ? "moon" : "moon-outline";
            } else {
              iconName = "help-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.surfaceDark,
            // 안전 영역을 고려해 높이/패딩 조정 (제스처 네비게이션 기기 대응)
            height: 70 + bottomInsetForTab,
            paddingBottom: 12 + bottomInsetForTab,
            paddingTop: 8,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            // 이미 안전 영역으로 띄워지므로 여백은 최소화
            marginBottom: bottomInsetForTab > 0 ? 0 : 10,
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
          name="Classes"
          component={StudentClassesTabScreen}
          options={{ tabBarLabel: "클래스" }}
        />
        <Tab.Screen
          name="Asanas"
          component={AsanasScreen}
          options={{ tabBarLabel: "아사나" }}
        />
        <Tab.Screen
          name="YogaTalk"
          component={YogaTalkThreadListScreen}
          options={{
            tabBarLabel: "요가톡",
            tabBarIcon: ({ focused, color, size }: any) => (
              <YogaTalkTabIcon focused={focused} color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Routines"
          component={StudentRoutineListScreen}
          options={{ tabBarLabel: "시퀀스" }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarLabel: "수련" }}
        />
    </Tab.Navigator>
  );
}

const tabBarIconStyles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "transparent",
    marginTop: 4,
  },
  dotActive: { backgroundColor: COLORS.primary },
});
