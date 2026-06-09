import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TeacherClassesTabScreen from "../app/teacher/classes-tab";
import TeacherMembersTabScreen from "../app/teacher/members-tab";
import TeacherRoutineListScreen from "../app/teacher/routine-list";
import ProfileScreen from "../app/(tabs)/profile";
import YogaTalkThreadListScreen from "../app/yoga-talk/thread-list";
import { YogaTalkTabIcon } from "../components/YogaTalkTabIcon";
import { COLORS } from "../constants/Colors";
import { FONT } from "../constants/Typography";

const Tab = createBottomTabNavigator();

export default function TeacherTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInsetForTab = Platform.OS === "android" ? insets.bottom : 0;

  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName="TeacherClassesTab"
      screenOptions={({ route }: any) => ({
        tabBarIcon: ({ focused, color, size }: any) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === "TeacherClassesTab") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "TeacherMembersTab") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "TeacherRoutinesTab") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "TeacherProfileTab") {
            iconName = focused ? "sunny" : "sunny-outline";
          } else {
            iconName = "help-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surfaceDark,
          height: 70 + bottomInsetForTab,
          paddingBottom: 12 + bottomInsetForTab,
          paddingTop: 8,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          marginBottom: bottomInsetForTab > 0 ? 0 : 10,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderBottomWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: FONT.sansSemiBold,
          marginTop: -2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="TeacherClassesTab"
        component={TeacherClassesTabScreen}
        options={{ tabBarLabel: "클래스" }}
      />
      <Tab.Screen
        name="TeacherMembersTab"
        component={TeacherMembersTabScreen}
        options={{ tabBarLabel: "수련생" }}
      />
      <Tab.Screen
        name="TeacherYogaTalkTab"
        component={YogaTalkThreadListScreen}
        options={{
          tabBarLabel: "요가톡",
          tabBarIcon: ({ focused, color, size }: any) => (
            <YogaTalkTabIcon focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="TeacherRoutinesTab"
        component={TeacherRoutineListScreen}
        options={{ tabBarLabel: "시퀀스" }}
      />
      <Tab.Screen
        name="TeacherProfileTab"
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
