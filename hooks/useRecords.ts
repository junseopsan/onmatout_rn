import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Asana, asanasAPI } from "../lib/api/asanas";
import { recordsAPI } from "../lib/api/records";
import { Record } from "../types/record";

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
    cacheTime: 5 * 60 * 1000, // 5분
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
    cacheTime: 10 * 60 * 1000, // 10분
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
    cacheTime: 30 * 60 * 1000, // 30분
    retry: 2,
  });
};

// 기록 삭제 mutation
export const useDeleteRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: string) => {
      const result = await recordsAPI.deleteRecord(date);
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
