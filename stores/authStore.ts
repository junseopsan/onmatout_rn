import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { authAPI } from "../lib/api/auth";
import { userAPI } from "../lib/api/user";
import { getCurrentSession, getCurrentUser, supabase } from "../lib/supabase";
import {
  AuthState,
  EmailLoginCredentials,
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
  clearUser: () => void;
  signOut: () => Promise<void>;
  signInWithEmail: (credentials: EmailLoginCredentials) => Promise<boolean>;
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
        return false;
      }

      // 임시 사용자 ID인지 확인 (temp_로 시작)
      if (currentUser.id.startsWith("temp_")) {
        console.log("임시 사용자 - 로컬에만 저장");

        // 임시 사용자에 대해서는 로컬에만 저장
        const updatedUser = {
          ...currentUser,
          profile: {
            ...currentUser.profile,
            name: nickname,
            id: currentUser.id,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any,
        };

        set({ user: updatedUser });
        console.log("임시 사용자 프로필 로컬 저장 완료:", updatedUser);
        return true;
      }

      // 실제 사용자인 경우 Supabase에 저장
      const response = await userAPI.upsertUserProfile(currentUser.id, {
        name: nickname,
      });

      if (response.success) {
        console.log("사용자 프로필 저장 성공:", response.data);

        // 사용자 정보 즉시 업데이트
        const updatedUser = {
          ...currentUser,
          profile: {
            ...currentUser.profile,
            name: nickname, // 닉네임 직접 설정
            ...(response.data || {}), // 서버에서 반환된 데이터가 있으면 병합
            updated_at: new Date().toISOString(), // 업데이트 시간 설정
          } as any, // 타입 호환성을 위해 any로 캐스팅
        };

        set({ user: updatedUser });
        console.log("사용자 정보 업데이트 완료:", updatedUser);
        console.log("업데이트된 프로필:", updatedUser.profile);

        return true;
      } else {
        console.log("사용자 프로필 저장 실패:", response.message);
        return false;
      }
    } catch (error) {
      console.log("사용자 프로필 저장 오류:", error);
      return false;
    }
  },

  getUserProfile: async () => {
    try {
      console.log("사용자 프로필 조회 시작");

      const currentUser = get().user;
      if (!currentUser) {
        console.log("현재 사용자 없음");
        return null;
      }

      // 이미 프로필이 있으면 캐시된 데이터 반환
      if (currentUser.profile && currentUser.profile.name) {
        console.log("캐시된 프로필 사용:", currentUser.profile);
        return currentUser.profile;
      }

      console.log("사용자 프로필 조회 시작:", currentUser.id);
      const response = await userAPI.getUserProfile(currentUser.id);

      if (response.success) {
        console.log("사용자 프로필 조회 성공:", response.data);
        return response.data;
      } else {
        console.log("사용자 프로필 조회 실패:", response.message);
        return null;
      }
    } catch (error) {
      console.log("사용자 프로필 조회 오류:", error);
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
        // 먼저 로컬 스토리지에서 사용자 정보 복원 시도
        try {
          const storedUser = await AsyncStorage.getItem("user");
          const storedSession = await AsyncStorage.getItem("session");

          console.log("로컬 스토리지에서 복원:", {
            hasUser: !!storedUser,
            hasSession: !!storedSession,
          });

          if (storedUser) {
            const user = JSON.parse(storedUser);
            const session = storedSession ? JSON.parse(storedSession) : null;

            console.log("복원된 사용자:", user?.id);

            // 로컬 스토리지에서 복원한 후 서버에서 최신 프로필 가져오기
            if (user?.id) {
              try {
                const userProfile = await userAPI.getUserProfile(user.id);
                console.log("최신 사용자 프로필:", userProfile);

                if (
                  userProfile.success &&
                  userProfile.data &&
                  userProfile.data.name &&
                  userProfile.data.name.trim() !== "" &&
                  userProfile.data.name !== "null"
                ) {
                  set({
                    user: { ...user, profile: userProfile.data } as any,
                    session: session,
                    loading: false,
                  });
                } else {
                  set({
                    user: { ...user, profile: user.profile || null } as any,
                    session: session,
                    loading: false,
                  });
                }
              } catch (profileError) {
                console.log("프로필 조회 실패, 로컬 데이터 사용:", profileError);
                set({
                  user: user as any,
                  session: session,
                  loading: false,
                });
              }
            } else {
              set({
                user: user as any,
                session: session,
                loading: false,
              });
            }

            console.log("로컬 스토리지에서 사용자 정보 복원 완료");
            return;
          }
        } catch (storageError) {
          console.log("로컬 스토리지 복원 실패:", storageError);
        }

        // 로컬 스토리지에 사용자 정보가 없으면 Supabase 세션 확인
        const session = await getCurrentSession();
        console.log("=== Supabase 세션 확인 ===");
        console.log("세션 존재:", !!session);

        if (session) {
          const user = await getCurrentUser();
          console.log("Supabase 사용자:", user);

          if (user) {
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
          console.log("세션 없음 - 로그인 필요");
          set({
            user: null,
            session: null,
            loading: false,
          });
        }
      })();

      // 타임아웃과 함께 실행
      await Promise.race([initPromise, timeoutPromise]);

      // 인증 상태 구독으로 세션/유저 자동 동기화 (앱 생명주기 동안 1회 설정)
      const { data } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          try {
            const nextUser = session?.user ?? null;
            
            // 사용자가 있으면 최신 프로필 가져오기
            if (nextUser?.id) {
              try {
                const userProfile = await userAPI.getUserProfile(nextUser.id);
                if (
                  userProfile.success &&
                  userProfile.data &&
                  userProfile.data.name &&
                  userProfile.data.name.trim() !== "" &&
                  userProfile.data.name !== "null"
                ) {
                  const userWithProfile = { ...nextUser, profile: userProfile.data } as any;
                  set({ session: session ?? null, user: userWithProfile });
                  
                  // 로컬에도 보존
                  await AsyncStorage.setItem("user", JSON.stringify(userWithProfile));
                } else {
                  set({ session: session ?? null, user: (nextUser as any) ?? null });
                  if (nextUser) {
                    await AsyncStorage.setItem("user", JSON.stringify(nextUser));
                  } else {
                    await AsyncStorage.removeItem("user");
                  }
                }
              } catch (profileError) {
                console.log("프로필 조회 실패:", profileError);
                set({ session: session ?? null, user: (nextUser as any) ?? null });
                if (nextUser) {
                  await AsyncStorage.setItem("user", JSON.stringify(nextUser));
                } else {
                  await AsyncStorage.removeItem("user");
                }
              }
            } else {
              set({ session: session ?? null, user: (nextUser as any) ?? null });
              if (nextUser) {
                await AsyncStorage.setItem("user", JSON.stringify(nextUser));
              } else {
                await AsyncStorage.removeItem("user");
              }
            }

            if (session) {
              await AsyncStorage.setItem("session", JSON.stringify(session));
            } else {
              await AsyncStorage.removeItem("session");
            }
          } catch (e) {
            console.log("auth state sync 실패:", e);
          }
        }
      );

      // 구독 핸들을 상태에 들고 있지 않으므로, 프로세스 생존 동안 유지됨
    } catch (error) {
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
      set({
        user: null,
        session: null,
        loading: false,
        error: null,
        phoneNumber: null,
      });
    }
  },

  clearUser: () => {
    console.log("사용자 정보 초기화");

    // 로컬 스토리지에서 사용자 정보 삭제
    try {
      AsyncStorage.removeItem("user");
      AsyncStorage.removeItem("session");
      console.log("로컬 스토리지에서 사용자 정보 삭제 완료");
    } catch (storageError) {
      console.log("로컬 스토리지 삭제 실패:", storageError);
    }

    set({
      user: null,
      session: null,
      loading: false,
      error: null,
      phoneNumber: null,
    });
  },

  signInWithEmail: async (credentials) => {
    try {
      console.log("=== signInWithEmail 시작 ===", credentials.email);
      set({ loading: true, error: null });

      const response = await authAPI.signInWithEmail(credentials);
      console.log("signInWithEmail API 응답:", response);

      if (response.success) {
        const apiSession = response.data?.session || response.session || null;
        const apiUser = response.data?.user || response.user || null;

        set({
          user: apiUser as any,
          session: apiSession,
          loading: false,
          error: null,
        });

        try {
          if (apiUser) {
            await AsyncStorage.setItem("user", JSON.stringify(apiUser));
          }
          if (apiSession) {
            await AsyncStorage.setItem("session", JSON.stringify(apiSession));
          }
        } catch (storageError) {
          console.log("이메일 로그인 후 로컬 저장 실패:", storageError);
        }

        return true;
      } else {
        set({ error: response.message, loading: false });
        return false;
      }
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "이메일 로그인 요청 실패",
        loading: false,
      });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  signInWithPhone: async (credentials) => {
    try {
      console.log("=== signInWithPhone 시작 ===");
      set({ loading: true, error: null });

      const response = await authAPI.signInWithPhone(credentials);
      console.log("signInWithPhone API 응답:", response);

      if (response.success) {
        console.log("signInWithPhone 성공");
        set({ loading: false, phoneNumber: credentials.phone });
        return true;
      } else {
        console.log("signInWithPhone 실패:", response.message);
        set({ error: response.message, loading: false });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "로그인 요청 실패",
        loading: false,
      });
      return false;
    } finally {
      // 항상 loading을 false로 설정
      set({ loading: false });
    }
  },

  verifyOTP: async (credentials) => {
    console.log("=== authStore verifyOTP 시작 ===");
    console.log("인증 정보:", credentials);
    console.log("전화번호:", credentials.phone);
    console.log("인증 코드:", credentials.code);

    try {
      set({ loading: true, error: null });
      console.log("API 호출 시작...");

      const response = await authAPI.verifyOTP(credentials);
      console.log("API 응답:", response);

      if (response.success) {
        console.log("=== API 성공, 사용자 정보 가져오기 시작 ===");
        console.log("API 응답 데이터:", response.data);

        // API 응답에서 직접 세션과 사용자 정보 가져오기
        const apiSession = response.data?.session || response.session;
        const apiUser = response.data?.user || response.user;

        console.log("API 응답 세션:", apiSession);
        console.log("API 응답 사용자:", apiUser);

        try {
          // Supabase 세션 우선 사용
          let session = apiSession;
          let user = apiUser;

          // API 응답에 세션이 없으면 getCurrentSession 시도 (Supabase가 자동으로 저장했을 수 있음)
          if (!session) {
            console.log("API 응답에 세션 없음, getCurrentSession 시도");
            session = await getCurrentSession();
            console.log("getCurrentSession 결과:", session);
          }

          // 세션이 있으면 세션에서 사용자 정보 가져오기
          if (session && session.user) {
            console.log("세션에서 사용자 정보 사용");
            user = session.user;
          } else if (!user && session) {
            console.log("API 응답에 사용자 없음, getCurrentUser 시도");
            user = await getCurrentUser();
            console.log("getCurrentUser 결과:", user);
          }

          // 테스트 계정의 경우 세션이 없을 수 있으므로 사용자 정보만으로 처리
          if (!session && user) {
            console.log(
              "세션 없음, 그러나 사용자 정보 있음 (테스트 계정) → 로그인 성공 처리"
            );
            // API가 프로필을 포함해줬다면 반영
            const apiProfile = (response.data?.user as any)?.profile ?? null;
            set({
              user: apiProfile
                ? ({ ...user, profile: apiProfile } as any)
                : (user as any),
              session: null,
            });

            // 프로필 추가 확인 시도 (실패해도 무시)
            try {
              const userProfile = await get().getUserProfile();
              if (userProfile) {
                set({
                  user: { ...(get().user as any), profile: userProfile } as any,
                });
              }
            } catch {}

            set({ loading: false });
            return true;
          } else if (session) {
            console.log("세션 있음, Supabase 세션 기반 인증");

            // 세션에서 사용자 정보 사용
            if (session.user) {
              console.log("세션에서 사용자 정보 사용");
              user = session.user;
            }

            // API 응답에 프로필이 포함되어 있으면 사용
            const apiProfile = (response.data?.user as any)?.profile ?? null;

            if (apiProfile) {
              console.log("API 응답에 프로필 포함됨");
              set({
                user: { ...user, profile: apiProfile } as any,
                session,
              });
            } else {
              console.log("API 응답에 프로필 없음, 세션 기반으로 사용자 설정");
              set({
                user: user as any,
                session,
              });
            }

            // 즉시 상태 확인
            const currentState = get();
            console.log("=== verifyOTP 즉시 상태 확인 ===");
            console.log("user 존재:", !!currentState.user);
            console.log("session 존재:", !!currentState.session);
            console.log("loading:", currentState.loading);
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
                });
              } else {
                console.log("닉네임 없음 - 닉네임 설정 화면으로 이동");
                // 닉네임이 없으면 프로필 없이 설정
                set({
                  user: { ...currentState.user, profile: null } as any,
                  session: currentState.session,
                });
              }
            } catch (profileError) {
              // 프로필 확인 실패 시 닉네임 없음으로 처리
              set({
                user: { ...currentState.user, profile: null } as any,
                session: currentState.session,
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

            // 마지막에 loading 상태를 false로 설정
            set({ loading: false });
            return true;
          } else {
            console.log("사용자 정보와 세션 모두 없음, 인증 실패로 처리");
            set({ loading: false });
            return false;
          }
        } catch (userError) {
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
      set({
        error: error instanceof Error ? error.message : "인증 코드 확인 실패",
        loading: false,
      });
      return false;
    } finally {
      // 항상 loading을 false로 설정
      set({ loading: false });
    }
  },

  // 로그아웃 기능 비활성화 (세션 유지)
  signOut: async () => {
    console.log("signOut 호출됨 - 현재 빌드에서는 비활성화됨");
    set({ loading: false });
  },
}));
