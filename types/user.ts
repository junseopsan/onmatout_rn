import { User } from "./auth";

export interface UserSettings {
  id: string;
  user_id: string;
  theme: "light" | "dark" | "auto";
  notifications: boolean;
  language: "ko" | "en";
  created_at: string;
  updated_at: string;
}

export interface UserStatistics {
  total_practices: number;
  consecutive_days: number;
  favorite_asana: string;
  total_practice_time: number;
  weekly_stats: WeeklyStats[];
  monthly_stats: MonthlyStats[];
}

export interface WeeklyStats {
  week_start: string;
  practices_count: number;
  total_time: number;
}

export interface MonthlyStats {
  month: string;
  practices_count: number;
  total_time: number;
  average_emotion: string;
  average_energy: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserProfileRequest {
  name: string;
}

export interface UserState {
  user: User | null;
  profile: UserProfile | null;
  settings: UserSettings | null;
  statistics: UserStatistics | null;
  loading: boolean;
  error: string | null;
}
