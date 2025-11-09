import {
  AuthResponse,
  LoginCredentials,
  VerifyCredentials,
} from "../../types/auth";
import { supabase } from "../supabase";

export const authAPI = {
  // 전화번호로 로그인/회원가입 요청 (Twilio OTP 사용)
  signInWithPhone: async (
    credentials: LoginCredentials
  ): Promise<AuthResponse> => {
    try {
      console.log("OTP 인증번호 발송 시작:", credentials.phone);

      // 전화번호 형식 정규화 (테스트 계정용)
      let normalizedPhone = credentials.phone;
      if (credentials.phone === "+821000000000") {
        normalizedPhone = "01000000000";
        console.log(
          "전화번호 형식 정규화:",
          credentials.phone,
          "->",
          normalizedPhone
        );
      }

      // 테스트 계정 확인 (심사용)
      if (normalizedPhone === "01000000000") {
        console.log("테스트 계정 인증번호 발송 (우회)");
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
        console.log("OTP 인증번호 발송 실패:", error.message);
        return {
          success: false,
          message: error.message || "인증번호 발송에 실패했습니다.",
        };
      }

      console.log("OTP 인증번호 발송 성공");
      return {
        success: true,
        message: "인증 코드가 전송되었습니다.",
      };
    } catch (error) {
      console.error("OTP 발송 오류:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "인증번호 발송 실패",
      };
    }
  },

  // 인증 코드 확인 (Twilio OTP 검증)
  verifyOTP: async (credentials: VerifyCredentials): Promise<AuthResponse> => {
    console.log("=== OTP 인증번호 검증 시작 ===");
    console.log("전화번호:", credentials.phone);
    console.log("인증 코드:", credentials.code);

    try {
      // 전화번호 형식 정규화 (테스트 계정용)
      let normalizedPhone = credentials.phone;
      if (credentials.phone === "+821000000000") {
        normalizedPhone = "01000000000";
        console.log(
          "전화번호 형식 정규화:",
          credentials.phone,
          "->",
          normalizedPhone
        );
      }

      // 테스트 계정 확인 (심사용)
      if (normalizedPhone === "01000000000" && credentials.code === "123456") {
        console.log("테스트 계정 인증번호 검증 (우회)");

        // 테스트 계정 인증 성공 처리
        console.log("테스트 계정 인증 성공, Supabase 사용자 조회/생성 시작");

        // 기존 사용자 조회 (전화번호로)
        const { data: existingProfiles, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("phone", "821000000000")
          .limit(1);

        if (profileError) {
          console.log("기존 사용자 조회 실패:", profileError);
          return {
            success: false,
            message: "사용자 조회에 실패했습니다.",
          };
        }

        if (existingProfiles && existingProfiles.length > 0) {
          console.log("기존 사용자 발견:", existingProfiles[0]);
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
          console.log("기존 사용자 없음, 테스트 계정 생성 필요");
          return {
            success: false,
            message:
              "테스트 계정이 생성되지 않았습니다. 관리자에게 문의하세요.",
          };
        }
      } else if (credentials.phone === "01000000000") {
        console.log("테스트 계정 인증번호 불일치");
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
        console.log("OTP 인증번호 검증 실패:", error.message);
        return {
          success: false,
          message: error.message || "인증번호가 일치하지 않습니다.",
        };
      }

      console.log("OTP 인증번호 검증 성공");

      // 인증 성공 후 Supabase에서 사용자 조회/생성 처리
      try {
        console.log("Supabase 사용자 조회/생성 시작:", credentials.phone);

        // 전화번호 정규화 (숫자만 추출)
        const normalizedPhone = credentials.phone.replace(/[^0-9]/g, "");
        console.log("정규화된 전화번호:", normalizedPhone);

        // 세션 확인 (RLS 정책이 auth.uid()를 사용하므로 필수)
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !currentUser) {
          console.error("세션 확인 실패:", userError);
          return {
            success: false,
            message: "세션이 만료되었습니다. 다시 로그인해주세요.",
          };
        }

        // 전화번호로 사용자 프로필 조회 (세션 기반)
        console.log("전화번호로 사용자 프로필 조회:", normalizedPhone);
        const { data: existingProfilesData, error: profileError } =
          await supabase
            .from("user_profiles")
            .select("*")
            .eq("phone", normalizedPhone)
            .limit(1);

        console.log("사용자 프로필 조회 결과:", {
          existingProfilesData,
          profileError,
        });

        let existingProfiles = null;

        if (profileError) {
          console.log("사용자 프로필 조회 실패:", profileError);
          existingProfiles = [];
        } else if (existingProfilesData && existingProfilesData.length > 0) {
          console.log("기존 사용자 발견:", existingProfilesData[0]);
          existingProfiles = existingProfilesData;
        } else {
          console.log("기존 사용자 없음 확인");
          existingProfiles = [];
        }

        if (existingProfiles && existingProfiles.length > 0) {
          console.log("기존 사용자 발견:", existingProfiles[0]);

          // 기존 사용자가 있으면 로그인 성공
          console.log("기존 사용자 로그인 성공");

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

        // 기존 사용자가 없으면 오류 반환
        console.log("기존 사용자 없음 - 회원가입 필요");
        return {
          success: false,
          message: "등록되지 않은 전화번호입니다. 회원가입이 필요합니다.",
        };
      } catch (supabaseError) {
        console.log("Supabase 처리 중 오류:", supabaseError);
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
    } catch (error) {
      console.error("인증번호 검증 오류:", error);
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
