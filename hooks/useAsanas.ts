import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { asanasAPI } from "../lib/api/asanas";

// 아사나 목록 조회 (무한 스크롤)
export const useAsanas = (pageSize: number = 20) => {
  const queryClient = useQueryClient();
  
  return useInfiniteQuery({
    queryKey: ["asanas"],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await asanasAPI.getAllAsanas();
      if (!result.success || !result.data) {
        throw new Error(
          result.message || "아사나 데이터를 불러오는데 실패했습니다."
        );
      }

      // 셔플 없이 원본 순서를 유지한 채 클라이언트 페이지네이션
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
    gcTime: 10 * 60 * 1000, // 10분
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
    gcTime: 5 * 60 * 1000, // 5분
    retry: 2,
  });
};

// 아사나 상세 조회 (ID 단건 조회로 최적화)
export const useAsanaDetail = (id: string) => {
  return useQuery({
    queryKey: ["asanaDetail", id],
    queryFn: async () => {
      const result = await asanasAPI.getAsanaById(id);
      if (!result.success || !result.data) {
        throw new Error(
          result.message || "아사나 데이터를 불러오는데 실패했습니다."
        );
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 30 * 60 * 1000, // 30분
    retry: 2,
    refetchOnMount: true, // 컴포넌트 마운트 시 stale한 데이터가 있으면 refetch
    refetchOnWindowFocus: true, // 포커스 복귀 시 stale한 데이터가 있으면 refetch
  });
};

// 모든 아사나 데이터 조회 (피드용 - 페이지네이션 없이 전체 데이터)
export const useAllAsanasForFeed = () => {
  return useQuery({
    queryKey: ["allAsanasForFeed"],
    queryFn: async () => {
      const result = await asanasAPI.getAllAsanas();
      if (!result.success || !result.data) {
        throw new Error(
          result.message || "아사나 데이터를 불러오는데 실패했습니다."
        );
      }
      return result.data;
    },
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 30 * 60 * 1000, // 30분
    retry: 2,
  });
};

// 아사나 검색
export const normalizeText = (text: string | undefined | null) =>
  (text ?? "")
    .toString()
    .normalize("NFC")
    .toLowerCase()
    .trim();

export const sortAsanasByName = (list: any[]) => {
  return [...(list || [])].sort((a, b) => {
    const aKr = normalizeText(a?.sanskrit_name_kr);
    const bKr = normalizeText(b?.sanskrit_name_kr);
    const primary = aKr.localeCompare(bKr, "ko", { sensitivity: "base" });
    if (primary !== 0) return primary;
    const aEn = normalizeText(a?.sanskrit_name_en);
    const bEn = normalizeText(b?.sanskrit_name_en);
    return aEn.localeCompare(bEn, "en", { sensitivity: "base" });
  });
};

export const filterAsanasByQuery = (list: any[], query: string) => {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return list ?? [];

  const searchTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  return (list ?? []).filter((asana) => {
    const krName = normalizeText(asana.sanskrit_name_kr);
    const enName = normalizeText(asana.sanskrit_name_en);

    const krMatch = searchTerms.every((term) => krName.includes(term));
    const enMatch = searchTerms.every((term) => enName.includes(term));

    return krMatch || enMatch;
  });
};

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

      // 한글 조합형/분해형 혼용을 대비해 NFC로 정규화한 후 비교
      const normalizedQuery = normalizeText(query);
      if (!normalizedQuery) {
        return [];
      }

      const searchTerms = normalizedQuery.split(/\s+/).filter(Boolean);
      return result.data.filter((asana) => {
        const krName = normalizeText(asana.sanskrit_name_kr);
        const enName = normalizeText(asana.sanskrit_name_en);

        const krMatch = searchTerms.every((term) => krName.includes(term));
        const enMatch = searchTerms.every((term) => enName.includes(term));

        return krMatch || enMatch;
      });
    },
    enabled: query.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
    retry: 2,
  });
};
