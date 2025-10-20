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

      // 1단계: 기존 프로필 확인
      console.log("기존 프로필 확인 중...");
      const { data: existingProfiles, error: checkError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId);

      if (checkError) {
        console.log("기존 프로필 확인 실패:", checkError);
        return {
          success: false,
          message: `기존 프로필 확인 실패: ${checkError.message}`,
        };
      }

      console.log("기존 프로필 개수:", existingProfiles?.length || 0);

      // 2단계: 기존 프로필이 있으면 업데이트, 없으면 생성
      if (existingProfiles && existingProfiles.length > 0) {
        console.log("기존 프로필 업데이트 중...");

        // 먼저 업데이트 실행 (RLS가 비활성화되어야 함)
        console.log("업데이트할 데이터:", updateData);
        const { data: updateResult, error: updateError } = await supabase
          .from("user_profiles")
          .update(updateData)
          .eq("user_id", userId)
          .select();

        if (updateError) {
          console.log("프로필 업데이트 실패:", updateError);
          return {
            success: false,
            message: `프로필 업데이트 실패: ${updateError.message}`,
          };
        }

        console.log("업데이트 결과:", updateResult);

        // 업데이트 후 다시 조회 (single() 사용하지 않음)
        const { data: updatedProfiles, error: selectError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId);

        if (selectError) {
          console.log("업데이트된 프로필 조회 실패:", selectError);
          return {
            success: false,
            message: `업데이트된 프로필 조회 실패: ${selectError.message}`,
          };
        }

        const updatedProfile =
          updatedProfiles && updatedProfiles.length > 0
            ? updatedProfiles[0]
            : null;
        console.log("프로필 업데이트 성공:", updatedProfile);
        console.log("반환할 데이터 구조:", {
          success: true,
          data: updatedProfile,
          dataKeys: updatedProfile ? Object.keys(updatedProfile) : "null",
        });
        return {
          success: true,
          data: updatedProfile,
        };
      } else {
        console.log("새 프로필 생성 중...");
        const insertData = {
          user_id: userId,
          ...updateData,
        };

        console.log("삽입할 데이터:", insertData);
        const { data: newProfile, error: insertError } = await supabase
          .from("user_profiles")
          .insert(insertData)
          .select()
          .single();

        if (insertError) {
          console.log("새 프로필 생성 실패:", insertError);
          return {
            success: false,
            message: `프로필 생성 실패: ${insertError.message}`,
          };
        }

        console.log("새 프로필 생성 성공:", newProfile);
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
