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

      // 먼저 기존 프로필이 있는지 확인
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        return {
          success: false,
          message: checkError.message,
        };
      }

      if (existingProfile) {
        // 기존 프로필이 있으면 업데이트
        const { data: updatedProfile, error: updateError } = await supabase
          .from("user_profiles")
          .update(updateData)
          .eq("user_id", userId)
          .select()
          .single();

        if (updateError) {
          return {
            success: false,
            message: updateError.message,
          };
        }

        console.log("사용자 프로필 업데이트 성공:", updatedProfile);
        return {
          success: true,
          data: updatedProfile,
        };
      } else {
        // 기존 프로필이 없으면 새로 생성
        const insertData = {
          user_id: userId,
          ...updateData,
        };

        const { data: newProfile, error: insertError } = await supabase
          .from("user_profiles")
          .insert(insertData)
          .select()
          .single();

        if (insertError) {
          return {
            success: false,
            message: insertError.message,
          };
        }

        console.log("사용자 프로필 생성 성공:", newProfile);
        return {
          success: true,
          data: newProfile,
        };
      }
    } catch (error) {
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

      console.log("사용자 프로필 업데이트 성공:", data);
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        message: "사용자 프로필 업데이트 중 오류가 발생했습니다.",
      };
    }
  },
};
