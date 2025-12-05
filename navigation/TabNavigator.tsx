import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import { Modal } from "react-native";
import { AlertDialog } from "../components/ui/AlertDialog";
import { COLORS } from "../constants/Colors";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../stores/authStore";

// Screens
import AsanasScreen from "../app/(tabs)/asanas";
import DashboardScreen from "../app/(tabs)/index";
import ProfileScreen from "../app/(tabs)/profile";
import RecordScreen from "../app/(tabs)/record";
import StudiosScreen from "../app/(tabs)/studios";
import NewRecordScreen from "../app/record/new";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { isAuthenticated } = useAuth();
  const { user } = useAuthStore();
  const navigation = useNavigation();

  // 각 탭의 마지막 클릭 시간 추적 (탭 재클릭 감지용)
  const lastTabPressTime = useRef<Record<string, number>>({});
  const currentFocusedTab = useRef<string | null>(null);

  // 홈 탭 스크롤 함수를 저장할 ref (화면에서 설정)
  const dashboardScrollToTopRef = useRef<(() => void) | null>(null);

  // 기록 작성 모달 표시 여부
  const [isRecordModalVisible, setIsRecordModalVisible] = useState(false);

  // 홈 탭 스크롤 함수를 설정하는 함수 (화면에서 호출)
  // navigation에 함수를 등록하여 화면에서 접근 가능하도록 함
  React.useEffect(() => {
    (navigation as any).setDashboardScrollToTop = (fn: () => void) => {
      dashboardScrollToTopRef.current = fn;
    };
  }, [navigation]);

  // 비회원 사용자가 로그인이 필요한 탭을 클릭했을 때
  const handleTabPress = (routeName: string) => {
    // 아사나 탭은 비회원도 접근 가능
    if (routeName === "Asanas") {
      currentFocusedTab.current = routeName;
      return true;
    }

    // 로그인되지 않은 경우 Alert 표시
    if (!isAuthenticated || !user) {
      AlertDialog.login(
        () => navigation.navigate("Auth" as never),
        () => {} // 취소 시 아무것도 하지 않음
      );
      return false; // 탭 전환 방지
    }

    currentFocusedTab.current = routeName;
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

              // Dashboard, Record 탭은 개별 listeners에서 처리 (중복 Alert 방지)
              if (routeName === "Dashboard" || routeName === "Record") {
                return;
              }

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
          listeners={({ navigation, route }: any) => ({
            tabPress: (e: any) => {
              const now = Date.now();
              const wasFocused = currentFocusedTab.current === "Dashboard";

              lastTabPressTime.current["Dashboard"] = now;
              currentFocusedTab.current = "Dashboard";

              // 일반 탭 프레스 처리
              if (!handleTabPress("Dashboard")) {
                e.preventDefault();
                return;
              }

              // 이미 포커스된 탭을 다시 누른 경우 = 탭 재클릭 (한 번만 클릭해도 작동)
              if (wasFocused) {
                // 화면의 스크롤 함수 호출
                if (dashboardScrollToTopRef.current) {
                  dashboardScrollToTopRef.current();
                }
              }
            },
          })}
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
          listeners={{
            tabPress: (e: any) => {
              // 기본 탭 전환 막기 (기록 탭은 중앙 액션 버튼처럼 동작)
              e.preventDefault();

              // 로그인되지 않은 경우 Alert 표시
              if (!isAuthenticated || !user) {
                AlertDialog.login(
                  () => navigation.navigate("Auth" as never),
                  () => {} // 취소 시 아무것도 하지 않음
                );
                return;
              }

              // 기록 작성 모달 열기
              setIsRecordModalVisible(true);
            },
          }}
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

      {/* 기록 작성 모달 */}
      <Modal
        visible={isRecordModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsRecordModalVisible(false)}
      >
        <NewRecordScreen onClose={() => setIsRecordModalVisible(false)} />
      </Modal>
    </>
  );
}
