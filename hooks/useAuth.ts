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

  // 마운트 시 1회 초기화. 포그라운드 복귀 시 세션 갱신은 supabase 클라이언트
  // (autoRefreshToken: true) 와 onAuthStateChange 가 처리하므로 별도 AppState
  // 리스너 / 주기적 인터벌을 두지 않는다.
  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const timeoutId = setTimeout(() => {
        if (!cancelled) setLoading(false);
      }, 10000);

      try {
        await initialize();
      } catch {
        if (!cancelled) setLoading(false);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    if (loading) {
      initAuth();
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,
    setUser,
    setSession,
    setLoading,
    setError,
    clearError,
    resetAuth,
    clearSession,
  };
};
