import { supabase } from "../supabase";
import { logger } from "../utils/logger";

export interface Asana {
  id: string;
  sanskrit_name_kr: string;
  sanskrit_name_en: string;
  level: string;
  effect: string;
  created_at: string;
  updated_at: string;
  category_name_en: string;
  image_number: string;
  asana_meaning: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  message?: string;
  hasMore?: boolean;
  totalCount?: number;
}

export const asanasAPI = {
  // ID로 아사나 조회
  getAsanaById: async (
    asanaId: string
  ): Promise<{
    success: boolean;
    data?: Asana;
    message?: string;
  }> => {
    try {
      const { data, error } = await supabase
        .from("asanas")
        .select("*")
        .eq("id", asanaId)
        .single();

      if (error) {
        return {
          success: false,
          message: error.message || "아사나를 찾을 수 없습니다.",
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: "아사나 조회 중 오류가 발생했습니다.",
      };
    }
  },

  // 즐겨찾기 추가/제거
  toggleFavorite: async (
    asanaId: string,
    userId?: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> => {
    try {
      // 사용자 ID 확인 (파라미터로 받거나 auth에서 가져오기)
      let user_id = userId;
      if (!user_id) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return {
            success: false,
            message: "사용자 인증이 필요합니다.",
          };
        }
        user_id = user.id;
      }

      logger.log("사용자 ID:", user_id);
      logger.log("auth.uid():", (await supabase.auth.getUser()).data.user?.id);

      // RLS 정책을 우회하기 위해 서비스 키를 사용하거나, 
      // 현재 사용자 ID가 auth.uid()와 일치하는지 확인
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && currentUser.id !== user_id) {
        logger.log("사용자 ID 불일치 - auth.uid()와 전달받은 user_id가 다름");
        // auth.uid()가 undefined인 경우 전달받은 user_id 사용
        if (!currentUser.id) {
          logger.log("auth.uid()가 undefined이므로 전달받은 user_id 사용");
        } else {
          return {
            success: false,
            message: "사용자 인증이 일치하지 않습니다.",
          };
        }
      }

      // 기존 즐겨찾기 확인
      const { data: existingFavorite } = await supabase
        .from("user_favorite_asanas")
        .select("id")
        .eq("user_id", user_id)
        .eq("asana_id", asanaId)
        .single();

      if (existingFavorite) {
        // 즐겨찾기 제거
        const { error } = await supabase
          .from("user_favorite_asanas")
          .delete()
          .eq("user_id", user_id)
          .eq("asana_id", asanaId);

        if (error) {
          logger.error("즐겨찾기 제거 에러:", error);
          return {
            success: false,
            message: `즐겨찾기 제거에 실패했습니다: ${error.message}`,
          };
        }

        return {
          success: true,
          message: "즐겨찾기가 제거되었습니다.",
        };
      } else {
        // 즐겨찾기 추가
        const { error } = await supabase.from("user_favorite_asanas").insert({
          user_id: user_id,
          asana_id: asanaId,
        });

        if (error) {
          logger.error("즐겨찾기 추가 에러:", error);
          return {
            success: false,
            message: `즐겨찾기 추가에 실패했습니다: ${error.message}`,
          };
        }

        return {
          success: true,
          message: "즐겨찾기가 추가되었습니다.",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "즐겨찾기 처리 중 오류가 발생했습니다.",
      };
    }
  },

  // 사용자의 즐겨찾기 아사나 목록 가져오기
  getFavoriteAsanas: async (): Promise<{
    success: boolean;
    data?: string[]; // 아사나 ID 배열
    message?: string;
  }> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          message: "사용자 인증이 필요합니다.",
        };
      }

      const { data, error } = await supabase
        .from("user_favorite_asanas")
        .select("asana_id")
        .eq("user_id", user.id);

      if (error) {
        return {
          success: false,
          message: "즐겨찾기 목록을 가져오는데 실패했습니다.",
        };
      }

      const favoriteIds = data?.map((item) => item.asana_id) || [];
      return {
        success: true,
        data: favoriteIds,
      };
    } catch (error) {
      return {
        success: false,
        message: "즐겨찾기 목록을 가져오는 중 오류가 발생했습니다.",
      };
    }
  },
  // 페이지네이션으로 아사나 가져오기 (20개씩)
  getAsanasWithPagination: async (
    page: number = 1,
    limit: number = 20,
    categories?: string[]
  ): Promise<PaginatedResponse<Asana>> => {
    try {
      logger.log(
        `아사나 페이지네이션 시작: 페이지 ${page}, 개수 ${limit}, 카테고리:`,
        categories
      );

      let query = supabase
        .from("asanas")
        .select("*", { count: "exact" })
        .order("sanskrit_name_kr", { ascending: true });

      // 카테고리 필터 적용
      if (categories && categories.length > 0) {
        query = query.in("category_name_en", categories);
        logger.log(`카테고리 필터 적용:`, categories);
      }

      // 페이지네이션 적용 (안전한 범위 계산)
      const from = Math.max(0, (page - 1) * limit);
      const to = from + limit - 1;

      logger.log(`페이지네이션 범위: ${from} ~ ${to}`);

      // 먼저 전체 개수를 확인
      const { count: totalCount } = await query.range(0, 0);

      // 범위가 전체 개수를 초과하는지 확인
      if (totalCount && from >= totalCount) {
        logger.log(
          `페이지네이션 범위 초과: ${from} >= ${totalCount}, 빈 결과 반환`
        );
        return {
          success: true,
          data: [],
          hasMore: false,
          totalCount: totalCount,
        };
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        // 페이지네이션 범위 오류인 경우 전체 데이터를 가져옴
        if (error.code === "PGRST103") {
          logger.log("페이지네이션 범위 오류, 전체 데이터 조회로 대체");

          const { data: allData, error: allError } = await query.range(0, 999);

          if (allError) {
            return {
              success: false,
              message:
                allError.message || "아사나 데이터를 가져오는데 실패했습니다.",
            };
          }

          return {
            success: true,
            data: allData || [],
            hasMore: false, // 전체 데이터를 가져왔으므로 더 이상 없음
            totalCount: allData?.length || 0,
          };
        }

        return {
          success: false,
          message: error.message || "아사나 데이터를 가져오는데 실패했습니다.",
        };
      }

      const hasMore = count ? from + limit < count : false;

      logger.log(
        `아사나 페이지네이션 성공: 페이지 ${page}, ${
          data?.length || 0
        }개, 전체 ${count}개, 더 있음: ${hasMore}`
      );

      return {
        success: true,
        data: data || [],
        hasMore,
        totalCount: count || 0,
      };
    } catch (error) {
      return {
        success: false,
        message: "아사나 데이터를 가져오는 중 오류가 발생했습니다.",
      };
    }
  },

  // 모든 아사나 가져오기 (기존 함수 유지)
  getAllAsanas: async (): Promise<{
    success: boolean;
    data?: Asana[];
    message?: string;
  }> => {
    try {
      const { data, error } = await supabase
        .from("asanas")
        .select("*")
        .order("sanskrit_name_kr", { ascending: true });

      if (error) {
        return {
          success: false,
          message: error.message || "아사나 데이터를 가져오는데 실패했습니다.",
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        message: "아사나 데이터를 가져오는 중 오류가 발생했습니다.",
      };
    }
  },

  // 카테고리별 아사나 가져오기
  getAsanasByCategory: async (
    category: string
  ): Promise<{ success: boolean; data?: Asana[]; message?: string }> => {
    try {
      const { data, error } = await supabase
        .from("asanas")
        .select("*")
        .eq("category_name_en", category)
        .order("sanskrit_name_kr", { ascending: true });

      if (error) {
        return {
          success: false,
          message:
            error.message ||
            "카테고리별 아사나 데이터를 가져오는데 실패했습니다.",
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        message: "카테고리별 아사나 데이터를 가져오는 중 오류가 발생했습니다.",
      };
    }
  },

  // 레벨별 아사나 가져오기
  getAsanasByLevel: async (
    level: string
  ): Promise<{ success: boolean; data?: Asana[]; message?: string }> => {
    try {
      const { data, error } = await supabase
        .from("asanas")
        .select("*")
        .eq("level", level)
        .order("sanskrit_name_kr", { ascending: true });

      if (error) {
        return {
          success: false,
          message:
            error.message || "레벨별 아사나 데이터를 가져오는데 실패했습니다.",
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        message: "레벨별 아사나 데이터를 가져오는 중 오류가 발생했습니다.",
      };
    }
  },

  // 검색
  searchAsanas: async (
    query: string
  ): Promise<{ success: boolean; data?: Asana[]; message?: string }> => {
    try {
      logger.log("아사나 검색 시작:", query);

      const { data, error } = await supabase
        .from("asanas")
        .select("*")
        .or(
          `sanskrit_name_kr.ilike.%${query}%,sanskrit_name_en.ilike.%${query}%`
        )
        .order("sanskrit_name_kr", { ascending: true })
        .limit(50); // 검색 결과 제한

      if (error) {
        return {
          success: false,
          message: error.message || "아사나 검색에 실패했습니다.",
        };
      }

      logger.log("아사나 검색 성공:", data?.length || 0, "개");
      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        message: "아사나 검색 중 오류가 발생했습니다.",
      };
    }
  },
};
