import { create } from "zustand";
import { Asana, asanasAPI } from "../lib/api/asanas";
import { AsanaCategory } from "../types/asana";

interface AsanaState {
  // 데이터 상태
  asanas: Asana[];
  filteredAsanas: Asana[];

  // 로딩 상태
  isLoading: boolean;
  isLoadingMore: boolean;

  // 페이지네이션 상태
  currentPage: number;
  hasMore: boolean;

  // 필터 상태
  selectedCategories: AsanaCategory[];

  // 에러 상태
  error: string | null;

  // 액션들
  setSelectedCategories: (categories: AsanaCategory[]) => void;
  loadAsanas: (reset?: boolean) => Promise<void>;
  loadMoreAsanas: () => Promise<void>;
  clearError: () => void;
  clearAsanas: () => void;
  removeDuplicates: (asanas: any[]) => any[];
}

export const useAsanaStore = create<AsanaState>((set, get) => ({
  // 초기 상태
  asanas: [],
  filteredAsanas: [],
  isLoading: false,
  isLoadingMore: false,
  currentPage: 1,
  hasMore: true,
  selectedCategories: [],
  error: null,

  // 카테고리 설정
  setSelectedCategories: (categories: AsanaCategory[]) => {
    console.log(`카테고리 변경:`, categories);

    const { asanas } = get();

    // 카테고리가 변경되면 페이지네이션 상태 리셋
    set({
      selectedCategories: categories,
      currentPage: 1,
      hasMore: true,
    });

    // 기존 데이터에서 즉시 필터링 (깜빡거림 방지)
    if (categories.length === 0) {
      // 모든 필터 취소 시 전체 조회 (랜덤 셔플)
      const shuffledAsanas = get().shuffleArray(asanas);
      set({ filteredAsanas: shuffledAsanas });

      // 전체 데이터가 부족하면 추가 로드
      if (asanas.length < 50) {
        console.log("전체 조회 데이터 부족, 추가 데이터 로드 시작");
        setTimeout(() => {
          get().loadAsanas(true);
        }, 100);
      }
    } else {
      console.log("필터링 시작:", categories);

      const filtered = asanas.filter((asana) => {
        // category_name_en이 문자열이므로 정확한 비교
        return (
          asana.category_name_en &&
          categories.includes(asana.category_name_en as AsanaCategory)
        );
      });

      // 중복 제거 후 필터링 및 랜덤 셔플
      const uniqueFiltered = get().removeDuplicates(filtered);
      const shuffledFiltered = get().shuffleArray(uniqueFiltered);
      console.log("필터링 결과:", shuffledFiltered.length, "개");
      set({ filteredAsanas: shuffledFiltered });

      // 선택된 카테고리의 데이터가 부족하면 추가 데이터 로드
      if (uniqueFiltered.length < 10 && asanas.length > 0) {
        console.log("선택된 카테고리 데이터 부족, 추가 데이터 로드 시작");
        setTimeout(() => {
          get().loadAsanas(true);
        }, 100);
      }
    }
  },

  // 중복 제거 헬퍼 함수
  removeDuplicates: (asanas: any[]) => {
    const seen = new Set();
    return asanas.filter((asana) => {
      const duplicate = seen.has(asana.id);
      seen.add(asana.id);
      return !duplicate;
    });
  },

  // 배열 셔플 헬퍼 함수
  shuffleArray: (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // 아사나 로드
  loadAsanas: async (reset: boolean = false) => {
    const { selectedCategories, currentPage, asanas } = get();

    try {
      if (reset) {
        set({ isLoading: true, error: null, currentPage: 1 });
      } else {
        set({ isLoadingMore: true });
      }

      const page = reset ? 1 : currentPage + 1;
      const categories =
        selectedCategories.length > 0 ? selectedCategories : undefined;

      console.log(
        `스토어에서 아사나 로드: 페이지 ${page}, 카테고리:`,
        categories
      );

      // 전체 조회 또는 선택된 카테고리가 있으면 더 많은 데이터를 로드
      const limit = categories && categories.length > 0 ? 50 : 50;

      const result = await asanasAPI.getAsanasWithPagination(
        page,
        limit,
        categories
      );

      if (result.success && result.data) {
        // 중복 제거
        const uniqueData = get().removeDuplicates(result.data);

        if (reset) {
          // 초기 로드: 데이터 교체 및 랜덤 셔플
          const shuffledData = get().shuffleArray(uniqueData);
          set({
            asanas: shuffledData,
            filteredAsanas: shuffledData, // API에서 이미 필터링된 데이터
            currentPage: page,
            hasMore: result.hasMore || false,
            isLoading: false,
          });
        } else {
          // 추가 로드: 기존 데이터에 추가
          const newAsanas = get().removeDuplicates([...asanas, ...uniqueData]);
          // 필터링된 데이터는 API에서 이미 처리된 데이터만 사용
          const newFilteredAsanas = get().removeDuplicates([
            ...get().filteredAsanas,
            ...uniqueData,
          ]);
          set({
            asanas: newAsanas,
            filteredAsanas: newFilteredAsanas,
            currentPage: page,
            hasMore: result.hasMore || false,
            isLoadingMore: false,
          });
        }

        console.log(
          `스토어 아사나 로드 완료: ${uniqueData.length}개 (중복 제거됨), 더 있음: ${result.hasMore}`
        );
      } else {
        // 에러 발생 시 로딩 상태 해제
        set({
          error: result.message || "아사나 데이터를 불러오는데 실패했습니다.",
          isLoading: false,
          isLoadingMore: false,
        });
        console.error("아사나 데이터 로드 실패:", result.message);
      }
    } catch (error) {
      console.error("아사나 데이터 로드 예외:", error);
      set({
        error: "아사나 데이터를 불러오는 중 오류가 발생했습니다.",
        isLoading: false,
        isLoadingMore: false,
      });
    }
  },

  // 추가 아사나 로드
  loadMoreAsanas: async () => {
    const { isLoadingMore, hasMore } = get();
    if (!isLoadingMore && hasMore) {
      await get().loadAsanas(false);
    }
  },

  // 에러 클리어
  clearError: () => {
    set({ error: null });
  },

  // 아사나 데이터 클리어
  clearAsanas: () => {
    set({
      asanas: [],
      filteredAsanas: [],
      currentPage: 1,
      hasMore: true,
      selectedCategories: [],
      error: null,
    });
  },
}));
