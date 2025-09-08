import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { asanasAPI } from "../lib/api/asanas";

// 아사나 목록 조회 (무한 스크롤)
export const useAsanas = (pageSize: number = 20) => {
  return useInfiniteQuery({
    queryKey: ["asanas"],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await asanasAPI.getAllAsanas();
      if (!result.success || !result.data) {
        throw new Error(
          result.message || "아사나 데이터를 불러오는데 실패했습니다."
        );
      }

      // 클라이언트 사이드에서 페이지네이션 처리
      const startIndex = pageParam * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = result.data.slice(startIndex, endIndex);

      return {
        data: paginatedData,
        nextCursor: endIndex < result.data.length ? pageParam + 1 : undefined,
        hasMore: endIndex < result.data.length,
        total: result.data.length,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
    retry: 2,
  });
};

// 즐겨찾기 아사나 조회
export const useFavoriteAsanas = () => {
  return useQuery({
    queryKey: ["favoriteAsanas"],
    queryFn: async () => {
      const result = await asanasAPI.getFavoriteAsanas();
      if (!result.success) {
        throw new Error(
          result.message || "즐겨찾기 아사나를 불러오는데 실패했습니다."
        );
      }
      return result.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2분
    cacheTime: 5 * 60 * 1000, // 5분
    retry: 2,
  });
};

// 아사나 상세 조회
export const useAsanaDetail = (id: string) => {
  return useQuery({
    queryKey: ["asanaDetail", id],
    queryFn: async () => {
      const result = await asanasAPI.getAllAsanas();
      if (!result.success || !result.data) {
        throw new Error(
          result.message || "아사나 데이터를 불러오는데 실패했습니다."
        );
      }

      const asana = result.data.find((a) => a.id === id);
      if (!asana) {
        throw new Error("아사나를 찾을 수 없습니다.");
      }

      return asana;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10분
    cacheTime: 30 * 60 * 1000, // 30분
    retry: 2,
  });
};

// 아사나 검색
export const useAsanaSearch = (query: string) => {
  return useQuery({
    queryKey: ["asanaSearch", query],
    queryFn: async () => {
      const result = await asanasAPI.getAllAsanas();
      if (!result.success || !result.data) {
        throw new Error(
          result.message || "아사나 데이터를 불러오는데 실패했습니다."
        );
      }

      if (!query.trim()) {
        return [];
      }

      const searchTerms = query.toLowerCase().trim().split(/\s+/);
      return result.data.filter((asana) => {
        const krName = asana.sanskrit_name_kr.toLowerCase().trim();
        const enName = asana.sanskrit_name_en.toLowerCase().trim();

        const krMatch = searchTerms.every((term) => krName.includes(term));
        const enMatch = searchTerms.every((term) => enName.includes(term));

        return krMatch || enMatch;
      });
    },
    enabled: query.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2분
    cacheTime: 5 * 60 * 1000, // 5분
    retry: 2,
  });
};
