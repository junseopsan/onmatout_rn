import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  pivotStudioApi,
  type PivotStudio,
  type PivotStudioInput,
} from "../lib/api/pivotStudio";

const ACTIVE_STUDIO_KEY = "@onmatout/active_studio";

interface StudioState {
  studios: PivotStudio[];
  activeStudio: PivotStudio | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

interface StudioStore extends StudioState {
  loadStudios: (ownerId: string) => Promise<void>;
  setActiveStudio: (studio: PivotStudio) => Promise<void>;
  createStudio: (input: { ownerId: string } & PivotStudioInput) => Promise<PivotStudio | null>;
  updateStudioLocal: (s: PivotStudio) => void;
  reset: () => void;
}

const initialState: StudioState = {
  studios: [],
  activeStudio: null,
  loading: false,
  loaded: false,
  error: null,
};

export const useStudioStore = create<StudioStore>((set, get) => ({
  ...initialState,

  loadStudios: async (ownerId: string) => {
    set({ loading: true, error: null });
    try {
      const studios = await pivotStudioApi.listMyStudios(ownerId);

      const persisted = await AsyncStorage.getItem(ACTIVE_STUDIO_KEY);
      let active: PivotStudio | null = null;
      if (persisted) {
        active = studios.find((s) => s.id === persisted) ?? null;
      }
      if (!active && studios.length > 0) {
        active = studios[0];
        await AsyncStorage.setItem(ACTIVE_STUDIO_KEY, active.id);
      }

      set({ studios, activeStudio: active, loading: false, loaded: true });
    } catch (e: any) {
      set({
        error: e?.message ?? "요가원 정보를 불러오지 못했어요",
        loading: false,
        loaded: true,
      });
    }
  },

  setActiveStudio: async (studio: PivotStudio) => {
    await AsyncStorage.setItem(ACTIVE_STUDIO_KEY, studio.id);
    set({ activeStudio: studio });
  },

  createStudio: async (input) => {
    try {
      const created = await pivotStudioApi.createStudio(input);
      const next = [...get().studios, created];
      set({ studios: next });
      // If it's the first, auto-activate
      if (!get().activeStudio) {
        await AsyncStorage.setItem(ACTIVE_STUDIO_KEY, created.id);
        set({ activeStudio: created });
      }
      return created;
    } catch (e: any) {
      set({ error: e?.message ?? "요가원을 만들지 못했어요" });
      return null;
    }
  },

  updateStudioLocal: (s: PivotStudio) => {
    const next = get().studios.map((x) => (x.id === s.id ? s : x));
    set({
      studios: next,
      activeStudio:
        get().activeStudio?.id === s.id ? s : get().activeStudio,
    });
  },

  reset: () => {
    AsyncStorage.removeItem(ACTIVE_STUDIO_KEY).catch(() => {});
    set(initialState);
  },
}));
