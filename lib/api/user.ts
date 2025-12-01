import { UpdateUserProfileRequest, UserProfile } from "../../types/user";
import { ensureAuthenticated, supabase } from "../supabase";
import { logger } from "../utils/logger";

export const userAPI = {
  // 닉네임 중복 확인
  checkNicknameDuplicate: async (
    nickname: string,
    excludeUserId?: string
  ): Promise<{
    success: boolean;
    isDuplicate: boolean;
    message?: string;
  }> => {
    try {
      logger.log("닉네임 중복 확인 시작:", { nickname, excludeUserId });

      if (!nickname || !nickname.trim()) {
        return {
          success: false,
          isDuplicate: false,
          message: "닉네임을 입력해주세요.",
        };
      }

      // 닉네임 정규화 (공백 제거, 소문자 변환)
      const normalizedNickname = nickname.trim().toLowerCase();

      // 모든 프로필 조회 (RLS 정책으로 인해 자신의 프로필만 조회되므로,
      // 중복 확인을 위해서는 다른 접근이 필요할 수 있음)
      // 하지만 일반적으로는 모든 사용자의 닉네임을 확인할 수 있어야 함
      let query = supabase.from("user_profiles").select("id, user_id, name");

      // 특정 사용자 제외 (닉네임 수정 시 자신의 닉네임은 제외)
      if (excludeUserId) {
        query = query.neq("user_id", excludeUserId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("닉네임 중복 확인 실패:", error);
        return {
          success: false,
          isDuplicate: false,
          message: error.message,
        };
      }

      // 정확히 일치하는 닉네임이 있는지 확인 (대소문자 구분 없이, 공백 제거 후)
      const isDuplicate =
        data?.some((profile) => {
          if (!profile.name) return false;
          const profileNameNormalized = profile.name.trim().toLowerCase();
          return profileNameNormalized === normalizedNickname;
        }) || false;

      logger.log("닉네임 중복 확인 결과:", {
        isDuplicate,
        count: data?.length,
      });
      return {
        success: true,
        isDuplicate,
      };
    } catch (error) {
      logger.error("닉네임 중복 확인 중 오류:", error);
      return {
        success: false,
        isDuplicate: false,
        message: "닉네임 중복 확인 중 오류가 발생했습니다.",
      };
    }
  },

  // 사용자 프로필 조회
  getUserProfile: async (
    userId: string
  ): Promise<{
    success: boolean;
    data?: UserProfile;
    message?: string;
  }> => {
    try {
      logger.log("사용자 프로필 조회 시작:", userId);

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(); // single() 대신 maybeSingle() 사용 (0개 또는 1개 행 허용)

      if (error) {
        logger.error("사용자 프로필 조회 실패:", error);
        return {
          success: false,
          message: error.message,
        };
      }

      if (!data) {
        logger.log("사용자 프로필이 없습니다.");
        return {
          success: false,
          message: "사용자 프로필을 찾을 수 없습니다.",
        };
      }

      logger.log("사용자 프로필 조회 성공:", data);
      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error("사용자 프로필 조회 오류:", error);
      return {
        success: false,
        message: "사용자 프로필 조회 중 오류가 발생했습니다.",
      };
    }
  },

  // 사용자 프로필 생성 또는 업데이트
  upsertUserProfile: async (
    userId: string,
    profile: UpdateUserProfileRequest
  ): Promise<{
    success: boolean;
    data?: UserProfile;
    message?: string;
  }> => {
    try {
      logger.log("=== 사용자 프로필 저장 시작 ===");
      logger.log("입력 파라미터:", { userId, profile });

      // 세션 확인 (RPC를 사용하더라도 세션이 있어야 함)
      const auth = await ensureAuthenticated();
      if (!auth) {
        return {
          success: false,
          message: "사용자 인증이 필요합니다. 다시 로그인해주세요.",
        };
      }

      // userId가 세션의 사용자 ID와 일치하는지 확인
      if (userId !== auth.userId) {
        return {
          success: false,
          message: "권한이 없습니다.",
        };
      }

      // 세션 명시적으로 확인 (RLS 정책이 auth.uid()를 사용하므로 필수)
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

      if (currentUser.id !== userId) {
        logger.error("세션 사용자 ID와 요청 사용자 ID가 일치하지 않습니다.");
        return {
          success: false,
          message: "권한이 없습니다.",
        };
      }

      // 기존 프로필 조회 (name 필드가 필수이므로)
      const existingProfile = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(); // single() 대신 maybeSingle() 사용

      // 업데이트할 데이터 준비
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // name이 제공되지 않았고 기존 프로필이 있으면 기존 name 유지
      if (profile.name !== undefined) {
        updateData.name = profile.name;
      } else if (existingProfile.data?.name) {
        updateData.name = existingProfile.data.name;
      }

      if (profile.email !== undefined) updateData.email = profile.email;
      if (profile.avatar_url !== undefined)
        updateData.avatar_url = profile.avatar_url;
      if (profile.push_notifications !== undefined)
        updateData.push_notifications = profile.push_notifications;
      if (profile.email_notifications !== undefined)
        updateData.email_notifications = profile.email_notifications;
      if (profile.practice_reminders !== undefined)
        updateData.practice_reminders = profile.practice_reminders;
      if (profile.theme !== undefined) updateData.theme = profile.theme;
      if (profile.language !== undefined)
        updateData.language = profile.language;

      let result;

      // 기존 프로필이 있으면 update, 없으면 insert
      if (existingProfile.data) {
        logger.log("기존 프로필 업데이트 시작...");
        result = await supabase
          .from("user_profiles")
          .update(updateData)
          .eq("user_id", userId)
          .select()
          .single();
      } else {
        logger.log("새 프로필 생성 시작...");
        // 새 프로필 생성 시 필수 필드 포함
        const insertData = {
          user_id: userId,
          name: profile.name || "사용자", // name이 필수이므로 기본값 제공
          ...updateData,
        };
        result = await supabase
          .from("user_profiles")
          .insert(insertData)
          .select()
          .single();
      }

      if (result.error) {
        logger.error("프로필 저장 실패:", result.error);

        // UNIQUE 제약조건 위반 에러 체크
        if (
          result.error.code === "23505" || // PostgreSQL unique violation
          result.error.message?.toLowerCase().includes("unique") ||
          result.error.message?.toLowerCase().includes("duplicate")
        ) {
          return {
            success: false,
            message: "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.",
          };
        }

        return {
          success: false,
          message: `프로필 저장 실패: ${result.error.message}`,
        };
      }

      logger.log("프로필 저장 성공:", result.data);
      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      logger.error("사용자 프로필 저장 중 오류:", error);
      return {
        success: false,
        message: "사용자 프로필 저장 중 오류가 발생했습니다.",
      };
    }
  },

  // 사용자 프로필 업데이트 (기존 프로필이 있는 경우)
  updateUserProfile: async (
    userId: string,
    profile: UpdateUserProfileRequest
  ): Promise<{
    success: boolean;
    data?: UserProfile;
    message?: string;
  }> => {
    try {
      logger.log("사용자 프로필 업데이트 시작:", { userId, profile });

      // 업데이트할 데이터 준비
      const updateData: any = {};
      if (profile.name !== undefined) updateData.name = profile.name;
      if (profile.email !== undefined) updateData.email = profile.email;
      if (profile.avatar_url !== undefined)
        updateData.avatar_url = profile.avatar_url;
      if (profile.push_notifications !== undefined)
        updateData.push_notifications = profile.push_notifications;
      if (profile.email_notifications !== undefined)
        updateData.email_notifications = profile.email_notifications;
      if (profile.practice_reminders !== undefined)
        updateData.practice_reminders = profile.practice_reminders;
      if (profile.theme !== undefined) updateData.theme = profile.theme;
      if (profile.language !== undefined)
        updateData.language = profile.language;

      const { data, error } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      logger.log("사용자 프로필 업데이트 성공:", data);
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      logger.error("사용자 프로필 업데이트 중 오류:", error);
      return {
        success: false,
        message: "사용자 프로필 업데이트 중 오류가 발생했습니다.",
      };
    }
  },

  // 계정 삭제
  deleteAccount: async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    try {
      const auth = await ensureAuthenticated();
      if (!auth) {
        return {
          success: false,
          message: "로그인이 필요합니다. 다시 시도해주세요.",
        };
      }

      const { userId, session } = auth;

      // 세션 및 사용자 확인
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user || user.id !== userId) {
        return {
          success: false,
          message: "세션이 만료되었습니다. 다시 로그인해주세요.",
        };
      }

      // 사용자 데이터 삭제 (연관 테이블)
      // user_profiles에는 사용자 정보와 설정이 모두 포함되어 있음
      const tablesToClean = [
        "practice_records",
        "user_favorite_asanas",
        "user_profiles",
      ];

      for (const table of tablesToClean) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("user_id", userId);

        if (error) {
          logger.error(`테이블 ${table} 데이터 삭제 실패:`, error);
          return {
            success: false,
            message: "계정 데이터를 삭제하는 중 오류가 발생했습니다.",
          };
        }
      }

      // Supabase Auth 사용자 삭제는 관리자 권한이 필요하므로
      // 사용자 데이터만 삭제하고 로그아웃 처리
      // auth.users는 CASCADE로 자동 삭제되거나 관리자가 삭제해야 함
      logger.log("사용자 데이터 삭제 완료. 로그아웃 처리 중...");
      await supabase.auth.signOut();

      return {
        success: true,
      };
    } catch (error) {
      logger.error("계정 삭제 중 오류:", error);
      return {
        success: false,
        message: "계정 삭제 중 오류가 발생했습니다.",
      };
    }
  },
};
