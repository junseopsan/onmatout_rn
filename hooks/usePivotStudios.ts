import { useEffect } from "react";
import { type PivotStudioInput } from "../lib/api/pivotStudio";
import { useStudioStore } from "../stores/studioStore";
import { useAuth } from "./useAuth";
import { useRoles } from "./useRoles";

export function usePivotStudios() {
  const { user } = useAuth();
  const { isTeacher } = useRoles();
  const {
    studios,
    activeStudio,
    loading,
    loaded,
    error,
    loadStudios,
    setActiveStudio,
    createStudio,
    updateStudioLocal,
    reset,
  } = useStudioStore();

  useEffect(() => {
    if (user?.id && isTeacher) {
      loadStudios(user.id);
    } else if (!user?.id) {
      reset();
    }
  }, [user?.id, isTeacher]);

  const isDirectorOfActive = !!(
    activeStudio && user?.id && activeStudio.owner_id === user.id
  );

  return {
    studios,
    activeStudio,
    loading,
    loaded,
    error,
    isDirectorOfActive,
    setActiveStudio,
    createStudio: (input: PivotStudioInput) =>
      user?.id
        ? createStudio({ ownerId: user.id, ...input })
        : Promise.resolve(null),
    updateStudioLocal,
    reloadStudios: () => (user?.id ? loadStudios(user.id) : Promise.resolve()),
  };
}
