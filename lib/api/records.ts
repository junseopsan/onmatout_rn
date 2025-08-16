import { supabase } from "../supabase";
import { Record, RecordFormData } from "../../types/record";

export const recordsAPI = {
  // 오늘 기록 가져오기
  getTodayRecord: async (): Promise<{
    success: boolean;
    data?: Record;
    message?: string;
  }> => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
      
      const { data, error } = await supabase
        .from("records")
        .select("*")
        .eq("date", today)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116는 데이터가 없는 경우
        console.error("오늘 기록 가져오기 에러:", error);
        return {
          success: false,
          message: error.message || "기록을 가져오는데 실패했습니다.",
        };
      }

      return {
        success: true,
        data: data || null,
      };
    } catch (error) {
      console.error("오늘 기록 가져오기 예외:", error);
      return {
        success: false,
        message: "기록을 가져오는 중 오류가 발생했습니다.",
      };
    }
  },

  // 기록 생성 또는 업데이트
  upsertRecord: async (recordData: RecordFormData): Promise<{
    success: boolean;
    data?: Record;
    message?: string;
  }> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const recordPayload = {
        date: today,
        asanas: recordData.asanas,
        memo: recordData.memo,
        emotions: recordData.emotions,
        energy_level: recordData.energy_level,
        photos: recordData.photos,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("records")
        .upsert(recordPayload, {
          onConflict: "date",
        })
        .select()
        .single();

      if (error) {
        console.error("기록 저장 에러:", error);
        return {
          success: false,
          message: error.message || "기록을 저장하는데 실패했습니다.",
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("기록 저장 예외:", error);
      return {
        success: false,
        message: "기록을 저장하는 중 오류가 발생했습니다.",
      };
    }
  },

  // 기록 삭제
  deleteRecord: async (date: string): Promise<{
    success: boolean;
    message?: string;
  }> => {
    try {
      const { error } = await supabase
        .from("records")
        .delete()
        .eq("date", date);

      if (error) {
        console.error("기록 삭제 에러:", error);
        return {
          success: false,
          message: error.message || "기록을 삭제하는데 실패했습니다.",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("기록 삭제 예외:", error);
      return {
        success: false,
        message: "기록을 삭제하는 중 오류가 발생했습니다.",
      };
    }
  },

  // 최근 기록 목록 가져오기 (최근 30일)
  getRecentRecords: async (): Promise<{
    success: boolean;
    data?: Record[];
    message?: string;
  }> => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("records")
        .select("*")
        .gte("date", fromDate)
        .order("date", { ascending: false });

      if (error) {
        console.error("최근 기록 가져오기 에러:", error);
        return {
          success: false,
          message: error.message || "기록을 가져오는데 실패했습니다.",
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("최근 기록 가져오기 예외:", error);
      return {
        success: false,
        message: "기록을 가져오는 중 오류가 발생했습니다.",
      };
    }
  },
};
