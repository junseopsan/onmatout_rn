import { Record, RecordFormData } from "../../types/record";
import { ensureAuthenticated, supabase } from "../supabase";
import { logger } from "../utils/logger";

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
      const auth = await ensureAuthenticated();
      if (!auth) {
        return {
          success: false,
          message: "사용자 인증이 필요합니다. 다시 로그인해주세요.",
        };
      }

      const { data, error } = await supabase
        .from("practice_records")
        .select("*")
        .eq("practice_date", today)
        .eq("user_id", auth.userId)
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
        const auth = await ensureAuthenticated();
        if (!auth) {
          return {
            success: false,
            message: "사용자 인증이 필요합니다. 다시 로그인해주세요.",
          };
        }
        user_id = auth.userId;
      }

      // 기록 페이로드. 권한은 RLS(auth.uid())가 보장하고,
      // 세션은 supabase 클라이언트가 요청에 자동 첨부하므로 별도 검증 불필요.
      const recordPayload = {
        user_id,
        practice_date: practiceDate,
        practice_time: new Date().toISOString(),
        title: recordData.title,
        asanas: recordData.asanas,
        memo: recordData.memo,
        states: recordData.states,
        photos: recordData.photos || [],
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("practice_records")
        .insert(recordPayload)
        .select()
        .single();

      if (error) {
        logger.error("기록 저장 실패:", {
          error: error.message,
          code: error.code,
          userId: user_id,
        });
        if (
          error.code === "42501" ||
          error.message.includes("row-level security")
        ) {
          return {
            success: false,
            message: "인증이 필요합니다. 다시 로그인해주세요.",
          };
        }
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
        const auth = await ensureAuthenticated();
        if (!auth) {
          return {
            success: false,
            message: "사용자 인증이 필요합니다. 다시 로그인해주세요.",
          };
        }
        user_id = auth.userId;
      }

      const { data, error } = await supabase
        .from("practice_records")
        .update({
          title: formData.title, // 기록 제목
          asanas: formData.asanas,
          states: formData.states,
          memo: formData.memo,
          photos: formData.photos || [],
          practice_date: formData.date, // 수련 날짜 업데이트
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
        practice_date: data.practice_date,
        practice_time: data.practice_time,
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

      // 아사나 상세 정보 조회 (카드 썸네일 + 상세 화면 이름, 카테고리용)
      const allAsanas = await supabase.from("asanas").select("*");
      const asanasMap = new Map<
        string,
        {
          id: string;
          image_number?: string;
          category_name_en?: string;
          sanskrit_name_kr?: string;
          sanskrit_name_en?: string;
          [key: string]: unknown;
        }
      >();
      if (allAsanas.data) {
        allAsanas.data.forEach((a) => {
          asanasMap.set(a.id, { ...a });
        });
      }

      // 데이터 변환
      if (data && data.length > 0) {
        const convertedData: Record[] = data.map((item) => {
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
            asanas = [];
            states = [];
            photos = [];
          }

          const asanaDetails = asanas
            .map((asanaId) => asanasMap.get(asanaId))
            .filter(Boolean) as {
            id: string;
            image_number?: string;
            category_name_en?: string;
            sanskrit_name_kr?: string;
            sanskrit_name_en?: string;
            [key: string]: unknown;
          }[];

          return {
            id: item.id,
            user_id: item.user_id,
            date: item.practice_date,
            title: item.title || `수련 기록 - ${item.practice_date}`,
            asanas: asanaDetails.length > 0 ? asanaDetails : asanas,
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
      // 현재 사용자 확인
      const auth = await ensureAuthenticated();
      if (!auth) {
        return {
          success: false,
          message: "사용자 인증이 필요합니다. 다시 로그인해주세요.",
        };
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const fromDate = thirtyDaysAgo.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("practice_records")
        .select("*")
        .gte("practice_date", fromDate)
        .eq("user_id", auth.userId)
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
        logger.error("아사나 데이터 조회 실패:", allAsanas.error);
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
    data?: (Record & {
      user_name: string;
      user_avatar_url?: string;
      stats?: {
        likeCount: number;
        commentCount: number;
        shareCount: number;
        isLiked: boolean;
      };
    })[];
    hasMore?: boolean;
    total?: number;
    message?: string;
  }> => {
    try {
      const offset = page * pageSize;
      const auth = await ensureAuthenticated();
      const currentUserId = auth?.userId ?? null;

      // 먼저 practice_records를 가져오고, 각 기록에 대해 user_profiles를 별도로 조회
      logger.log("getFeedRecords 시작:", { page, pageSize, offset });
      const { data: records, error: recordsError } = await supabase
        .from("practice_records")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

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

      // 소셜 통계(좋아요/댓글/공유)와 현재 사용자 좋아요 상태를 한 번에 조회
      const recordIds = feedRecords.map((r) => r.id);

      // 좋아요 개수
      const likeCountsMap = new Map<string, number>();
      const commentCountsMap = new Map<string, number>();
      const shareCountsMap = new Map<string, number>();

      // 좋아요 행 전체를 가져와 record_id별로 집계 (페이지당 10개라 부담 낮음)
      const { data: likeRows } = await supabase
        .from("feed_likes")
        .select("record_id")
        .in("record_id", recordIds);
      likeRows?.forEach((row: any) => {
        likeCountsMap.set(
          row.record_id,
          (likeCountsMap.get(row.record_id) || 0) + 1
        );
      });

      // 댓글 행 집계
      const { data: commentRows } = await supabase
        .from("feed_comments")
        .select("record_id")
        .in("record_id", recordIds);
      commentRows?.forEach((row: any) => {
        commentCountsMap.set(
          row.record_id,
          (commentCountsMap.get(row.record_id) || 0) + 1
        );
      });

      // 공유 행 집계
      const { data: shareRows } = await supabase
        .from("feed_shares")
        .select("record_id")
        .in("record_id", recordIds);
      shareRows?.forEach((row: any) => {
        shareCountsMap.set(
          row.record_id,
          (shareCountsMap.get(row.record_id) || 0) + 1
        );
      });

      // 현재 사용자 좋아요 상태
      let likedIds = new Set<string>();
      if (currentUserId) {
        const { data: userLikes } = await supabase
          .from("feed_likes")
          .select("record_id")
          .eq("user_id", currentUserId)
          .in("record_id", recordIds);
        likedIds = new Set(userLikes?.map((row: any) => row.record_id) || []);
      }

      // feedRecords에 stats 병합
      const feedRecordsWithStats = feedRecords.map((record) => ({
        ...record,
        stats: {
          likeCount: likeCountsMap.get(record.id) || 0,
          commentCount: commentCountsMap.get(record.id) || 0,
          shareCount: shareCountsMap.get(record.id) || 0,
          isLiked: likedIds.has(record.id),
        },
      }));

      // 총 개수 조회는 첫 페이지(page === 0)일 때만 수행하여 성능 최적화
      let totalCount = 0;
      let hasMore = false;

      if (page === 0) {
        // 첫 페이지일 때만 총 개수 조회
        const { count } = await supabase
          .from("practice_records")
          .select("*", { count: "exact", head: true });
        totalCount = count || 0;
        hasMore = offset + pageSize < totalCount;
      } else {
        // 이후 페이지는 데이터 개수로 hasMore 판단
        hasMore = records.length === pageSize;
      }

      return {
        success: true,
        data: feedRecordsWithStats,
        hasMore,
        total: totalCount,
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
      const auth = await ensureAuthenticated();
      if (!auth) {
        console.error("[toggleLike] 인증 실패");
        return {
          success: false,
          message: "사용자 인증이 필요합니다. 다시 로그인해주세요.",
        };
      }

      console.log("[toggleLike] 시작:", { recordId, userId: auth.userId });

      // 현재 좋아요 상태 확인
      const { data: existingLike, error: selectError } = await supabase
        .from("feed_likes")
        .select("id")
        .eq("user_id", auth.userId)
        .eq("record_id", recordId)
        .maybeSingle();

      if (selectError && selectError.code !== "PGRST116") {
        // PGRST116은 "no rows returned" 에러이므로 정상
        console.error("[toggleLike] 좋아요 상태 확인 실패:", selectError);
        throw selectError;
      }

      console.log("[toggleLike] 기존 좋아요 상태:", !!existingLike);

      if (existingLike) {
        // 좋아요 제거
        const { error: deleteError } = await supabase
          .from("feed_likes")
          .delete()
          .eq("user_id", auth.userId)
          .eq("record_id", recordId);

        if (deleteError) {
          console.error("[toggleLike] 좋아요 제거 실패:", deleteError);
          throw deleteError;
        }
        console.log("[toggleLike] 좋아요 제거 성공");
      } else {
        // 좋아요 추가
        const { error: insertError } = await supabase
          .from("feed_likes")
          .insert({
            user_id: auth.userId,
            record_id: recordId,
          });

        if (insertError) {
          console.error("[toggleLike] 좋아요 추가 실패:", insertError);
          throw insertError;
        }
        console.log("[toggleLike] 좋아요 추가 성공");
      }

      // 좋아요 개수 조회
      const { count: likeCount, error: countError } = await supabase
        .from("feed_likes")
        .select("*", { count: "exact", head: true })
        .eq("record_id", recordId);

      if (countError) {
        console.error("[toggleLike] 좋아요 개수 조회 실패:", countError);
        throw countError;
      }

      const result = {
        success: true,
        data: {
          isLiked: !existingLike,
          likeCount: likeCount || 0,
        },
      };

      console.log("[toggleLike] 성공:", result);
      return result;
    } catch (error: any) {
      console.error("[toggleLike] 에러:", error);
      return {
        success: false,
        message: error?.message || "좋아요 처리에 실패했습니다.",
      };
    }
  },

  // 댓글 추가
  addComment: async (
    recordId: string,
    content: string,
    userId?: string,
    parentId?: string
  ): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> => {
    try {
      logger.log("=== 댓글 추가 시작 ===");
      logger.log("입력 파라미터:", { recordId, content, userId });

      // 사용자 ID 확인 (파라미터로 받거나 auth에서 가져오기)
      let user_id = userId;
      if (!user_id) {
        logger.log("userId가 제공되지 않음, auth에서 조회 시도");
        const auth = await ensureAuthenticated();
        if (!auth) {
          logger.log("사용자 인증 실패");
          return {
            success: false,
            message: "사용자 인증이 필요합니다. 다시 로그인해주세요.",
          };
        }
        user_id = auth.userId;
        logger.log("auth에서 사용자 ID 조회:", user_id);
      } else {
        logger.log("제공된 사용자 ID 사용:", user_id);
      }

      logger.log("댓글 삽입 시도:", {
        user_id,
        record_id: recordId,
        content,
        parent_id: parentId,
      });
      const { data, error } = await supabase
        .from("feed_comments")
        .insert({
          user_id: user_id,
          record_id: recordId,
          content,
          parent_id: parentId || null,
        })
        .select("*")
        .single();

      if (error) {
        logger.log("댓글 삽입 실패:", error);
        throw error;
      }

      logger.log("댓글 삽입 성공:", data);

      // 사용자 프로필 정보 별도 조회
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("name, avatar_url")
        .eq("user_id", user_id)
        .single();

      logger.log("사용자 프로필 조회:", profile);

      const result = {
        success: true,
        data: {
          ...data,
          user_profiles: profile,
        },
      };

      logger.log("댓글 추가 최종 결과:", result);
      return result;
    } catch (error) {
      logger.log("댓글 추가 오류:", error);
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
        .order("created_at", { ascending: false }); // 최신순으로 정렬

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

  // 댓글 수정
  updateComment: async (
    commentId: string,
    content: string,
    userId?: string
  ): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> => {
    try {
      logger.log("=== 댓글 수정 시작 ===");
      logger.log("입력 파라미터:", { commentId, content, userId });

      let user_id = userId;
      if (!user_id) {
        logger.log("userId가 제공되지 않음, auth에서 조회 시도");
        const auth = await ensureAuthenticated();
        if (!auth) {
          logger.log("사용자 인증 실패");
          return {
            success: false,
            message: "사용자 인증이 필요합니다. 다시 로그인해주세요.",
          };
        }
        user_id = auth.userId;
        logger.log("auth에서 사용자 ID 조회:", user_id);
      } else {
        logger.log("제공된 사용자 ID 사용:", user_id);
      }

      logger.log("댓글 업데이트 시도:", { commentId, user_id, content });
      const { data, error } = await supabase
        .from("feed_comments")
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", commentId)
        .eq("user_id", user_id)
        .select("id, record_id, content, user_id, created_at, updated_at")
        .single();

      if (error) {
        logger.log("댓글 업데이트 실패:", error);
        throw error;
      }

      logger.log("댓글 업데이트 성공:", data);

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.log("댓글 수정 오류:", error);
      return {
        success: false,
        message: "댓글 수정에 실패했습니다.",
      };
    }
  },

  // 댓글 삭제
  deleteComment: async (
    commentId: string,
    userId?: string
  ): Promise<{
    success: boolean;
    data?: { record_id: string };
    message?: string;
  }> => {
    try {
      logger.log("=== 댓글 삭제 시작 ===");
      logger.log("입력 파라미터:", { commentId, userId });

      let user_id = userId;
      if (!user_id) {
        logger.log("userId가 제공되지 않음, auth에서 조회 시도");
        const auth = await ensureAuthenticated();
        if (!auth) {
          logger.log("사용자 인증 실패");
          return {
            success: false,
            message: "사용자 인증이 필요합니다. 다시 로그인해주세요.",
          };
        }
        user_id = auth.userId;
        logger.log("auth에서 사용자 ID 조회:", user_id);
      } else {
        logger.log("제공된 사용자 ID 사용:", user_id);
      }

      // 삭제하면서 record_id를 함께 반환
      const { data, error } = await supabase
        .from("feed_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user_id)
        .select("record_id")
        .single();

      if (error) {
        logger.log("댓글 삭제 실패:", error);
        throw error;
      }

      logger.log("댓글 삭제 성공:", data);

      return {
        success: true,
        data: data as { record_id: string },
      };
    } catch (error) {
      logger.log("댓글 삭제 오류:", error);
      return {
        success: false,
        message: "댓글 삭제에 실패했습니다.",
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
      const auth = await ensureAuthenticated();
      if (!auth) {
        return {
          success: false,
          message: "사용자 인증이 필요합니다. 다시 로그인해주세요.",
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
        .eq("user_id", auth.userId)
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
