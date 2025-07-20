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
    signOut,
  } = useAuthStore();

  // Initialize auth on mount (한 번만 실행)
  useEffect(() => {
    let isMounted = true;
    let hasInitialized = false;

    const initAuth = async () => {
      if (hasInitialized) return; // 중복 실행 방지
      hasInitialized = true;

      console.log("Auth initialization starting...");

      try {
        // 인증 초기화만 실행
        await initialize();
        if (isMounted) {
          console.log("Auth initialization completed");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (isMounted) {
          // 에러 발생 시 로딩 상태 해제
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 세션이 있으면 인증된 것으로 판단 (사용자 정보는 나중에 채워질 수 있음)
  const isAuthenticated = !!session;

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
    signOut,
  };
};
