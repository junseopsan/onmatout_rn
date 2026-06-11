import { create } from "zustand";

// 요가톡 탭 배지 즉시 갱신용 전역 신호.
// 방/대화 읽음 처리 후 notifyYogaTalkRead() 를 호출하면
// useYogaTalkUnread 가 폴링 주기를 기다리지 않고 바로 재조회한다.
type YogaTalkBadgeState = {
  tick: number;
  bump: () => void;
};

export const useYogaTalkBadgeStore = create<YogaTalkBadgeState>((set) => ({
  tick: 0,
  bump: () => set((s) => ({ tick: s.tick + 1 })),
}));

export const notifyYogaTalkRead = () =>
  useYogaTalkBadgeStore.getState().bump();
