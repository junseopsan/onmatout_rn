import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Studio, studioAPI } from "../lib/api/studio";

// 페이지네이션으로 요가원 데이터 조회 (100개씩)
export const useStudiosWithPagination = (pageSize: number = 100) => {
  return useInfiniteQuery({
    queryKey: ["studios", "pagination", pageSize],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await studioAPI.getStudiosWithPagination(pageParam, pageSize);
      if (!result.success) {
        throw new Error(
          result.message || "요가원 데이터를 불러오는데 실패했습니다."
        );
      }
      return {
        data: result.data || [],
        hasMore: result.hasMore || false,
        totalCount: result.totalCount || 0,
        nextPage: result.hasMore ? pageParam + 1 : undefined,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 2,
  });
};

// 모든 요가원 데이터 조회 (검색용 - 전체 개수 확인용)
export const useAllStudios = () => {
  return useQuery({
    queryKey: ["studios", "all"],
    queryFn: async () => {
      const result = await studioAPI.getAllStudios();
      if (!result.success) {
        throw new Error(
          result.message || "요가원 데이터를 불러오는데 실패했습니다."
        );
      }
      return result.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 30 * 60 * 1000, // 30분
    retry: 2,
  });
};

// 요가원 검색 (서버 사이드 - 전체 데이터에서 검색)
export const useStudioSearch = (query: string) => {
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  return useQuery<Studio[], Error>({
    queryKey: ["studios", "search", trimmedQuery],
    queryFn: async () => {
      if (!hasQuery) {
        return [];
      }

      // 서버 사이드에서 전체 데이터 검색
      const result = await studioAPI.searchStudios(trimmedQuery);
      if (!result.success) {
        throw new Error(
          result.message || "검색에 실패했습니다."
        );
      }

      return result.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
    enabled: hasQuery, // 검색어가 있을 때만 활성화
  });
};

// 지역별 요가원 필터링 (서버 사이드)
export const useStudiosByRegion = (regionName: string | null) => {
  return useQuery<Studio[], Error>({
    queryKey: ["studios", "region", regionName],
    queryFn: async () => {
      if (!regionName) {
        const result = await studioAPI.getAllStudios();
        if (!result.success) {
          throw new Error(
            result.message || "요가원 데이터를 불러오는데 실패했습니다."
          );
        }
        return result.data || [];
      }

      const result = await studioAPI.filterStudiosByRegion(regionName);
      if (!result.success) {
        throw new Error(
          result.message || "지역별 필터링에 실패했습니다."
        );
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    enabled: true,
  });
};
