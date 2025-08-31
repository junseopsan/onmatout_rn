import { User } from "./auth";

export interface UpdateUserProfileRequest {
  name?: string;
  email?: string;
  avatar_url?: string;
  push_notifications?: boolean;
  email_notifications?: boolean;
  practice_reminders?: boolean;
  theme?: "light" | "dark" | "auto";
  language?: "ko" | "en";
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
  email?: string;
  avatar_url?: string;
  push_notifications: boolean;
  email_notifications: boolean;
  practice_reminders: boolean;
  theme: "light" | "dark" | "auto";
  language: "ko" | "en";
  created_at: string;
  updated_at: string;
}

// UpdateUserProfileRequest는 위에서 이미 정의됨

export interface UserState {
  user: User | null;
  profile: UserProfile | null;
  statistics: UserStatistics | null;
  loading: boolean;
  error: string | null;
}
