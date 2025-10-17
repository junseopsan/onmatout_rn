import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Asana, asanasAPI } from "../lib/api/asanas";
import { recordsAPI } from "../lib/api/records";
import { supabase } from "../lib/supabase";
import { Record, RecordFormData } from "../types/record";

// 오늘의 수련 기록 조회
export const useTodayRecords = () => {
  return useQuery({
    queryKey: ["todayRecords"],
    queryFn: async () => {
      const result = await recordsAPI.getTodayRecords();
      if (!result.success) {
        throw new Error(
          result.message || "오늘의 수련 기록을 불러오는데 실패했습니다."
        );
      }
      return result.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
    retry: 2,
  });
};

// 최근 수련 기록 조회
export const useRecentRecords = () => {
  return useQuery({
    queryKey: ["recentRecords"],
    queryFn: async () => {
      const result = await recordsAPI.getRecentRecords();
      if (!result.success) {
        throw new Error(
          result.message || "최근 수련 기록을 불러오는데 실패했습니다."
        );
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 2,
  });
};

// 모든 아사나 데이터 조회
export const useAllAsanas = () => {
  return useQuery({
    queryKey: ["allAsanas"],
    queryFn: async () => {
      const result = await asanasAPI.getAllAsanas();
      if (!result.success) {
        throw new Error(
          result.message || "아사나 데이터를 불러오는데 실패했습니다."
        );
      }
      return result.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 30 * 60 * 1000, // 30분
    retry: 2,
  });
};

// 기록 삭제 mutation
export const useDeleteRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await recordsAPI.deleteRecord(id);
      if (!result.success) {
        throw new Error(result.message || "기록 삭제에 실패했습니다.");
      }
      return result;
    },
    onSuccess: () => {
      // 관련 쿼리들 무효화하여 새로고침
      queryClient.invalidateQueries({ queryKey: ["todayRecords"] });
      queryClient.invalidateQueries({ queryKey: ["recentRecords"] });
    },
  });
};

// 기록 수정 mutation
export const useUpdateRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      recordData,
    }: {
      id: string;
      recordData: RecordFormData;
    }) => {
      const result = await recordsAPI.updateRecord(id, recordData);
      if (!result.success) {
        throw new Error(result.message || "기록 수정에 실패했습니다.");
      }
      return result;
    },
    onSuccess: () => {
      // 관련 쿼리들 무효화하여 새로고침
      queryClient.invalidateQueries({ queryKey: ["todayRecords"] });
      queryClient.invalidateQueries({ queryKey: ["recentRecords"] });
      queryClient.invalidateQueries({ queryKey: ["feedRecords"] });
      queryClient.invalidateQueries({ queryKey: ["favoriteAsanas"] });
      queryClient.invalidateQueries({ queryKey: ["favoriteAsanasDetail"] });
    },
  });
};

// 피드 기록 조회 (무한 스크롤)
export const useFeedRecords = (pageSize: number = 10) => {
  return useInfiniteQuery({
    queryKey: ["feedRecords"],
    queryFn: async ({ pageParam = 0 }) => {
      console.log("useFeedRecords 쿼리 실행:", { pageParam, pageSize });
      const result = await recordsAPI.getFeedRecords(
        pageParam as number,
        pageSize
      );
      console.log("useFeedRecords API 결과:", {
        success: result.success,
        dataLength: result.data?.length || 0,
        hasMore: result.hasMore,
        total: result.total,
        message: result.message,
      });
      if (!result.success) {
        throw new Error(
          result.message || "피드 기록을 불러오는데 실패했습니다."
        );
      }
      return {
        data: result.data || [],
        hasMore: result.hasMore || false,
        total: result.total || 0,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages: any[]) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 2,
  });
};

// 기록의 소셜 통계 조회
export const useRecordStats = (recordId: string) => {
  return useQuery({
    queryKey: ["recordStats", recordId],
    queryFn: async () => {
      const result = await recordsAPI.getRecordStats(recordId);
      if (!result.success) {
        throw new Error(result.message || "통계를 불러오는데 실패했습니다.");
      }
      return result.data;
    },
    staleTime: 30 * 1000, // 30초
    gcTime: 2 * 60 * 1000, // 2분
    retry: 1,
  });
};

// 댓글 조회
export const useComments = (recordId: string) => {
  return useQuery({
    queryKey: ["comments", recordId],
    queryFn: async () => {
      const result = await recordsAPI.getComments(recordId);
      if (!result.success) {
        throw new Error(result.message || "댓글을 불러오는데 실패했습니다.");
      }
      return result.data || [];
    },
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
    retry: 1,
  });
};

// 좋아요 토글 mutation
export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordId: string) => {
      const result = await recordsAPI.toggleLike(recordId);
      if (!result.success) {
        throw new Error(result.message || "좋아요 처리에 실패했습니다.");
      }
      return { recordId, ...result.data };
    },
    onMutate: async (recordId: string) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ["recordStats", recordId] });

      // 이전 데이터 백업
      const previousStats = queryClient.getQueryData(["recordStats", recordId]);

      // 낙관적 업데이트
      queryClient.setQueryData(["recordStats", recordId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isLiked: !old.isLiked,
          likeCount: old.isLiked ? old.likeCount - 1 : old.likeCount + 1,
        };
      });

      // 롤백을 위한 이전 데이터 반환
      return { previousStats };
    },
    onError: (err, recordId, context) => {
      // 에러 시 이전 데이터로 롤백
      if (context?.previousStats) {
        queryClient.setQueryData(
          ["recordStats", recordId],
          context.previousStats
        );
      }
    },
    onSettled: (data) => {
      // 성공/실패 관계없이 최종 데이터 동기화
      queryClient.invalidateQueries({
        queryKey: ["recordStats", data?.recordId],
      });
    },
  });
};

// 댓글 추가 mutation
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recordId,
      content,
    }: {
      recordId: string;
      content: string;
    }) => {
      const result = await recordsAPI.addComment(recordId, content);
      if (!result.success) {
        throw new Error(result.message || "댓글 추가에 실패했습니다.");
      }
      return { recordId, comment: result.data };
    },
    onMutate: async ({ recordId, content }) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ["comments", recordId] });
      await queryClient.cancelQueries({ queryKey: ["recordStats", recordId] });

      // 이전 데이터 백업
      const previousComments = queryClient.getQueryData(["comments", recordId]);
      const previousStats = queryClient.getQueryData(["recordStats", recordId]);

      // 현재 사용자 정보 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let currentUserProfile = null;

      if (user) {
        try {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("name, avatar_url")
            .eq("user_id", user.id)
            .single();
          currentUserProfile = profile;
        } catch (error) {
          console.log("현재 사용자 프로필 조회 실패:", error);
        }
      }

      // 임시 댓글 ID 생성
      const tempId = `temp-${Date.now()}`;

      // 낙관적 업데이트 - 댓글 목록에 임시 댓글 추가
      queryClient.setQueryData(["comments", recordId], (old: any[]) => {
        const newComment = {
          id: tempId,
          user_id: user?.id || "current-user",
          record_id: recordId,
          content,
          created_at: new Date().toISOString(),
          user_profiles: {
            name: currentUserProfile?.name || "나",
            avatar_url: currentUserProfile?.avatar_url || null,
          },
        };
        return [...(old || []), newComment];
      });

      // 댓글 개수 증가
      queryClient.setQueryData(["recordStats", recordId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          commentCount: old.commentCount + 1,
        };
      });

      return { previousComments, previousStats, tempId };
    },
    onError: (err, variables, context) => {
      // 에러 시 이전 데이터로 롤백
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["comments", variables.recordId],
          context.previousComments
        );
      }
      if (context?.previousStats) {
        queryClient.setQueryData(
          ["recordStats", variables.recordId],
          context.previousStats
        );
      }
    },
    onSuccess: (data, variables, context) => {
      // 성공 시 임시 댓글을 실제 댓글로 교체
      queryClient.setQueryData(["comments", data.recordId], (old: any[]) => {
        return (
          old?.map((comment) =>
            comment.id === context?.tempId ? data.comment : comment
          ) || []
        );
      });
    },
    onSettled: (data) => {
      // 최종 데이터 동기화
      queryClient.invalidateQueries({ queryKey: ["comments", data?.recordId] });
      queryClient.invalidateQueries({
        queryKey: ["recordStats", data?.recordId],
      });
    },
  });
};

// 공유 추가 mutation
export const useAddShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordId: string) => {
      const result = await recordsAPI.addShare(recordId);
      if (!result.success) {
        throw new Error(result.message || "공유 처리에 실패했습니다.");
      }
      return { recordId, share: result.data };
    },
    onMutate: async (recordId: string) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ["recordStats", recordId] });

      // 이전 데이터 백업
      const previousStats = queryClient.getQueryData(["recordStats", recordId]);

      // 낙관적 업데이트 - 공유 개수 증가
      queryClient.setQueryData(["recordStats", recordId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          shareCount: old.shareCount + 1,
        };
      });

      return { previousStats };
    },
    onError: (err, recordId, context) => {
      // 에러 시 이전 데이터로 롤백
      if (context?.previousStats) {
        queryClient.setQueryData(
          ["recordStats", recordId],
          context.previousStats
        );
      }
    },
    onSettled: (data) => {
      // 최종 데이터 동기화
      queryClient.invalidateQueries({
        queryKey: ["recordStats", data?.recordId],
      });
    },
  });
};

// 기록 탭 전체 데이터 조회 (병렬 처리)
export const useRecordData = () => {
  const todayRecordsQuery = useTodayRecords();
  const recentRecordsQuery = useRecentRecords();
  const allAsanasQuery = useAllAsanas();

  return {
    todayRecords: (todayRecordsQuery.data || []) as Record[],
    recentRecords: (recentRecordsQuery.data || []) as Record[],
    allAsanas: (allAsanasQuery.data || []) as Asana[],
    isLoading:
      todayRecordsQuery.isLoading ||
      recentRecordsQuery.isLoading ||
      allAsanasQuery.isLoading,
    isError:
      todayRecordsQuery.isError ||
      recentRecordsQuery.isError ||
      allAsanasQuery.isError,
    error:
      todayRecordsQuery.error ||
      recentRecordsQuery.error ||
      allAsanasQuery.error,
    refetch: () => {
      todayRecordsQuery.refetch();
      recentRecordsQuery.refetch();
      allAsanasQuery.refetch();
    },
  };
};
