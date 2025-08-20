import { Record, RecordFormData } from "../../types/record";
import { supabase } from "../supabase";

export const recordsAPI = {
  // 오늘 기록들 가져오기 (하루에 여러 기록 허용)
  getTodayRecords: async (): Promise<{
    success: boolean;
    data?: Record[];
    message?: string;
  }> => {
    try {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 형식

      // 현재 사용자 ID 가져오기
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
        .from("practice_records")
        .select("*")
        .eq("practice_date", today)
        .eq("user_id", user.id)
        .order("practice_time", { ascending: false });

      if (error && error.code !== "PGRST116") {
        // PGRST116는 데이터가 없는 경우
        console.error("오늘 기록 가져오기 에러:", error);
        return {
          success: false,
          message: error.message || "기록을 가져오는데 실패했습니다.",
        };
      }

      // 감정 값을 상태로 역변환
      const convertEmotionToState = (emotion: string): string => {
        const emotionMapping: { [key: string]: string } = {
          calm: "calm",
          energized: "energized",
          tired: "tired",
          focused: "focused",
          stressed: "tense", // stressed -> tense로 매핑
          happy: "calm", // happy -> calm으로 매핑
          relaxed: "calm", // relaxed -> calm으로 매핑
        };
        return emotionMapping[emotion] || "calm"; // 기본값은 calm
      };

      // 새로운 practice_records 테이블 구조를 Record 타입에 맞게 변환
      if (data && data.length > 0) {
        const convertedData: Record[] = data.map((item) => {
          // JSON 문자열을 파싱하여 배열로 변환
          let asanas: string[] = [];
          let states: string[] = [];
          let photos: string[] = [];

          try {
            if (typeof item.asanas === "string") {
              asanas = JSON.parse(item.asanas);
            } else if (Array.isArray(item.asanas)) {
              asanas = item.asanas;
            }

            if (typeof item.states === "string") {
              states = JSON.parse(item.states);
            } else if (Array.isArray(item.states)) {
              states = item.states;
            }

            if (typeof item.photos === "string") {
              photos = JSON.parse(item.photos);
            } else if (Array.isArray(item.photos)) {
              photos = item.photos;
            }
          } catch (error) {
            console.error("JSON 파싱 에러:", error);
            // 파싱 실패 시 빈 배열로 설정
            asanas = [];
            states = [];
            photos = [];
          }

          return {
            id: item.id,
            user_id: item.user_id,
            date: item.practice_date,
            title: item.title || `수련 기록 - ${item.practice_date}`,
            asanas: asanas,
            memo: item.memo || "",
            states: states,
            photos: photos,
            created_at: item.created_at,
            updated_at: item.updated_at,
          };
        });

        return {
          success: true,
          data: convertedData,
        };
      }

      return {
        success: true,
        data: [],
      };
    } catch (error) {
      console.error("오늘 기록 가져오기 예외:", error);
      return {
        success: false,
        message: "기록을 가져오는 중 오류가 발생했습니다.",
      };
    }
  },

  // 기록 생성 (하루에 여러 기록 허용)
  createRecord: async (
    recordData: RecordFormData
  ): Promise<{
    success: boolean;
    data?: Record;
    message?: string;
  }> => {
    try {
      const practiceDate =
        recordData.date || new Date().toISOString().split("T")[0];

      // 현재 사용자 ID 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          message: "사용자 인증이 필요합니다.",
        };
      }

      // 새로운 기록 생성 (하루에 여러 기록 허용)
      const recordPayload = {
        user_id: user.id,
        practice_date: practiceDate,
        practice_time: new Date().toISOString(), // 현재 시간으로 수련 시간 설정
        title: recordData.title, // 기록 제목
        asanas: recordData.asanas, // 아사나 ID 배열
        memo: recordData.memo,
        states: recordData.states, // 상태 배열
        photos: recordData.photos || [], // 사진 URL 배열
        updated_at: new Date().toISOString(),
      };

      // 새 기록 생성
      const { data, error } = await supabase
        .from("practice_records")
        .insert(recordPayload)
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
        // JSON 문자열을 파싱하여 배열로 변환
        let asanas: string[] = [];
        let states: string[] = [];
        let photos: string[] = [];

        try {
          if (typeof data.asanas === "string") {
            asanas = JSON.parse(data.asanas);
          } else if (Array.isArray(data.asanas)) {
            asanas = data.asanas;
          }

          if (typeof data.states === "string") {
            states = JSON.parse(data.states);
          } else if (Array.isArray(data.states)) {
            states = data.states;
          }

          if (typeof data.photos === "string") {
            photos = JSON.parse(data.photos);
          } else if (Array.isArray(data.photos)) {
            photos = data.photos;
          }
        } catch (error) {
          console.error("JSON 파싱 에러:", error);
          // 파싱 실패 시 빈 배열로 설정
          asanas = [];
          states = [];
          photos = [];
        }

        const convertedData: Record = {
          id: data.id,
          user_id: data.user_id,
          date: data.practice_date,
          title: data.title || `수련 기록 - ${data.practice_date}`,
          asanas: asanas,
          memo: data.memo || "",
          states: states,
          photos: photos,
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
  deleteRecord: async (
    date: string
  ): Promise<{
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

  // ID로 기록 조회
  getRecordById: async (
    recordId: string
  ): Promise<{
    success: boolean;
    data?: Record;
    message?: string;
  }> => {
    try {
      const { data, error } = await supabase
        .from("practice_records")
        .select("*")
        .eq("id", recordId)
        .single();

      if (error) {
        console.error("기록 조회 에러:", error);
        return {
          success: false,
          message: "기록을 찾을 수 없습니다.",
        };
      }

      if (!data) {
        return {
          success: false,
          message: "기록을 찾을 수 없습니다.",
        };
      }

      // 감정 값을 상태로 역변환
      const convertEmotionToStateForList = (emotion: string): string => {
        const emotionMapping: { [key: string]: string } = {
          calm: "calm",
          energized: "energized",
          tired: "tired",
          focused: "focused",
          stressed: "tense",
          happy: "calm",
          relaxed: "calm",
        };
        return emotionMapping[emotion] || "calm";
      };

      // 데이터 변환
      const record: Record = {
        id: data.id,
        user_id: data.user_id,
        title: data.title || `수련 기록 - ${data.practice_date}`,
        photos: [],
        date: data.practice_date,
        asanas: data.asanas || [],
        states: data.emotion
          ? [convertEmotionToStateForList(data.emotion)]
          : [],
        memo: data.memo || "",
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return {
        success: true,
        data: record,
      };
    } catch (error) {
      console.error("기록 조회 에러:", error);
      return {
        success: false,
        message: "기록 조회 중 오류가 발생했습니다.",
      };
    }
  },

  // 기록 수정
  updateRecord: async (
    recordId: string,
    formData: RecordFormData
  ): Promise<{
    success: boolean;
    data?: Record;
    message?: string;
  }> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return {
          success: false,
          message: "사용자 인증이 필요합니다.",
        };
      }

      const { data, error } = await supabase
        .from("practice_records")
        .update({
          title: formData.title, // 기록 제목
          asanas: formData.asanas,
          states: formData.states,
          memo: formData.memo,
          photos: formData.photos || [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", recordId)
        .eq("user_id", userData.user.id)
        .select()
        .single();

      if (error) {
        console.error("기록 수정 에러:", error);
        return {
          success: false,
          message: "기록 수정에 실패했습니다.",
        };
      }

      if (!data) {
        return {
          success: false,
          message: "기록을 찾을 수 없습니다.",
        };
      }

      // JSON 문자열을 파싱하여 배열로 변환
      let asanas: string[] = [];
      let states: string[] = [];
      let photos: string[] = [];

      try {
        if (typeof data.asanas === "string") {
          asanas = JSON.parse(data.asanas);
        } else if (Array.isArray(data.asanas)) {
          asanas = data.asanas;
        }

        if (typeof data.states === "string") {
          states = JSON.parse(data.states);
        } else if (Array.isArray(data.states)) {
          states = data.states;
        }

        if (typeof data.photos === "string") {
          photos = JSON.parse(data.photos);
        } else if (Array.isArray(data.photos)) {
          photos = data.photos;
        }
      } catch (error) {
        console.error("JSON 파싱 에러:", error);
        asanas = [];
        states = [];
        photos = [];
      }

      // 수정된 기록 반환
      const updatedRecord: Record = {
        id: data.id,
        user_id: data.user_id,
        date: data.practice_date,
        title: data.title || `수련 기록 - ${data.practice_date}`,
        asanas: asanas,
        states: states,
        memo: data.memo || "",
        photos: photos,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return {
        success: true,
        data: updatedRecord,
      };
    } catch (error) {
      console.error("기록 수정 에러:", error);
      return {
        success: false,
        message: "기록 수정 중 오류가 발생했습니다.",
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
      const fromDate = thirtyDaysAgo.toISOString().split("T")[0];

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

      // 감정 값을 상태로 역변환 (getRecentRecords용)
      const convertEmotionToStateForList = (emotion: string): string => {
        const emotionMapping: { [key: string]: string } = {
          calm: "calm",
          energized: "energized",
          tired: "tired",
          focused: "focused",
          stressed: "tense",
          happy: "calm",
          relaxed: "calm",
        };
        return emotionMapping[emotion] || "calm";
      };

      // 데이터 변환 - 새로운 스키마 사용
      const convertedData: Record[] = (data || []).map((item) => {
        // JSON 문자열을 파싱하여 배열로 변환
        let asanas: string[] = [];
        let states: string[] = [];
        let photos: string[] = [];

        try {
          if (typeof item.asanas === "string") {
            asanas = JSON.parse(item.asanas);
          } else if (Array.isArray(item.asanas)) {
            asanas = item.asanas;
          }

          if (typeof item.states === "string") {
            states = JSON.parse(item.states);
          } else if (Array.isArray(item.states)) {
            states = item.states;
          }

          if (typeof item.photos === "string") {
            photos = JSON.parse(item.photos);
          } else if (Array.isArray(item.photos)) {
            photos = item.photos;
          }
        } catch (error) {
          console.error("JSON 파싱 에러:", error);
          // 파싱 실패 시 빈 배열로 설정
          asanas = [];
          states = [];
          photos = [];
        }

        return {
          id: item.id,
          user_id: item.user_id,
          date: item.practice_date,
          title: item.title || `수련 기록 - ${item.practice_date}`,
          asanas: asanas,
          memo: item.memo || "",
          states: states,
          photos: photos,
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      });

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
