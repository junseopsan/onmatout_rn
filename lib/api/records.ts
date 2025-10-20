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
        return {
          success: false,
          message: error.message || "기록을 가져오는데 실패했습니다.",
        };
      }

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
      return {
        success: false,
        message: "기록을 가져오는 중 오류가 발생했습니다.",
      };
    }
  },

  // 기록 생성 (하루에 여러 기록 허용)
  createRecord: async (
    recordData: RecordFormData,
    userId?: string
  ): Promise<{
    success: boolean;
    data?: Record;
    message?: string;
  }> => {
    try {
      const practiceDate =
        recordData.date || new Date().toISOString().split("T")[0];

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

      // 새로운 기록 생성 (하루에 여러 기록 허용)
      const recordPayload = {
        user_id: user_id,
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
      return {
        success: false,
        message: "기록을 저장하는 중 오류가 발생했습니다.",
      };
    }
  },

  // 기록 삭제
  deleteRecord: async (
    id: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> => {
    try {
      const { error } = await supabase
        .from("practice_records")
        .delete()
        .eq("id", id);

      if (error) {
        return {
          success: false,
          message: error.message || "기록을 삭제하는데 실패했습니다.",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
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
      return {
        success: false,
        message: "기록 조회 중 오류가 발생했습니다.",
      };
    }
  },

  // 기록 수정
  updateRecord: async (
    recordId: string,
    formData: RecordFormData,
    userId?: string
  ): Promise<{
    success: boolean;
    data?: Record;
    message?: string;
  }> => {
    try {
      // 사용자 ID 확인 (파라미터로 받거나 auth에서 가져오기)
      let user_id = userId;
      if (!user_id) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          return {
            success: false,
            message: "사용자 인증이 필요합니다.",
          };
        }
        user_id = userData.user.id;
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
        .eq("user_id", user_id)
        .select()
        .single();

      if (error) {
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
      return {
        success: false,
        message: "기록 수정 중 오류가 발생했습니다.",
      };
    }
  },

  // 모든 수련 기록 가져오기 (프로필 통계용)
  getAllRecords: async (
    userId?: string
  ): Promise<{
    success: boolean;
    data?: Record[];
    message?: string;
  }> => {
    try {
      // 사용자 ID가 없으면 오류 반환
      if (!userId) {
        return {
          success: false,
          message: "사용자 ID가 필요합니다.",
        };
      }

      const { data, error } = await supabase
        .from("practice_records")
        .select("*")
        .eq("user_id", userId)
        .order("practice_date", { ascending: false });

      if (error) {
        return {
          success: false,
          message: error.message || "기록을 가져오는데 실패했습니다.",
        };
      }

      // 데이터 변환
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
      return {
        success: false,
        message: "기록을 가져오는 중 오류가 발생했습니다.",
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

      // 아사나 상세 정보 가져오기
      const allAsanas = await supabase.from("asanas").select("*");

      if (allAsanas.error) {
        console.error("아사나 데이터 조회 실패:", allAsanas.error);
      }

      const asanasMap = new Map();
      if (allAsanas.data) {
        allAsanas.data.forEach((asana) => {
          asanasMap.set(asana.id, asana);
        });
      }

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
          // 파싱 실패 시 빈 배열로 설정
          asanas = [];
          states = [];
          photos = [];
        }

        // 아사나 ID를 상세 정보로 변환
        const asanaDetails = asanas
          .map((asanaId) => asanasMap.get(asanaId))
          .filter(Boolean);

        return {
          id: item.id,
          user_id: item.user_id,
          date: item.practice_date,
          title: item.title || `수련 기록 - ${item.practice_date}`,
          asanas: asanaDetails, // 아사나 상세 정보 포함
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
      return {
        success: false,
        message: "기록을 가져오는 중 오류가 발생했습니다.",
      };
    }
  },

  // 모든 사용자의 수련 기록 피드 가져오기 (페이지네이션)
  getFeedRecords: async (
    page: number = 0,
    pageSize: number = 10
  ): Promise<{
    success: boolean;
    data?: (Record & { user_name: string; user_avatar_url?: string })[];
    hasMore?: boolean;
    total?: number;
    message?: string;
  }> => {
    try {
      const offset = page * pageSize;

      // 먼저 practice_records를 가져오고, 각 기록에 대해 user_profiles를 별도로 조회
      console.log("getFeedRecords 시작:", { page, pageSize, offset });
      const { data: records, error: recordsError } = await supabase
        .from("practice_records")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      console.log("practice_records 조회 결과:", {
        recordsLength: records?.length || 0,
        recordsError: recordsError?.message,
        records: records?.slice(0, 2), // 처음 2개만 로깅
      });

      if (recordsError) {
        return {
          success: false,
          message:
            recordsError.message || "피드 기록을 가져오는데 실패했습니다.",
        };
      }

      if (!records || records.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      // 각 기록에 대해 사용자 프로필 정보 조회
      const userIds = [...new Set(records.map((record) => record.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", userIds);

      if (profilesError) {
        return {
          success: false,
          message: "사용자 프로필을 가져오는데 실패했습니다.",
        };
      }

      // 프로필 정보를 맵으로 변환
      const profilesMap = new Map();
      profiles?.forEach((profile) => {
        profilesMap.set(profile.user_id, profile);
      });

      // 데이터 변환
      const feedRecords = records.map((record) => {
        const profile = profilesMap.get(record.user_id);
        return {
          ...record,
          user_name: profile?.name || "익명",
          user_avatar_url: profile?.avatar_url || null,
        };
      });

      // 총 개수 조회
      const { count: totalCount } = await supabase
        .from("practice_records")
        .select("*", { count: "exact", head: true });

      return {
        success: true,
        data: feedRecords,
        hasMore: offset + pageSize < (totalCount || 0),
        total: totalCount || 0,
      };
    } catch (error) {
      return {
        success: false,
        message: "피드 기록을 가져오는데 실패했습니다.",
      };
    }
  },

  // 좋아요 추가/제거
  toggleLike: async (
    recordId: string
  ): Promise<{
    success: boolean;
    data?: { isLiked: boolean; likeCount: number };
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

      // 현재 좋아요 상태 확인
      const { data: existingLike } = await supabase
        .from("feed_likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("record_id", recordId)
        .single();

      if (existingLike) {
        // 좋아요 제거
        const { error: deleteError } = await supabase
          .from("feed_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("record_id", recordId);

        if (deleteError) {
          throw deleteError;
        }
      } else {
        // 좋아요 추가
        const { error: insertError } = await supabase
          .from("feed_likes")
          .insert({
            user_id: user.id,
            record_id: recordId,
          });

        if (insertError) {
          throw insertError;
        }
      }

      // 좋아요 개수 조회
      const { count: likeCount } = await supabase
        .from("feed_likes")
        .select("*", { count: "exact", head: true })
        .eq("record_id", recordId);

      return {
        success: true,
        data: {
          isLiked: !existingLike,
          likeCount: likeCount || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: "좋아요 처리에 실패했습니다.",
      };
    }
  },

  // 댓글 추가
  addComment: async (
    recordId: string,
    content: string,
    userId?: string
  ): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> => {
    try {
      // 사용자 ID 확인 (파라미터로 받거나 auth에서 가져오기)
      let user_id = userId;
      if (!user_id) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          return {
            success: false,
            message: "사용자 인증이 필요합니다.",
          };
        }
        user_id = userData.user.id;
      }

      const { data, error } = await supabase
        .from("feed_comments")
        .insert({
          user_id: user_id,
          record_id: recordId,
          content,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      // 사용자 프로필 정보 별도 조회
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("name, avatar_url")
        .eq("user_id", user.id)
        .single();

      return {
        success: true,
        data: {
          ...data,
          user_profiles: profile,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: "댓글 추가에 실패했습니다.",
      };
    }
  },

  // 댓글 조회
  getComments: async (
    recordId: string
  ): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> => {
    try {
      const { data, error } = await supabase
        .from("feed_comments")
        .select("*")
        .eq("record_id", recordId)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      // 각 댓글에 대해 사용자 프로필 정보 조회
      const userIds = [...new Set(data.map((comment) => comment.user_id))];
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", userIds);

      // 프로필 정보를 맵으로 변환
      const profilesMap = new Map();
      profiles?.forEach((profile) => {
        profilesMap.set(profile.user_id, profile);
      });

      // 데이터 변환
      const commentsWithProfiles = data.map((comment) => {
        const profile = profilesMap.get(comment.user_id);
        return {
          ...comment,
          user_profiles: profile,
        };
      });

      return {
        success: true,
        data: commentsWithProfiles,
      };
    } catch (error) {
      return {
        success: false,
        message: "댓글을 불러오는데 실패했습니다.",
      };
    }
  },

  // 공유 추가
  addShare: async (
    recordId: string
  ): Promise<{
    success: boolean;
    data?: any;
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
        .from("feed_shares")
        .insert({
          user_id: user.id,
          record_id: recordId,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: "공유 처리에 실패했습니다.",
      };
    }
  },

  // 기록의 소셜 통계 조회
  getRecordStats: async (
    recordId: string
  ): Promise<{
    success: boolean;
    data?: {
      likeCount: number;
      commentCount: number;
      shareCount: number;
      isLiked: boolean;
    };
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

      // 좋아요 개수 및 현재 사용자 좋아요 상태
      const { count: likeCount } = await supabase
        .from("feed_likes")
        .select("*", { count: "exact", head: true })
        .eq("record_id", recordId);

      const { data: userLike } = await supabase
        .from("feed_likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("record_id", recordId)
        .single();

      // 댓글 개수
      const { count: commentCount } = await supabase
        .from("feed_comments")
        .select("*", { count: "exact", head: true })
        .eq("record_id", recordId);

      // 공유 개수
      const { count: shareCount } = await supabase
        .from("feed_shares")
        .select("*", { count: "exact", head: true })
        .eq("record_id", recordId);

      return {
        success: true,
        data: {
          likeCount: likeCount || 0,
          commentCount: commentCount || 0,
          shareCount: shareCount || 0,
          isLiked: !!userLike,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: "통계를 불러오는데 실패했습니다.",
      };
    }
  },
};
