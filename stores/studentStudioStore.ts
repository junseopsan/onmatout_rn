import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  studentBookingApi,
  type StudentStudioMembership,
} from "../lib/api/studentBooking";

const ACTIVE_KEY = "@onmatout/student_active_studio_profile";

interface State {
  memberships: StudentStudioMembership[];
  activeProfileId: string | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

interface Store extends State {
  loadMemberships: (userId: string) => Promise<void>;
  setActiveProfile: (profileId: string) => Promise<void>;
  reset: () => void;
}

const initial: State = {
  memberships: [],
  activeProfileId: null,
  loading: false,
  loaded: false,
  error: null,
};

export const useStudentStudioStore = create<Store>((set, get) => ({
  ...initial,

  loadMemberships: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const memberships = await studentBookingApi.listMyMemberships(userId);
      const persisted = await AsyncStorage.getItem(ACTIVE_KEY);
      let active: string | null = null;
      if (persisted && memberships.some((m) => m.studentProfileId === persisted)) {
        active = persisted;
      } else if (memberships.length > 0) {
        active = memberships[0].studentProfileId;
        await AsyncStorage.setItem(ACTIVE_KEY, active);
      }
      set({
        memberships,
        activeProfileId: active,
        loading: false,
        loaded: true,
      });
    } catch (e: any) {
      set({
        error: e?.message ?? "요가원 정보를 불러오지 못했어요",
        loading: false,
        loaded: true,
      });
    }
  },

  setActiveProfile: async (profileId: string) => {
    if (!get().memberships.some((m) => m.studentProfileId === profileId)) return;
    await AsyncStorage.setItem(ACTIVE_KEY, profileId);
    set({ activeProfileId: profileId });
  },

  reset: () => {
    AsyncStorage.removeItem(ACTIVE_KEY).catch(() => {});
    set(initial);
  },
}));
