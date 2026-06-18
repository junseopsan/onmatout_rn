import { useCallback, useEffect } from "react";
import { useStudentStudioStore } from "../stores/studentStudioStore";
import { useAuth } from "./useAuth";

export function useStudentStudios() {
  const { user } = useAuth();
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

  // 인증된 사용자면 역할(student) 여부와 무관하게 멤버십을 로드한다.
  // 멤버십이 없어도 loadMemberships 가 loaded=true 로 만들어 줘야
  // 클래스탭 등에서 스켈레톤이 멈추지 않고 빈 상태로 넘어간다.
  useEffect(() => {
    if (user?.id) {
      loadMemberships(user.id);
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const active = memberships.find((m) => m.studentProfileId === activeProfileId) ?? null;

  // 안정적 참조 — 포커스마다 호출해도 effect 가 자기 자신을 재트리거하지 않게.
  // (loadMemberships 는 zustand 액션이라 항상 동일 참조)
  const reloadMemberships = useCallback(
    () => (user?.id ? loadMemberships(user.id) : Promise.resolve()),
    [user?.id, loadMemberships],
  );

  return {
    memberships,
    activeMembership: active,
    activeStudentProfileId: activeProfileId,
    activeStudio: active?.studio ?? null,
    loading,
    loaded,
    error,
    setActiveProfile,
    reloadMemberships,
  };
}
