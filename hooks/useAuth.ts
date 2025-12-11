import { useEffect } from "react";
import { AppState } from "react-native";
import { supabase } from "../lib/supabase";
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
    } else {
      initAuth();
    }

    return () => {
      isMounted = false;
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 앱이 포그라운드로 돌아올 때 세션 재검증/갱신
  useEffect(() => {
    if (!user) return;

    const handleAppStateChange = async (nextState: string) => {
      if (nextState !== "active") return;
      try {
        const {
          data: { session: latestSession },
        } = await supabase.auth.getSession();

        if (latestSession) {
          setSession(latestSession);
          return;
        }

        // 세션이 없으면 갱신 시도
        const {
          data: { session: refreshedSession },
        } = await supabase.auth.refreshSession();

        if (refreshedSession) {
          setSession(refreshedSession);
        }
      } catch (error) {
        console.log("[Auth] 포그라운드 세션 갱신 실패:", error);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [user, setSession]);

  // 주기적으로 세션 확인 및 갱신 (사용자가 로그인되어 있을 때만)
  useEffect(() => {
    if (!user) return;

    const refreshSession = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (currentSession) {
          // 세션이 있으면 만료 시간 확인
          if (currentSession.expires_at) {
            const expiresAt = currentSession.expires_at * 1000;
            const now = Date.now();
            const timeUntilExpiry = expiresAt - now;

            // 만료 30분 전이면 갱신 시도
            if (timeUntilExpiry < 30 * 60 * 1000 && timeUntilExpiry > 0) {
              console.log("[Auth] 세션 만료 임박, 주기적 갱신 시도");
              const {
                data: { session: refreshedSession },
                error: refreshError,
              } = await supabase.auth.refreshSession();

              if (refreshedSession && !refreshError) {
                console.log("[Auth] 주기적 세션 갱신 성공");
                setSession(refreshedSession);
              } else if (refreshError) {
                console.log("[Auth] 주기적 세션 갱신 실패:", refreshError);
                // 갱신 실패해도 사용자 정보는 유지
              }
            }
          }
        } else {
          // 세션이 없으면 갱신 시도
          console.log("[Auth] 세션 없음, 갱신 시도");
          try {
            const {
              data: { session: refreshedSession },
            } = await supabase.auth.refreshSession();
            if (refreshedSession) {
              console.log("[Auth] 세션 갱신 성공");
              setSession(refreshedSession);
            }
          } catch (refreshError) {
            console.log(
              "[Auth] 세션 갱신 실패, 사용자 정보는 유지:",
              refreshError
            );
          }
        }
      } catch (error) {
        console.log("[Auth] 세션 확인 중 오류:", error);
      }
    };

    // 초기 확인
    refreshSession();

    // 10분마다 세션 확인 및 갱신
    const interval = setInterval(refreshSession, 10 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [user, setSession]);

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
