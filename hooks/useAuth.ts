import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";

export const useAuth = () => {
  const {
    user,
    session,
    loading,
    error,
    initialize,
    setUser,
    setSession,
    setLoading,
    setError,
    clearError,
    resetAuth,
    clearSession,
  } = useAuthStore();

  // Initialize auth on mount (한 번만 실행)
  useEffect(() => {
    let isMounted = true;
    let hasInitialized = false;

    const initAuth = async () => {
      if (hasInitialized) return; // 중복 실행 방지
      hasInitialized = true;

      console.log("Auth initialization starting...");

      // 타임아웃 설정 (10초)
      const timeoutId = setTimeout(() => {
        console.log("Auth initialization timeout - 강제로 로딩 해제");
        if (isMounted) {
          setLoading(false);
        }
      }, 10000);

      try {
        // 인증 초기화만 실행
        await initialize();
        clearTimeout(timeoutId);

        if (isMounted) {
          console.log("Auth initialization completed");
        }
      } catch (error) {
        clearTimeout(timeoutId);

        if (isMounted) {
          // 에러 발생 시 로딩 상태 해제
          setLoading(false);
        }
      }
    };

    // 이미 로딩이 완료된 상태라면 초기화하지 않음
    if (!loading) {
      console.log("Auth already initialized, skipping...");
      return;
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 사용자 정보가 있으면 인증된 것으로 판단 (세션 없이도 허용)
  const isAuthenticated = !!user;

  return {
    // State
    user,
    session,
    loading,
    error,
    isAuthenticated,

    // Actions
    setUser,
    setSession,
    setLoading,
    setError,
    clearError,
    resetAuth,
    clearSession,
  };
};
