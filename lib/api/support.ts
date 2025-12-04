import { supabase } from "../supabase";
import { logger } from "../utils/logger";

export interface SupportRequest {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: "bug" | "feature" | "question" | "other";
  status: "pending" | "in_progress" | "resolved" | "closed";
  admin_response?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSupportRequestData {
  title: string;
  content: string;
  category: "bug" | "feature" | "question" | "other";
}

export const supportAPI = {
  // 건의사항 생성
  createSupportRequest: async (
    data: CreateSupportRequestData,
    userId?: string
  ): Promise<{
    success: boolean;
    data?: SupportRequest;
    message?: string;
  }> => {
    try {
      // 사용자 ID 확인
      let user_id = userId;
      if (!user_id) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return {
            success: false,
            message: "사용자 인증이 필요합니다. 다시 로그인해주세요.",
          };
        }
        user_id = user.id;
      }

      // 심사용 테스트 계정 user_id (01000000000)
      const TEST_ACCOUNT_USER_ID = "7ec451a9-5895-40f5-bbc0-b6605c1407ed";
      const isTestAccount = user_id === TEST_ACCOUNT_USER_ID;

      // 테스트 계정이 아닌 경우 세션 확인
      if (!isTestAccount) {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !currentUser || currentUser.id !== user_id) {
          logger.error("세션 확인 실패:", userError);
          return {
            success: false,
            message: "세션이 만료되었습니다. 다시 로그인해주세요.",
          };
        }
      }

      // 건의사항 생성
      const { data: insertedData, error } = await supabase
        .from("support_requests")
        .insert({
          user_id: user_id,
          title: data.title,
          content: data.content,
          category: data.category,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        logger.error("건의사항 생성 실패:", error);
        return {
          success: false,
          message: error.message || "건의사항을 등록하는데 실패했습니다.",
        };
      }

      logger.log("건의사항 생성 성공:", insertedData);
      return {
        success: true,
        data: insertedData as SupportRequest,
      };
    } catch (error) {
      logger.error("건의사항 생성 중 오류:", error);
      return {
        success: false,
        message: "건의사항을 등록하는 중 오류가 발생했습니다.",
      };
    }
  },

  // 내 건의사항 목록 조회
  getMySupportRequests: async (
    userId?: string
  ): Promise<{
    success: boolean;
    data?: SupportRequest[];
    message?: string;
  }> => {
    try {
      // 사용자 ID 확인
      let user_id = userId;
      if (!user_id) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return {
            success: false,
            message: "사용자 인증이 필요합니다. 다시 로그인해주세요.",
          };
        }
        user_id = user.id;
      }

      // 건의사항 목록 조회
      const { data, error } = await supabase
        .from("support_requests")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("건의사항 목록 조회 실패:", error);
        return {
          success: false,
          message: error.message || "건의사항 목록을 불러오는데 실패했습니다.",
        };
      }

      return {
        success: true,
        data: (data || []) as SupportRequest[],
      };
    } catch (error) {
      logger.error("건의사항 목록 조회 중 오류:", error);
      return {
        success: false,
        message: "건의사항 목록을 불러오는 중 오류가 발생했습니다.",
      };
    }
  },

  // 건의사항 상세 조회
  getSupportRequest: async (
    requestId: string,
    userId?: string
  ): Promise<{
    success: boolean;
    data?: SupportRequest;
    message?: string;
  }> => {
    try {
      // 사용자 ID 확인
      let user_id = userId;
      if (!user_id) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return {
            success: false,
            message: "사용자 인증이 필요합니다. 다시 로그인해주세요.",
          };
        }
        user_id = user.id;
      }

      // 건의사항 조회
      const { data, error } = await supabase
        .from("support_requests")
        .select("*")
        .eq("id", requestId)
        .eq("user_id", user_id)
        .single();

      if (error) {
        logger.error("건의사항 조회 실패:", error);
        return {
          success: false,
          message: error.message || "건의사항을 찾을 수 없습니다.",
        };
      }

      return {
        success: true,
        data: data as SupportRequest,
      };
    } catch (error) {
      logger.error("건의사항 조회 중 오류:", error);
      return {
        success: false,
        message: "건의사항을 불러오는 중 오류가 발생했습니다.",
      };
    }
  },
};
