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
      console.log("=== 사용자 프로필 저장 시작 ===");
      console.log("입력 파라미터:", { userId, profile });

      // 먼저 기존 프로필이 있는지 확인
      console.log("1단계: 기존 프로필 확인 시작");
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      console.log("기존 프로필 확인 결과:", { existingProfile, checkError });

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116는 데이터가 없는 경우
        console.error("프로필 확인 에러:", checkError);
        return {
          success: false,
          message: checkError.message,
        };
      }

      if (existingProfile) {
        // 기존 프로필이 있으면 업데이트
        console.log("2단계: 기존 프로필 업데이트 시작");
        console.log("업데이트할 데이터:", {
          user_id: userId,
          name: profile.name,
        });
        console.log("기존 프로필:", existingProfile);

        // UPDATE 실행
        console.log("3단계: UPDATE 쿼리 실행");
        const updateResult = await supabase
          .from("user_profiles")
          .update({
            name: profile.name,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        console.log("UPDATE 쿼리 결과:", updateResult);

        if (updateResult.error) {
          console.error("사용자 프로필 업데이트 에러:", updateResult.error);
          return {
            success: false,
            message: updateResult.error.message || "알 수 없는 에러",
          };
        }

        // 업데이트 후 다시 조회
        console.log("4단계: 업데이트 후 데이터 조회");
        const { data: updatedProfile, error: selectError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        console.log("업데이트 후 조회 결과:", { updatedProfile, selectError });

        if (selectError) {
          console.error("업데이트 후 조회 에러:", selectError);
          return {
            success: false,
            message: selectError.message || "업데이트 후 조회 실패",
          };
        }

        console.log("=== 업데이트 성공 ===");
        console.log("최종 업데이트된 프로필:", updatedProfile);
        return {
          success: true,
          data: updatedProfile,
        };
      } else {
        // 기존 프로필이 없으면 새로 생성
        console.log("새 프로필 생성");
        console.log("삽입할 데이터:", { user_id: userId, name: profile.name });

        const insertResult = await supabase.from("user_profiles").insert({
          user_id: userId,
          name: profile.name,
        });

        console.log("INSERT 결과:", insertResult);

        if (insertResult.error) {
          console.error("사용자 프로필 생성 에러:", insertResult.error);
          return {
            success: false,
            message: insertResult.error.message || "알 수 없는 에러",
          };
        }

        // 생성 후 다시 조회
        const { data: newProfile, error: selectError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        console.log("생성 후 조회 결과:", { newProfile, selectError });

        if (selectError) {
          console.error("생성 후 조회 에러:", selectError);
          return {
            success: false,
            message: selectError.message || "생성 후 조회 실패",
          };
        }

        console.log("사용자 프로필 저장 성공:", newProfile);
        return {
          success: true,
          data: newProfile,
        };
      }
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
