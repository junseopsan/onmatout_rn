import { supabase } from "../supabase";

export interface Studio {
  id: string;
  name: string;
  address: string;
  phone: string;
  website?: string;
  url?: string; // 카카오 지도 URL
  description?: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  priority?: number | null; // 우선순위 (숫자가 작을수록 상단)
}

// 요가원 일일 클래스 / 프로모션 정보
export interface StudioPromotion {
  id: string;
  studio_id: string;
  title: string;
  class_date: string; // ISO 문자열 (date)
  price: number | null;
  description?: string | null;
  link?: string | null;
  // one_time: 일일 클래스 / recuring: 정규 수업 등
  promotion_type?: "one_time" | "recurring" | null;
  // 정규 수업일 때 노출할 스케줄 텍스트 (예: "월수금 7:30pm / 9pm (70분)")
  schedule_text?: string | null;
  is_active: boolean;
  created_at: string;
}

// 스튜디오 정보가 함께 포함된 프로모션
export interface StudioPromotionWithStudio extends StudioPromotion {
  studio?: {
    id: string;
    name: string;
    address: string;
    url?: string | null;
  } | null;
}

export const studioAPI = {
  // 페이지네이션으로 요가원 가져오기 (100개씩)
  getStudiosWithPagination: async (
    page: number = 1,
    limit: number = 100
  ): Promise<{
    success: boolean;
    data?: Studio[];
    hasMore?: boolean;
    totalCount?: number;
    message?: string;
  }> => {
    try {
      const from = Math.max(0, (page - 1) * limit);
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("studios")
        .select("*", { count: "exact" })
        .order("priority", { ascending: true, nullsLast: true })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        return {
          success: false,
          message: "요가원 정보를 가져오는데 실패했습니다.",
        };
      }

      const hasMore = data
        ? data.length === limit && (count || 0) > to + 1
        : false;

      return {
        success: true,
        data: data || [],
        hasMore,
        totalCount: count || 0,
      };
    } catch (error) {
      return {
        success: false,
        message: "요가원 정보를 가져오는데 실패했습니다.",
      };
    }
  },

  // 모든 요가원 가져오기 (검색용 - 전체 데이터)
  getAllStudios: async (): Promise<{
    success: boolean;
    data?: Studio[];
    message?: string;
  }> => {
    try {
      // 페이지네이션으로 모든 데이터 가져오기
      let allStudios: Studio[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("studios")
          .select("*")
          .order("priority", { ascending: true, nullsLast: true })
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) {
          return {
            success: false,
            message: "요가원 정보를 가져오는데 실패했습니다.",
          };
        }

        if (data && data.length > 0) {
          allStudios = [...allStudios, ...data];
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      return { success: true, data: allStudios };
    } catch (error) {
      return {
        success: false,
        message: "요가원 정보를 가져오는데 실패했습니다.",
      };
    }
  },

  // 서버 사이드 검색 (전체 데이터에서 검색)
  searchStudios: async (
    query: string
  ): Promise<{
    success: boolean;
    data?: Studio[];
    message?: string;
  }> => {
    try {
      if (!query.trim()) {
        return { success: true, data: [] };
      }

      // 이름 또는 주소에서 검색 (서버 사이드)
      // 페이지네이션으로 모든 검색 결과 가져오기
      let allResults: Studio[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("studios")
          .select("*")
          .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
          .order("priority", { ascending: true, nullsLast: true })
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) {
          return {
            success: false,
            message: "검색에 실패했습니다.",
          };
        }

        if (data && data.length > 0) {
          allResults = [...allResults, ...data];
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      return { success: true, data: allResults };
    } catch (error) {
      return {
        success: false,
        message: "검색에 실패했습니다.",
      };
    }
  },

  // 지역별 요가원 검색
  searchStudiosByLocation: async (
    location: string
  ): Promise<{ success: boolean; data?: Studio[]; message?: string }> => {
    try {
      // 페이지네이션으로 모든 데이터 가져오기
      let allStudios: Studio[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("studios")
          .select("*")
          .ilike("address", `%${location}%`)
          .order("priority", { ascending: true, nullsLast: true })
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) {
          return { success: false, message: "지역별 검색에 실패했습니다." };
        }

        if (data && data.length > 0) {
          allStudios = [...allStudios, ...data];
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      return { success: true, data: allStudios };
    } catch (error) {
      return { success: false, message: "지역별 검색에 실패했습니다." };
    }
  },

  // 요가원 이름으로 검색
  searchStudiosByName: async (
    name: string
  ): Promise<{ success: boolean; data?: Studio[]; message?: string }> => {
    try {
      const { data, error } = await supabase
        .from("studios")
        .select("*")
        .ilike("name", `%${name}%`)
        .order("priority", { ascending: true, nullsLast: true })
        .order("created_at", { ascending: false });

      if (error) {
        return { success: false, message: "이름별 검색에 실패했습니다." };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, message: "이름별 검색에 실패했습니다." };
    }
  },

  // 지역별 요가원 필터링 (서버 사이드)
  filterStudiosByRegion: async (
    regionName: string
  ): Promise<{ success: boolean; data?: Studio[]; message?: string }> => {
    try {
      // 지역명 매핑: "서울" -> "서울특별시", "경기" -> "경기도" 등
      const regionMap: Record<string, string[]> = {
        서울: ["서울특별시"],
        경기: ["경기도"],
        부산: ["부산광역시"],
        인천: ["인천광역시"],
        대전: ["대전광역시"],
        대구: ["대구광역시"],
        광주: ["광주광역시"],
        울산: ["울산광역시"],
        세종: ["세종특별자치시"],
        강원: ["강원도", "강원특별자치도"],
        충북: ["충청북도"],
        충남: ["충청남도"],
        전북: ["전라북도"],
        전남: ["전라남도"],
        경북: ["경상북도"],
        경남: ["경상남도"],
        제주: ["제주특별자치도"],
      };

      const searchTerms = regionMap[regionName] || [regionName];

      // OR 조건으로 여러 지역명 검색
      let query = supabase.from("studios").select("*");

      if (searchTerms.length === 1) {
        // 페이지네이션으로 모든 데이터 가져오기
        let allStudios: Studio[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from("studios")
            .select("*")
            .ilike("address", `%${searchTerms[0]}%`)
            .order("priority", { ascending: true, nullsLast: true })
            .order("created_at", { ascending: false })
            .range(from, from + pageSize - 1);

          if (error) {
            return { success: false, message: "지역별 필터링에 실패했습니다." };
          }

          if (data && data.length > 0) {
            allStudios = [...allStudios, ...data];
            from += pageSize;
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        return { success: true, data: allStudios };
      } else {
        // 여러 지역명 중 하나라도 포함되면 매칭
        // Supabase는 OR 조건을 직접 지원하지 않으므로 클라이언트에서 필터링
        // 먼저 모든 데이터를 가져온 후 필터링
        let allData: Studio[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from("studios")
            .select("*")
            .order("priority", { ascending: true, nullsLast: true })
            .order("created_at", { ascending: false })
            .range(from, from + pageSize - 1);

          if (error) {
            return { success: false, message: "지역별 필터링에 실패했습니다." };
          }

          if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += pageSize;
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        const filtered = allData.filter((studio) =>
          searchTerms.some((term) => (studio.address || "").includes(term))
        );

        return { success: true, data: filtered };
      }
    } catch (error) {
      return { success: false, message: "지역별 필터링에 실패했습니다." };
    }
  },

  // 활성화된 요가원 일일 클래스 / 프로모션 목록 가져오기
  getActiveStudioPromotions: async (): Promise<{
    success: boolean;
    data?: StudioPromotionWithStudio[];
    message?: string;
  }> => {
    try {
      // 오늘 기준 이후(오늘 포함)의 활성 프로모션만 가져오기
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

      const { data, error } = await supabase
        .from("studio_promotions")
        .select(
          `
          id,
          studio_id,
          title,
          class_date,
          price,
          description,
          link,
          promotion_type,
          schedule_text,
          is_active,
          created_at,
          studio:studios (
            id,
            name,
            address,
            url
          )
        `
        )
        .eq("is_active", true)
        .gte("class_date", todayStr)
        .order("class_date", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        return {
          success: false,
          message: "요가원 일일 클래스 정보를 가져오는데 실패했습니다.",
        };
      }

      return {
        success: true,
        data: (data as StudioPromotionWithStudio[]) || [],
      };
    } catch (error) {
      return {
        success: false,
        message: "요가원 일일 클래스 정보를 가져오는데 실패했습니다.",
      };
    }
  },
};
