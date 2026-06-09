import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import type { UserRole } from "../types/role";
import { useRoles } from "./useRoles";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function useRoleSwitch() {
  const navigation = useNavigation<Nav>();
  const { setActiveRole, roles } = useRoles();

  const switchTo = async (role: UserRole) => {
    if (!roles.includes(role)) return;
    await setActiveRole(role);
    const target = role === "teacher" ? "TeacherTabNavigator" : "TabNavigator";
    navigation.reset({ index: 0, routes: [{ name: target }] });
  };

  return { switchTo };
}
