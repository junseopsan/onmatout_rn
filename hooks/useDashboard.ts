import { useQuery } from "@tanstack/react-query";
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

// 전체 수련 기록 조회 (프로필 통계용)
export const useAllRecords = () => {
  return useQuery({
    queryKey: ["allRecords"],
    queryFn: async () => {
      const result = await recordsAPI.getAllRecords();
      if (!result.success) {
        throw new Error(
          result.message || "전체 수련 기록을 불러오는데 실패했습니다."
        );
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 2,
  });
};

// 즐겨찾기 아사나 상세 정보 조회
export const useFavoriteAsanasDetail = () => {
  return useQuery({
    queryKey: ["favoriteAsanasDetail"],
    queryFn: async () => {
      // 즐겨찾기 ID 목록과 전체 아사나 데이터를 병렬로 가져오기
      const [favoriteResult, allAsanasResult] = await Promise.all([
        asanasAPI.getFavoriteAsanas(),
        asanasAPI.getAllAsanas(),
      ]);

      if (!favoriteResult.success) {
        throw new Error(
          favoriteResult.message || "즐겨찾기 아사나를 불러오는데 실패했습니다."
        );
      }

      if (!allAsanasResult.success) {
        throw new Error(
          allAsanasResult.message || "아사나 데이터를 불러오는데 실패했습니다."
        );
      }

      const favoriteIds = favoriteResult.data || [];
      const allAsanasData = allAsanasResult.data || [];

      // 즐겨찾기 아사나 정보만 필터링
      const favoriteAsanasData = allAsanasData.filter((asana) =>
        favoriteIds.includes(asana.id)
      );

      return favoriteAsanasData;
    },
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 2,
  });
};

// 대시보드 전체 데이터 조회 (병렬 처리)
export const useDashboardData = () => {
  const todayRecordsQuery = useTodayRecords();
  const recentRecordsQuery = useRecentRecords();
  const allRecordsQuery = useAllRecords();
  const favoriteAsanasQuery = useFavoriteAsanasDetail();

  return {
    todayRecords: (todayRecordsQuery.data || []) as Record[],
    recentRecords: (recentRecordsQuery.data || []) as Record[],
    allRecords: (allRecordsQuery.data || []) as Record[], // 전체 기록 추가
    favoriteAsanas: (favoriteAsanasQuery.data || []) as Asana[],
    isLoading:
      todayRecordsQuery.isLoading ||
      recentRecordsQuery.isLoading ||
      allRecordsQuery.isLoading ||
      favoriteAsanasQuery.isLoading,
    isError:
      todayRecordsQuery.isError ||
      recentRecordsQuery.isError ||
      allRecordsQuery.isError ||
      favoriteAsanasQuery.isError,
    error:
      todayRecordsQuery.error ||
      recentRecordsQuery.error ||
      allRecordsQuery.error ||
      favoriteAsanasQuery.error,
    refetch: () => {
      todayRecordsQuery.refetch();
      recentRecordsQuery.refetch();
      allRecordsQuery.refetch();
      favoriteAsanasQuery.refetch();
    },
  };
};
