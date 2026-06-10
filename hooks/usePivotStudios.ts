import { useCallback, useEffect } from "react";
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

  // 함수 identity를 안정화해야 함 (useFocusEffect 등에서 의존성으로 쓰일 때 무한 루프 방지)
  const reloadStudios = useCallback(
    () => (user?.id ? loadStudios(user.id) : Promise.resolve()),
    [user?.id, loadStudios],
  );
  const createStudioCb = useCallback(
    (input: PivotStudioInput) =>
      user?.id
        ? createStudio({ ownerId: user.id, ...input })
        : Promise.resolve(null),
    [user?.id, createStudio],
  );

  return {
    studios,
    activeStudio,
    loading,
    loaded,
    error,
    isDirectorOfActive,
    setActiveStudio,
    createStudio: createStudioCb,
    updateStudioLocal,
    reloadStudios,
  };
}
