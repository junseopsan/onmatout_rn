import { UpdateUserProfileRequest, UserProfile } from "../../types/user";
import { supabase } from "../supabase";

export const userAPI = {
  // 사용자 프로필 조회
  getUserProfile: async (
    userId: string
  ): Promise<{
    success: boolean;
    data?: UserProfile;
    message?: string;
  }> => {
    try {
      console.log("사용자 프로필 조회 시작:", userId);

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("사용자 프로필 조회 에러:", error);
        return {
          success: false,
          message: error.message,
        };
      }

      console.log("사용자 프로필 조회 성공:", data);
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("사용자 프로필 조회 예외:", error);
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
      console.log("사용자 프로필 저장 시작:", { userId, profile });

      // 먼저 기존 프로필이 있는지 확인
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116는 데이터가 없는 경우
        console.error("프로필 확인 에러:", checkError);
        return {
          success: false,
          message: checkError.message,
        };
      }

      let result;

      if (existingProfile) {
        // 기존 프로필이 있으면 업데이트
        console.log("기존 프로필 업데이트");
        console.log("업데이트할 데이터:", {
          user_id: userId,
          name: profile.name,
        });
        console.log("기존 프로필:", existingProfile);

        result = await supabase
          .from("user_profiles")
          .update({
            name: profile.name,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .select();

        console.log("UPDATE 결과:", result);
      } else {
        // 기존 프로필이 없으면 새로 생성
        console.log("새 프로필 생성");
        console.log("삽입할 데이터:", { user_id: userId, name: profile.name });

        result = await supabase
          .from("user_profiles")
          .insert({
            user_id: userId,
            name: profile.name,
          })
          .select();

        console.log("INSERT 결과:", result);
      }

      if (result.error) {
        console.error("사용자 프로필 저장 에러:", result.error);
        console.error("에러 코드:", result.error.code);
        console.error("에러 상세:", result.error.details);
        console.error("에러 힌트:", result.error.hint);
        return {
          success: false,
          message: result.error.message || "알 수 없는 에러",
        };
      }

      console.log("사용자 프로필 저장 성공:", result.data);
      return {
        success: true,
        data: result.data?.[0] || null, // 첫 번째 결과 반환
      };
    } catch (error) {
      console.error("사용자 프로필 저장 예외:", error);
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
      console.log("사용자 프로필 업데이트 시작:", { userId, profile });

      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          name: profile.name,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select();

      if (error) {
        console.error("사용자 프로필 업데이트 에러:", error);
        return {
          success: false,
          message: error.message,
        };
      }

      console.log("사용자 프로필 업데이트 성공:", data);
      return {
        success: true,
        data: data?.[0] || null, // 첫 번째 결과 반환
      };
    } catch (error) {
      console.error("사용자 프로필 업데이트 예외:", error);
      return {
        success: false,
        message: "사용자 프로필 업데이트 중 오류가 발생했습니다.",
      };
    }
  },
};
