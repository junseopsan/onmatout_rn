import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// Supabase 환경 변수에서 설정 가져오기 (여러 소스에서 시도)
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseAnonKey;

// 환경 변수 검증
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase 환경 변수가 설정되지 않았습니다.");
  console.error("다음 환경 변수를 설정해주세요:");
  console.error("- EXPO_PUBLIC_SUPABASE_URL");
  console.error("- EXPO_PUBLIC_SUPABASE_ANON_KEY");
  console.error("");
  console.error("방법 1: .env 파일 생성");
  console.error("방법 2: app.json의 extra 섹션에 추가");
  console.error("방법 3: expo start 시 환경 변수 전달");

  throw new Error(
    "Supabase 환경 변수가 설정되지 않았습니다. .env 파일을 생성하거나 환경 변수를 설정해주세요."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helper functions
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // 리프레시 토큰 관련 에러는 조용히 처리 (비로그인 상태에서 정상)
    if (error) {
      const errorMessage = error.message?.toLowerCase() || "";
      if (
        errorMessage.includes("invalid refresh token") ||
        errorMessage.includes("refresh token not found")
      ) {
        return null;
      }
    }

    return user;
  } catch (e) {
    // 예외 발생 시 조용히 null 반환 (비로그인 상태에서 정상적인 동작)
    return null;
  }
};

export const getCurrentSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      // Supabase가 보관 중이던 리프레시 토큰이 유효하지 않을 때 발생
      // 또는 비로그인 상태에서 리프레시 토큰을 찾으려고 시도할 때 발생
      const errorMessage = error.message?.toLowerCase() || "";
      if (
        errorMessage.includes("invalid refresh token") ||
        errorMessage.includes("refresh token not found")
      ) {
        // 리프레시 토큰이 만료되었을 때, 로컬에 저장된 사용자 정보가 있으면 세션 갱신 시도
        try {
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) {
            // 로컬에 사용자 정보가 있으면 세션 갱신 시도
            console.log("[Auth] 리프레시 토큰 만료, 세션 갱신 시도");
            // 세션을 강제로 갱신하려고 시도 (Supabase가 자동으로 처리)
            const {
              data: { session: refreshedSession },
            } = await supabase.auth.refreshSession();
            if (refreshedSession) {
              console.log("[Auth] 세션 갱신 성공");
              return refreshedSession;
            }
          }
        } catch (refreshError) {
          console.log("[Auth] 세션 갱신 실패:", refreshError);
        }

        // 세션 갱신 실패 시에도 로컬 사용자 정보가 있으면 null 반환하지 않음
        // (사용자 정보는 유지하고 세션만 null로 처리)
        return null;
      }

      // 다른 종류의 에러는 로그 출력
      console.log("[Auth] 세션 조회 중 오류:", error.message);
      return null;
    }

    // 세션이 있지만 만료되었는지 확인
    if (session && session.expires_at) {
      const expiresAt = session.expires_at * 1000; // 초를 밀리초로 변환
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // 만료 5분 전이면 자동 갱신 시도
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        console.log("[Auth] 세션 만료 임박, 자동 갱신 시도");
        try {
          const {
            data: { session: refreshedSession },
            error: refreshError,
          } = await supabase.auth.refreshSession();
          if (refreshedSession && !refreshError) {
            console.log("[Auth] 세션 자동 갱신 성공");
            return refreshedSession;
          }
        } catch (refreshError) {
          console.log("[Auth] 세션 자동 갱신 실패:", refreshError);
        }
      }
    }

    return session;
  } catch (e) {
    // 예외 발생 시 조용히 null 반환 (비로그인 상태에서 정상적인 동작)
    return null;
  }
};

// 세션 확인 및 사용자 ID 가져오기 (API 호출 전 사용)
export const ensureAuthenticated = async (): Promise<{
  userId: string;
  session: any;
} | null> => {
  try {
    // 먼저 세션 확인
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // 리프레시 토큰 관련 에러는 조용히 처리 (비로그인 상태에서 정상)
    if (sessionError) {
      const errorMessage = sessionError.message?.toLowerCase() || "";
      if (
        errorMessage.includes("invalid refresh token") ||
        errorMessage.includes("refresh token not found")
      ) {
        return null;
      }
    }

    if (!session) {
      return null;
    }

    // 세션이 있으면 사용자 정보 가져오기
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    return {
      userId: user.id,
      session,
    };
  } catch (error) {
    // 예외 발생 시 조용히 null 반환
    return null;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;
