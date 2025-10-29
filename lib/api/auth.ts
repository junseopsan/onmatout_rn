import {
  AuthResponse,
  LoginCredentials,
  VerifyCredentials,
} from "../../types/auth";
import { supabase } from "../supabase";
import { sendVerificationCode, verifyCode } from "./sms";

export const authAPI = {
  // 전화번호로 로그인/회원가입 요청 (네이버 SMS 사용)
  signInWithPhone: async (
    credentials: LoginCredentials
  ): Promise<AuthResponse> => {
    try {
      console.log("네이버 SMS 인증번호 발송 시작:", credentials.phone);

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

      // 네이버 SMS로 인증번호 발송
      const result = await sendVerificationCode(credentials.phone);

      if (result.success) {
        console.log("네이버 SMS 인증번호 발송 성공");
        return {
          success: true,
          message: "인증 코드가 전송되었습니다.",
        };
      } else {
        console.log("네이버 SMS 인증번호 발송 실패:", result.message);
        return {
          success: false,
          message: result.message || "인증번호 발송에 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("SMS 발송 오류:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "인증번호 발송 실패",
      };
    }
  },

  // 인증 코드 확인 (네이버 SMS 검증)
  verifyOTP: async (credentials: VerifyCredentials): Promise<AuthResponse> => {
    console.log("=== 네이버 SMS 인증번호 검증 시작 ===");
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
        // 테스트 계정용 가짜 인증 성공 처리
        const result = { success: true };

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

      // 네이버 SMS 인증번호 검증
      const result = await verifyCode(credentials.phone, credentials.code);

      if (result.success) {
        console.log("네이버 SMS 인증번호 검증 성공");

        // 인증 성공 후 Supabase에서 사용자 생성/로그인 처리
        try {
          // 네이버 SMS 인증이 성공했으므로 Supabase에서 사용자 조회/생성
          console.log("Supabase 사용자 조회/생성 시작:", credentials.phone);

          // 네이버 SMS 인증 성공 후 기존 사용자 조회
          console.log("기존 사용자 조회 시작:", credentials.phone);

          // user_profiles 테이블에서 전화번호로 사용자 조회
          console.log("조회할 전화번호:", credentials.phone);

          // 전화번호 정규화 (숫자만 추출)
          const normalizedPhone = credentials.phone.replace(/[^0-9]/g, "");
          console.log("정규화된 전화번호:", normalizedPhone);

          // RPC로 전화번호 존재 여부 조회 (RLS 안전)
          console.log("RPC로 전화번호 존재 여부 조회:", normalizedPhone);
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            "get_user_by_phone",
            { p_phone: normalizedPhone }
          );

          console.log("RPC 조회 결과:", { rpcData, rpcError });

          let existingProfiles = null;
          let profileError = null;

          if (rpcError) {
            console.log("RPC 조회 실패:", rpcError);
            profileError = rpcError;
          } else if (rpcData && rpcData.length > 0) {
            console.log("RPC로 기존 사용자 발견:", rpcData[0]);
            // RPC 결과를 기존 형식에 맞게 변환
            existingProfiles = [
              {
                user_id: rpcData[0].user_id,
                phone: rpcData[0].phone,
                // 필요한 다른 필드들은 별도로 조회하거나 기본값 사용
              },
            ];
          } else {
            console.log("RPC로 기존 사용자 없음 확인");
            existingProfiles = [];
          }

          console.log("사용자 프로필 조회 결과:", {
            existingProfiles,
            profileError,
          });

          if (profileError) {
            console.log("사용자 프로필 조회 오류:", profileError);
          }

          if (existingProfiles && existingProfiles.length > 0) {
            console.log("기존 사용자 발견:", existingProfiles[0]);
            
            // 기존 사용자가 있으면 익명 로그인으로 세션 생성
            console.log("익명 로그인으로 세션 생성 시작");
            const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
            
            if (anonError) {
              console.log("익명 로그인 실패:", anonError);
              return {
                success: false,
                message: "로그인 세션 생성에 실패했습니다.",
              };
            }
            
            console.log("익명 로그인 성공:", anonData.user?.id);
            
            // 익명 사용자와 기존 사용자 연결 (user_profiles 업데이트)
            try {
              await supabase
                .from("user_profiles")
                .update({ user_id: anonData.user!.id })
                .eq("user_id", existingProfiles[0].user_id);
              console.log("사용자 연결 완료");
            } catch (linkError) {
              console.log("사용자 연결 실패:", linkError);
            }
            
            return {
              success: true,
              message: "인증이 완료되었습니다.",
              data: {
                user: {
                  id: anonData.user!.id,
                  phone: credentials.phone,
                  profile: existingProfiles[0],
                  created_at: anonData.user!.created_at,
                },
                session: anonData.session,
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
          // 네이버 SMS 인증은 성공했으므로 성공으로 처리
          return {
            success: true,
            message: "인증이 완료되었습니다.",
            data: {
              user: {
                id: `temp_${Date.now()}`,
                phone: credentials.phone,
                created_at: new Date().toISOString(),
              },
              session: null,
            },
          };
        }
      } else {
        console.log("네이버 SMS 인증번호 검증 실패:", result.message);
        return {
          success: false,
          message: result.message || "인증번호가 일치하지 않습니다.",
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
