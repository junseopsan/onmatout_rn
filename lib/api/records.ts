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
        .from("practice_records")
        .select("*")
        .eq("practice_date", today)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116는 데이터가 없는 경우
        console.error("오늘 기록 가져오기 에러:", error);
        return {
          success: false,
          message: error.message || "기록을 가져오는데 실패했습니다.",
        };
      }

      // practice_records 테이블 구조를 Record 타입에 맞게 변환
      if (data) {
        const convertedData: Record = {
          id: data.id,
          user_id: data.user_id,
          date: data.practice_date,
          asanas: data.asana_id ? [data.asana_id] : [], // 단일 아사나를 배열로 변환
          memo: data.memo || "",
          emotions: data.emotion ? [data.emotion] : [], // 단일 감정을 배열로 변환
          energy_level: data.energy_level ? data.energy_level.toString() : "",
          photos: [], // practice_records에는 photos 컬럼이 없으므로 빈 배열
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        return {
          success: true,
          data: convertedData,
        };
      }

      return {
        success: true,
        data: null,
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
      
      // RecordFormData를 practice_records 테이블 구조에 맞게 변환
      const recordPayload = {
        practice_date: today,
        asana_id: recordData.asanas.length > 0 ? recordData.asanas[0] : null, // 첫 번째 아사나만 저장
        memo: recordData.memo,
        emotion: recordData.emotions.length > 0 ? recordData.emotions[0] : null, // 첫 번째 감정만 저장
        energy_level: recordData.energy_level ? parseInt(recordData.energy_level) : null,
        focus_level: 3, // 기본값 설정 (RecordFormData에 focus_level이 없으므로)
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("practice_records")
        .upsert(recordPayload, {
          onConflict: "practice_date",
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

      // 변환된 데이터 반환
      if (data) {
        const convertedData: Record = {
          id: data.id,
          user_id: data.user_id,
          date: data.practice_date,
          asanas: data.asana_id ? [data.asana_id] : [],
          memo: data.memo || "",
          emotions: data.emotion ? [data.emotion] : [],
          energy_level: data.energy_level ? data.energy_level.toString() : "",
          photos: [],
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        return {
          success: true,
          data: convertedData,
        };
      }

      return {
        success: true,
        data: undefined,
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
        .from("practice_records")
        .delete()
        .eq("practice_date", date);

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
        .from("practice_records")
        .select("*")
        .gte("practice_date", fromDate)
        .order("practice_date", { ascending: false });

      if (error) {
        console.error("최근 기록 가져오기 에러:", error);
        return {
          success: false,
          message: error.message || "기록을 가져오는데 실패했습니다.",
        };
      }

      // 데이터 변환
      const convertedData: Record[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        date: item.practice_date,
        asanas: item.asana_id ? [item.asana_id] : [],
        memo: item.memo || "",
        emotions: item.emotion ? [item.emotion] : [],
        energy_level: item.energy_level ? item.energy_level.toString() : "",
        photos: [],
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      return {
        success: true,
        data: convertedData,
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
