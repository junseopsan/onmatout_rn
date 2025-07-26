import { create } from "zustand";
import { authAPI } from "../lib/api/auth";
import { userAPI } from "../lib/api/user";
import { getCurrentSession, getCurrentUser, supabase } from "../lib/supabase";
import {
  AuthState,
  LoginCredentials,
  User,
  VerifyCredentials,
} from "../types/auth";

interface AuthStore extends AuthState {
  // Additional state
  phoneNumber: string | null;

  // Actions
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setPhoneNumber: (phone: string) => void;
  resetAuth: () => void;
  clearSession: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithPhone: (credentials: LoginCredentials) => Promise<boolean>;
  verifyOTP: (credentials: VerifyCredentials) => Promise<boolean>;
  saveUserProfile: (nickname: string) => Promise<boolean>;
  getUserProfile: () => Promise<any>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  loading: true,
  error: null,
  phoneNumber: null,

  // Actions
  saveUserProfile: async (nickname: string) => {
    try {
      console.log("사용자 프로필 저장 시작:", nickname);

      const currentUser = get().user;
      if (!currentUser) {
        console.error("사용자 정보가 없습니다.");
        return false;
      }

      const response = await userAPI.upsertUserProfile(currentUser.id, {
        name: nickname,
      });

      if (response.success) {
        console.log("사용자 프로필 저장 성공:", response.data);
        return true;
      } else {
        console.error("사용자 프로필 저장 실패:", response.message);
        return false;
      }
    } catch (error) {
      console.error("사용자 프로필 저장 에러:", error);
      return false;
    }
  },

  getUserProfile: async () => {
    try {
      console.log("사용자 프로필 조회 시작");

      const currentUser = get().user;
      if (!currentUser) {
        console.error("사용자 정보가 없습니다.");
        return null;
      }

      const response = await userAPI.getUserProfile(currentUser.id);

      if (response.success) {
        console.log("사용자 프로필 조회 성공:", response.data);
        return response.data;
      } else {
        console.error("사용자 프로필 조회 실패:", response.message);
        return null;
      }
    } catch (error) {
      console.error("사용자 프로필 조회 에러:", error);
      return null;
    }
  },

  initialize: async () => {
    try {
      console.log("Auth initialization 시작");
      set({ loading: true, error: null });

      // 타임아웃 설정 (10초)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Auth initialization timeout")),
          10000
        );
      });

      const initPromise = (async () => {
        // 현재 세션 확인
        const session = await getCurrentSession();
        console.log("현재 세션:", session);

        if (session) {
          // 사용자 정보 가져오기
          const user = await getCurrentUser();
          console.log("현재 사용자:", user);

          if (user) {
            // 사용자 프로필 확인
            try {
              const userProfile = await userAPI.getUserProfile(user.id);
              console.log("사용자 프로필:", userProfile);

              if (
                userProfile.success &&
                userProfile.data &&
                userProfile.data.name &&
                userProfile.data.name.trim() !== "" &&
                userProfile.data.name !== "null"
              ) {
                set({
                  user: { ...user, profile: userProfile.data } as any,
                  session,
                  loading: false,
                });
              } else {
                set({
                  user: { ...user, profile: null } as any,
                  session,
                  loading: false,
                });
              }
            } catch (profileError) {
              console.error("프로필 조회 에러:", profileError);
              set({
                user: { ...user, profile: null } as any,
                session,
                loading: false,
              });
            }
          } else {
            set({
              user: null,
              session,
              loading: false,
            });
          }
        } else {
          console.log("세션 없음 - 인증되지 않은 상태");
          set({
            user: null,
            session: null,
            loading: false,
          });
        }
      })();

      // 타임아웃과 함께 실행
      await Promise.race([initPromise, timeoutPromise]);
    } catch (error) {
      console.error("Auth initialize error:", error);
      set({
        error: error instanceof Error ? error.message : "인증 초기화 실패",
        loading: false,
      });
    }
  },

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setPhoneNumber: (phone) => set({ phoneNumber: phone }),
  resetAuth: () =>
    set({
      user: null,
      session: null,
      loading: false,
      error: null,
      phoneNumber: null,
    }),
  clearSession: async () => {
    try {
      console.log("세션 완전 초기화 시작...");

      // Supabase 세션 로그아웃
      await supabase.auth.signOut();

      // AsyncStorage에서 Supabase 관련 데이터 삭제
      const AsyncStorage = require("@react-native-async-storage/async-storage");
      const keys = await AsyncStorage.getAllKeys();
      const supabaseKeys = keys.filter((key: string) =>
        key.includes("supabase")
      );
      if (supabaseKeys.length > 0) {
        await AsyncStorage.multiRemove(supabaseKeys);
        console.log("AsyncStorage Supabase 데이터 삭제 완료");
      }

      // 상태 초기화
      set({
        user: null,
        session: null,
        loading: false,
        error: null,
        phoneNumber: null,
      });
      console.log("세션 초기화 완료");
    } catch (error) {
      console.error("세션 초기화 에러:", error);
      set({
        user: null,
        session: null,
        loading: false,
        error: null,
        phoneNumber: null,
      });
    }
  },

  signInWithPhone: async (credentials) => {
    try {
      set({ loading: true, error: null });
      const response = await authAPI.signInWithPhone(credentials);

      if (response.success) {
        set({ loading: false, phoneNumber: credentials.phone });
        return true;
      } else {
        set({ error: response.message, loading: false });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "로그인 요청 실패",
        loading: false,
      });
      return false;
    }
  },

  verifyOTP: async (credentials) => {
    console.log("=== verifyOTP 시작 ===");
    console.log("인증 정보:", credentials);

    try {
      set({ loading: true, error: null });
      console.log("API 호출 시작...");

      const response = await authAPI.verifyOTP(credentials);
      console.log("API 응답:", response);

      if (response.success) {
        console.log("API 성공, 사용자 정보 가져오기 시작...");
        try {
          // Update user and session
          const session = await getCurrentSession();
          console.log("세션 정보:", session);

          const user = await getCurrentUser();
          console.log("사용자 정보:", user);

          if (session) {
            console.log("세션 있음, 사용자 정보 확인");

            if (user) {
              console.log("사용자 정보도 있음, 완전한 인증 상태");
              set({
                user: user as any,
                session,
                loading: false,
              });
            } else {
              console.log("사용자 정보 없음, 세션 기반으로 임시 사용자 생성");
              // 세션에서 사용자 정보 추출하여 임시 사용자 생성
              const tempUser = {
                id: session.user.id,
                phone: session.user.phone,
                created_at: session.user.created_at,
                updated_at: session.user.updated_at,
              };

              set({
                user: tempUser as any,
                session,
                loading: false,
              });

              console.log("임시 사용자 정보 생성:", tempUser);
            }

            // 즉시 상태 확인
            const currentState = get();
            console.log("즉시 상태 확인:", {
              user: !!currentState.user,
              session: !!currentState.session,
              loading: currentState.loading,
            });
            console.log("세션 상세 정보:", currentState.session);
            console.log("사용자 상세 정보:", currentState.user);

            // 사용자 프로필 확인 (닉네임 존재 여부 체크)
            try {
              const userProfile = await get().getUserProfile();
              console.log("사용자 프로필 확인:", userProfile);

              if (
                userProfile &&
                userProfile.name &&
                userProfile.name.trim() !== "" &&
                userProfile.name !== "null"
              ) {
                console.log("닉네임 있음 - 대시보드로 이동");
                // 닉네임이 있으면 사용자 정보에 프로필 추가
                set({
                  user: { ...currentState.user, profile: userProfile } as any,
                  session: currentState.session,
                  loading: false,
                });
              } else {
                console.log("닉네임 없음 - 닉네임 설정 화면으로 이동");
                // 닉네임이 없으면 프로필 없이 설정
                set({
                  user: { ...currentState.user, profile: null } as any,
                  session: currentState.session,
                  loading: false,
                });
              }
            } catch (profileError) {
              console.error("프로필 확인 에러:", profileError);
              // 프로필 확인 실패 시 닉네임 없음으로 처리
              set({
                user: { ...currentState.user, profile: null } as any,
                session: currentState.session,
                loading: false,
              });
            }

            // 추가 확인을 위한 지연된 로그
            setTimeout(() => {
              const delayedState = get();
              console.log("지연된 상태 확인:", {
                user: !!delayedState.user,
                session: !!delayedState.session,
                loading: delayedState.loading,
              });
            }, 100);

            return true;
          } else {
            console.log("세션 없음, 인증 실패로 처리");
            set({ loading: false });
            return false;
          }
        } catch (userError) {
          console.error("User data fetch error:", userError);
          // 사용자 정보 가져오기 실패해도 인증은 성공으로 처리
          console.log("사용자 정보 가져오기 실패했지만 인증은 성공으로 처리");
          set({ loading: false });
          return true;
        }
      } else {
        console.log("API 실패:", response.message);
        set({ error: response.message, loading: false });
        return false;
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      set({
        error: error instanceof Error ? error.message : "인증 코드 확인 실패",
        loading: false,
      });
      return false;
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      await supabase.auth.signOut();
      set({
        user: null,
        session: null,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "로그아웃 실패",
        loading: false,
      });
    }
  },
}));
