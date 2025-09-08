import { useQuery } from "@tanstack/react-query";
import { Studio, studioAPI } from "../lib/api/studio";

// 모든 요가원 데이터 조회
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
    cacheTime: 30 * 60 * 1000, // 30분
    retry: 2,
  });
};

// 요가원 검색
export const useStudioSearch = (query: string) => {
  return useQuery<Studio[], Error>({
    queryKey: ["studios", "search", query],
    queryFn: async () => {
      // 전체 요가원 데이터를 가져와서 클라이언트 사이드에서 검색
      const result = await studioAPI.getAllStudios();
      if (!result.success) {
        throw new Error(
          result.message || "요가원 데이터를 불러오는데 실패했습니다."
        );
      }

      if (!query.trim()) {
        return result.data || [];
      }

      const searchTerms = query.toLowerCase().trim().split(/\s+/);
      return (result.data || []).filter((studio) => {
        const name = studio.name.toLowerCase().trim();
        const address = studio.address.toLowerCase().trim();

        const nameMatch = searchTerms.every((term) => name.includes(term));
        const addressMatch = searchTerms.every((term) =>
          address.includes(term)
        );

        return nameMatch || addressMatch;
      });
    },
    staleTime: 2 * 60 * 1000, // 2분
    cacheTime: 5 * 60 * 1000, // 5분
    enabled: true, // 항상 활성화 (검색어가 없어도 전체 목록 표시)
  });
};
