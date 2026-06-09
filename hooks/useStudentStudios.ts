import { useEffect } from "react";
import { useStudentStudioStore } from "../stores/studentStudioStore";
import { useAuth } from "./useAuth";
import { useRoles } from "./useRoles";

export function useStudentStudios() {
  const { user } = useAuth();
  const { isStudent } = useRoles();
  const {
    memberships,
    activeProfileId,
    loading,
    loaded,
    error,
    loadMemberships,
    setActiveProfile,
    reset,
  } = useStudentStudioStore();

  useEffect(() => {
    if (user?.id && isStudent) {
      loadMemberships(user.id);
    } else if (!user?.id) {
      reset();
    }
  }, [user?.id, isStudent]);

  const active = memberships.find((m) => m.studentProfileId === activeProfileId) ?? null;

  return {
    memberships,
    activeMembership: active,
    activeStudentProfileId: activeProfileId,
    activeStudio: active?.studio ?? null,
    loading,
    loaded,
    error,
    setActiveProfile,
    reloadMemberships: () =>
      user?.id ? loadMemberships(user.id) : Promise.resolve(),
  };
}
