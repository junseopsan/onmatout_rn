import { supabase } from "../supabase";

export interface Studio {
  id: string;
  name: string;
  address: string;
  phone: string;
  website?: string;
  instagram?: string;
  description?: string;
  image_url?: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

export const studioAPI = {
  // 모든 요가원 가져오기
  getAllStudios: async (): Promise<{
    success: boolean;
    data?: Studio[];
    message?: string;
  }> => {
    try {
      const { data, error } = await supabase
        .from("studios")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("요가원 조회 에러:", error);
        return {
          success: false,
          message: "요가원 정보를 가져오는데 실패했습니다.",
        };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("요가원 조회 에러:", error);
      return {
        success: false,
        message: "요가원 정보를 가져오는데 실패했습니다.",
      };
    }
  },

  // 지역별 요가원 검색
  searchStudiosByLocation: async (
    location: string
  ): Promise<{ success: boolean; data?: Studio[]; message?: string }> => {
    try {
      const { data, error } = await supabase
        .from("studios")
        .select("*")
        .ilike("address", `%${location}%`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("지역별 요가원 검색 에러:", error);
        return { success: false, message: "지역별 검색에 실패했습니다." };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("지역별 요가원 검색 에러:", error);
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
        .order("created_at", { ascending: false });

      if (error) {
        console.error("이름별 요가원 검색 에러:", error);
        return { success: false, message: "이름별 검색에 실패했습니다." };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("이름별 요가원 검색 에러:", error);
      return { success: false, message: "이름별 검색에 실패했습니다." };
    }
  },
};
