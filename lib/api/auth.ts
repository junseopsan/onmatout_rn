import {
  AuthResponse,
  EmailLoginCredentials,
  LoginCredentials,
  VerifyCredentials,
} from "../../types/auth";
import { supabase } from "../supabase";
import { logger } from "../utils/logger";

export const authAPI = {
  // 이메일/비밀번호 로그인 (필요 시 자동 회원가입 시도)
  signInWithEmail: async (
    credentials: EmailLoginCredentials
  ): Promise<AuthResponse> => {
    try {
      logger.log("이메일 로그인 시도:", credentials.email);

      // 비밀번호 없이 이메일만으로 로그인 (비밀번호는 서버 설정에 따라 처리)
      const { data, error } = await supabase.auth.signInWithOtp({
        email: credentials.email,
      });

      if (error) {
        logger.error("이메일 로그인 실패:", error.message);

        // Rate Limiting 에러 처리
        if (error.message.includes("you can only request this after")) {
          const match = error.message.match(/after (\d+) seconds/);
          const seconds = match ? match[1] : "잠시";
          return {
            success: false,
            message: `보안을 위해 ${seconds}초 후에 다시 시도해주세요.`,
          };
        }

        return {
          success: false,
          message:
            error.message ||
            "이메일 로그인에 실패했습니다. 이메일을 확인해주세요.",
        };
      }

      logger.log("이메일 로그인 성공:", {
        hasUser: !!data.user,
        hasSession: !!data.session,
      });

      return {
        success: true,
        message: "이메일로 로그인되었습니다.",
        data: {
          user: data.user,
          session: data.session,
        },
      };
    } catch (err) {
      logger.error("이메일 로그인 처리 중 오류:", err);
      return {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : "이메일 로그인 중 오류가 발생했습니다.",
      };
    }
  },

  // 전화번호로 로그인/회원가입 요청 (Twilio OTP 사용)
  signInWithPhone: async (
    credentials: LoginCredentials
  ): Promise<AuthResponse> => {
    try {
      logger.log("OTP 인증번호 발송 시작:", credentials.phone);

      // 전화번호 형식 정규화 (테스트 계정용)
      let normalizedPhone = credentials.phone;
      if (credentials.phone === "+821000000000") {
        normalizedPhone = "01000000000";
        logger.log(
          "전화번호 형식 정규화:",
          credentials.phone,
          "->",
          normalizedPhone
        );
      }

      // 테스트 계정 확인 (심사용)
      if (normalizedPhone === "01000000000") {
        logger.log("테스트 계정 인증번호 발송 (우회)");
        return {
          success: true,
          message: "테스트 계정용 인증번호가 발송되었습니다.",
        };
      }

      // Supabase Twilio OTP로 인증번호 발송
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: credentials.phone,
      });

      if (error) {
        logger.log("OTP 인증번호 발송 실패:", error.message);
        return {
          success: false,
          message: error.message || "인증번호 발송에 실패했습니다.",
        };
      }

      logger.log("OTP 인증번호 발송 성공");
      return {
        success: true,
        message: "인증 코드가 전송되었습니다.",
      };
    } catch (error) {
      logger.error("OTP 발송 오류:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "인증번호 발송 실패",
      };
    }
  },

  // 인증 코드 확인 (이메일 OTP 또는 전화번호 OTP 검증)
  verifyOTP: async (credentials: VerifyCredentials): Promise<AuthResponse> => {
    logger.log("=== OTP 인증번호 검증 시작 ===");
    logger.log("전화번호:", credentials.phone);
    logger.log("이메일:", credentials.email);
    logger.log("인증 코드:", credentials.code);

    try {
      // 이메일 OTP 검증
      if (credentials.email) {
        logger.log("이메일 OTP 검증 시작");

        const { data, error } = await supabase.auth.verifyOtp({
          email: credentials.email,
          token: credentials.code,
          type: "email",
        });

        if (error) {
          logger.log("이메일 OTP 검증 실패:", error.message);

          // Supabase 에러 메시지를 사용자 친화적으로 변환
          let userMessage = "인증 코드가 올바르지 않습니다.";

          if (error.message.includes("Token has expired or is invalid")) {
            userMessage =
              "인증 코드가 올바르지 않거나 만료되었습니다. 다시 확인해주세요.";
          } else if (error.message.includes("expired")) {
            userMessage =
              "인증 코드가 만료되었습니다. 새로운 코드를 요청해주세요.";
          } else if (error.message.includes("invalid")) {
            userMessage = "인증 코드가 올바르지 않습니다. 다시 입력해주세요.";
          }

          return {
            success: false,
            message: userMessage,
          };
        }

        if (data.user && data.session) {
          logger.log("이메일 OTP 검증 성공:", {
            userId: data.user.id,
            email: data.user.email,
          });

          return {
            success: true,
            message: "이메일 인증이 완료되었습니다.",
            user: {
              id: data.user.id,
              email: data.user.email,
            },
            session: data.session,
          };
        }

        return {
          success: false,
          message: "인증에 실패했습니다.",
        };
      }

      // 전화번호 OTP 검증
      if (credentials.phone) {
        logger.log("전화번호 OTP 검증 시작");

        // 전화번호 형식 정규화 (테스트 계정용)
        let normalizedPhone = credentials.phone;
        if (credentials.phone === "+821000000000") {
          normalizedPhone = "01000000000";
          logger.log(
            "전화번호 형식 정규화:",
            credentials.phone,
            "->",
            normalizedPhone
          );
        }

        // 테스트 계정 확인 (심사용)
        if (
          normalizedPhone === "01000000000" &&
          credentials.code === "123456"
        ) {
          logger.log("테스트 계정 인증번호 검증 (우회)");

          // 테스트 계정 인증 성공 처리
          logger.log("테스트 계정 인증 성공, Supabase 사용자 조회/생성 시작");

          // 기존 사용자 조회 (전화번호로)
          const { data: existingProfiles, error: profileError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("phone", "821000000000")
            .limit(1);

          if (profileError) {
            logger.log("기존 사용자 조회 실패:", profileError);
            return {
              success: false,
              message: "사용자 조회에 실패했습니다.",
            };
          }

          if (existingProfiles && existingProfiles.length > 0) {
            logger.log("기존 사용자 발견:", existingProfiles[0]);
            return {
              success: true,
              message: "테스트 계정 로그인 성공",
              user: {
                id: existingProfiles[0].user_id,
                phone: credentials.phone,
                profile: existingProfiles[0],
              },
            };
          } else {
            logger.log("기존 사용자 없음, 테스트 계정 생성 필요");
            return {
              success: false,
              message:
                "테스트 계정이 생성되지 않았습니다. 관리자에게 문의하세요.",
            };
          }
        } else if (credentials.phone === "01000000000") {
          logger.log("테스트 계정 인증번호 불일치");
          return {
            success: false,
            message: "테스트 계정의 인증번호는 123456입니다.",
          };
        }

        // Supabase Twilio OTP 인증번호 검증
        const { data, error } = await supabase.auth.verifyOtp({
          phone: credentials.phone,
          token: credentials.code,
          type: "sms",
        });

        if (error) {
          logger.log("OTP 인증번호 검증 실패:", error.message);
          return {
            success: false,
            message: error.message || "인증번호가 일치하지 않습니다.",
          };
        }

        logger.log("OTP 인증번호 검증 성공");

        // 인증 성공 후 Supabase에서 사용자 조회/생성 처리
        try {
          logger.log("Supabase 사용자 조회/생성 시작:", credentials.phone);

          // 전화번호 정규화 (숫자만 추출)
          const normalizedPhone = credentials.phone.replace(/[^0-9]/g, "");
          logger.log("정규화된 전화번호:", normalizedPhone);

          // 세션 확인 (RLS 정책이 auth.uid()를 사용하므로 필수)
          const {
            data: { user: currentUser },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !currentUser) {
            logger.error("세션 확인 실패:", userError);
            return {
              success: false,
              message: "세션이 만료되었습니다. 다시 로그인해주세요.",
            };
          }

          // 전화번호로 사용자 프로필 조회 (세션 기반)
          logger.log("전화번호로 사용자 프로필 조회:", normalizedPhone);
          const { data: existingProfilesData, error: profileError } =
            await supabase
              .from("user_profiles")
              .select("*")
              .eq("phone", normalizedPhone)
              .limit(1);

          logger.log("사용자 프로필 조회 결과:", {
            existingProfilesData,
            profileError,
          });

          let existingProfiles = null;

          if (profileError) {
            logger.log("사용자 프로필 조회 실패:", profileError);
            existingProfiles = [];
          } else if (existingProfilesData && existingProfilesData.length > 0) {
            logger.log("기존 사용자 발견:", existingProfilesData[0]);
            existingProfiles = existingProfilesData;
          } else {
            logger.log("기존 사용자 없음 확인");
            existingProfiles = [];
          }

          if (existingProfiles && existingProfiles.length > 0) {
            logger.log("기존 사용자 발견:", existingProfiles[0]);

            // 기존 사용자가 있으면 로그인 성공
            logger.log("기존 사용자 로그인 성공");

            // Supabase 세션에서 사용자 정보 사용 (세션이 있으면)
            const sessionUser = data.session?.user || data.user;

            return {
              success: true,
              message: "인증이 완료되었습니다.",
              data: {
                user: sessionUser
                  ? {
                      ...sessionUser,
                      profile: existingProfiles[0],
                    }
                  : {
                      id: existingProfiles[0].user_id,
                      phone: credentials.phone,
                      profile: existingProfiles[0],
                      created_at: new Date().toISOString(),
                    },
                session: data.session,
              },
            };
          }

          // 기존 사용자가 없으면 프로필 자동 생성
          logger.log("기존 사용자 없음 - 프로필 자동 생성");

          // user_id로 프로필 조회 (혹시 모를 경우를 대비)
          const { data: profileByUserId } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", currentUser.id)
            .maybeSingle();

          let userProfile = null;

          if (profileByUserId) {
            logger.log("user_id로 프로필 발견:", profileByUserId);
            userProfile = profileByUserId;
          } else {
            // 프로필이 없으면 자동 생성 (name은 빈 문자열로 설정하여 닉네임 설정 화면으로 리다이렉트)
            logger.log("프로필 자동 생성 시작");
            const { data: newProfile, error: createError } = await supabase
              .from("user_profiles")
              .insert({
                user_id: currentUser.id,
                phone: normalizedPhone,
                name: "", // 닉네임 설정 화면으로 리다이렉트하기 위해 빈 문자열로 설정 (NOT NULL 제약조건 만족)
                push_notifications: true,
                email_notifications: false,
                practice_reminders: true,
                theme: "light",
                language: "ko",
              })
              .select()
              .single();

            if (createError) {
              logger.error("프로필 생성 실패:", createError);
              // 프로필 생성 실패 시 에러 반환 (세션이 있어도 프로필이 없으면 문제)
              return {
                success: false,
                message: "프로필 생성에 실패했습니다. 다시 시도해주세요.",
              };
            }

            logger.log("프로필 자동 생성 성공:", newProfile);
            userProfile = newProfile;
          }

          // Supabase 세션에서 사용자 정보 사용
          const sessionUser = data.session?.user || data.user || currentUser;

          return {
            success: true,
            message: "인증이 완료되었습니다.",
            data: {
              user: sessionUser
                ? {
                    ...sessionUser,
                    profile: userProfile,
                  }
                : {
                    id: currentUser.id,
                    phone: credentials.phone,
                    profile: userProfile,
                    created_at: new Date().toISOString(),
                  },
              session: data.session,
            },
          };
        } catch (supabaseError) {
          logger.log("Supabase 처리 중 오류:", supabaseError);
          // OTP 인증은 성공했으므로 성공으로 처리
          // Supabase가 세션을 자동으로 저장했으므로 세션과 사용자 정보 반환
          return {
            success: true,
            message: "인증이 완료되었습니다.",
            data: {
              user: data.user,
              session: data.session,
            },
          };
        }
      } // 전화번호 OTP 검증 블록 끝

      // 이메일과 전화번호 둘 다 제공되지 않은 경우
      return {
        success: false,
        message: "이메일 또는 전화번호가 필요합니다.",
      };
    } catch (error) {
      logger.error("인증번호 검증 오류:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "인증번호 검증 실패",
      };
    }
  },

  // 로그아웃
  signOut: async (): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message: "로그아웃되었습니다.",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "로그아웃 실패",
      };
    }
  },
};
