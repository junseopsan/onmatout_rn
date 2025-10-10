import { supabase } from "../supabase";

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
  // 즐겨찾기 추가/제거
  toggleFavorite: async (
    asanaId: string
  ): Promise<{
    success: boolean;
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

      // 기존 즐겨찾기 확인
      const { data: existingFavorite } = await supabase
        .from("user_favorite_asanas")
        .select("id")
        .eq("user_id", user.id)
        .eq("asana_id", asanaId)
        .single();

      if (existingFavorite) {
        // 즐겨찾기 제거
        const { error } = await supabase
          .from("user_favorite_asanas")
          .delete()
          .eq("user_id", user.id)
          .eq("asana_id", asanaId);

        if (error) {
          return {
            success: false,
            message: "즐겨찾기 제거에 실패했습니다.",
          };
        }

        return {
          success: true,
          message: "즐겨찾기가 제거되었습니다.",
        };
      } else {
        // 즐겨찾기 추가
        const { error } = await supabase.from("user_favorite_asanas").insert({
          user_id: user.id,
          asana_id: asanaId,
        });

        if (error) {
          return {
            success: false,
            message: "즐겨찾기 추가에 실패했습니다.",
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
      console.log(
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
        console.log(`카테고리 필터 적용:`, categories);
      }

      // 페이지네이션 적용 (안전한 범위 계산)
      const from = Math.max(0, (page - 1) * limit);
      const to = from + limit - 1;

      console.log(`페이지네이션 범위: ${from} ~ ${to}`);

      // 먼저 전체 개수를 확인
      const { count: totalCount } = await query.range(0, 0);

      // 범위가 전체 개수를 초과하는지 확인
      if (totalCount && from >= totalCount) {
        console.log(
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
          console.log("페이지네이션 범위 오류, 전체 데이터 조회로 대체");

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

      console.log(
        `아사나 페이지네이션 성공: 페이지 ${page}, ${data?.length || 0}개, 전체 ${count}개, 더 있음: ${hasMore}`
      );

      // 카테고리 정보 로깅
      if (data && data.length > 0) {
        console.log(
          "반환된 아사나 카테고리들:",
          data.map((a) => a.category_name_en)
        );
        console.log("첫 번째 아사나 상세:", {
          name: data[0].sanskrit_name_kr,
          category: data[0].category_name_en,
          type: typeof data[0].category_name_en,
        });
      }

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
      console.log("아사나 데이터 가져오기 시작");

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

      // 카테고리 정보 디버깅
      if (data && data.length > 0) {
        console.log("첫 번째 아사나 카테고리 정보:", {
          name: data[0].sanskrit_name_kr,
          category: data[0].category_name_en,
          allFields: Object.keys(data[0]),
        });
      }

      console.log("아사나 데이터 가져오기 성공:", data?.length || 0, "개");
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
      console.log("카테고리별 아사나 데이터 가져오기 시작:", category);

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

      console.log(
        "카테고리별 아사나 데이터 가져오기 성공:",
        data?.length || 0,
        "개"
      );
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
      console.log("레벨별 아사나 데이터 가져오기 시작:", level);

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

      console.log(
        "레벨별 아사나 데이터 가져오기 성공:",
        data?.length || 0,
        "개"
      );
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
      console.log("아사나 검색 시작:", query);

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

      console.log("아사나 검색 성공:", data?.length || 0, "개");
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
