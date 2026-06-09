import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { UserRole } from "../types/role";

const ACTIVE_ROLE_KEY = "@onmatout/active_role";

interface RoleState {
  roles: UserRole[];
  activeRole: UserRole | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

interface RoleStore extends RoleState {
  loadRoles: (userId: string) => Promise<void>;
  addRole: (userId: string, role: UserRole) => Promise<boolean>;
  setActiveRole: (role: UserRole) => Promise<void>;
  reset: () => void;
}

const initialState: RoleState = {
  roles: [],
  activeRole: null,
  loading: false,
  loaded: false,
  error: null,
};

export const useRoleStore = create<RoleStore>((set, get) => ({
  ...initialState,

  loadRoles: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;

      const roles = (data ?? []).map((r) => r.role as UserRole);
      const persistedActive = (await AsyncStorage.getItem(
        ACTIVE_ROLE_KEY
      )) as UserRole | null;

      let activeRole: UserRole | null = null;
      if (persistedActive && roles.includes(persistedActive)) {
        activeRole = persistedActive;
      } else if (roles.length > 0) {
        activeRole = roles.includes("teacher") ? "teacher" : roles[0];
        await AsyncStorage.setItem(ACTIVE_ROLE_KEY, activeRole);
      }

      set({ roles, activeRole, loading: false, loaded: true });
    } catch (e: any) {
      set({
        error: e.message ?? "역할 정보를 불러오지 못했어요",
        loading: false,
        loaded: true,
      });
    }
  },

  addRole: async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
      if (error) throw error;

      const current = get().roles;
      const next = current.includes(role) ? current : [...current, role];
      set({ roles: next });

      if (!get().activeRole) {
        await AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
        set({ activeRole: role });
      }
      return true;
    } catch (e: any) {
      set({ error: e.message ?? "역할을 추가하지 못했어요" });
      return false;
    }
  },

  setActiveRole: async (role: UserRole) => {
    if (!get().roles.includes(role)) return;
    await AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
    set({ activeRole: role });
  },

  reset: () => {
    AsyncStorage.removeItem(ACTIVE_ROLE_KEY).catch(() => {});
    set(initialState);
  },
}));
