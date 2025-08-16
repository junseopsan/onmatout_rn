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
  // 페이지네이션으로 아사나 가져오기 (20개씩)
  getAsanasWithPagination: async (
    page: number = 1,
    limit: number = 20,
    categories?: string[]
  ): Promise<PaginatedResponse<Asana>> => {
    try {
      console.log(`아사나 페이지네이션 시작: 페이지 ${page}, 개수 ${limit}`);

      let query = supabase
        .from("asanas")
        .select("*", { count: "exact" })
        .order("sanskrit_name_kr", { ascending: true });

      // 카테고리 필터 적용
      if (categories && categories.length > 0) {
        query = query.in("category_name_en", categories);
      }

      // 페이지네이션 적용
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) {
        console.error("아사나 페이지네이션 에러:", error);
        return {
          success: false,
          message: error.message || "아사나 데이터를 가져오는데 실패했습니다.",
        };
      }

      const hasMore = count ? from + limit < count : false;

      console.log(
        `아사나 페이지네이션 성공: 페이지 ${page}, ${data?.length || 0}개, 전체 ${count}개, 더 있음: ${hasMore}`
      );

      return {
        success: true,
        data: data || [],
        hasMore,
        totalCount: count || 0,
      };
    } catch (error) {
      console.error("아사나 페이지네이션 예외:", error);
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
        console.error("아사나 데이터 가져오기 에러:", error);
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
      console.error("아사나 데이터 가져오기 예외:", error);
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
        console.error("카테고리별 아사나 데이터 가져오기 에러:", error);
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
      console.error("카테고리별 아사나 데이터 가져오기 예외:", error);
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
        console.error("레벨별 아사나 데이터 가져오기 에러:", error);
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
      console.error("레벨별 아사나 데이터 가져오기 예외:", error);
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
        .order("sanskrit_name_kr", { ascending: true });

      if (error) {
        console.error("아사나 검색 에러:", error);
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
      console.error("아사나 검색 예외:", error);
      return {
        success: false,
        message: "아사나 검색 중 오류가 발생했습니다.",
      };
    }
  },
};
