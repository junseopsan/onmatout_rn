import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { COLORS } from "../constants/Colors";

// Screens
import AsanasScreen from "../app/(tabs)/asanas";
import DashboardScreen from "../app/(tabs)/index";
import ProfileScreen from "../app/(tabs)/profile";
import RecordScreen from "../app/(tabs)/record";
import StudiosScreen from "../app/(tabs)/studios";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Asanas") {
            iconName = focused ? "fitness" : "fitness-outline";
          } else if (route.name === "Record") {
            iconName = focused ? "calendar" : "calendar-outline";
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
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: "대시보드" }}
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
  );
}
