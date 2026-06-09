import { useEffect } from "react";
import { useRoleStore } from "../stores/roleStore";
import { useAuth } from "./useAuth";

export function useRoles() {
  const { user } = useAuth();
  const {
    roles,
    activeRole,
    loading,
    loaded,
    error,
    loadRoles,
    addRole,
    setActiveRole,
    reset,
  } = useRoleStore();

  useEffect(() => {
    if (user?.id) {
      loadRoles(user.id);
    } else {
      reset();
    }
  }, [user?.id]);

  const isTeacher = activeRole === "teacher";
  const isStudent = activeRole === "student";
  const hasMultipleRoles = roles.length > 1;
  // loaded 가 true 일 때만 의미 있음 — 초기 mount 시 false → AppContainer 가 대기
  const needsRoleSelection = loaded && !!user?.id && roles.length === 0;

  return {
    roles,
    activeRole,
    isTeacher,
    isStudent,
    hasMultipleRoles,
    needsRoleSelection,
    loading,
    loaded,
    error,
    addRole: (role: "teacher" | "student") =>
      user?.id ? addRole(user.id, role) : Promise.resolve(false),
    setActiveRole,
    reloadRoles: () => (user?.id ? loadRoles(user.id) : Promise.resolve()),
  };
}
