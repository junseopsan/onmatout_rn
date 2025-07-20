import { Asana } from "./asana";

export interface Record {
  id: string;
  user_id: string;
  asana_id: string;
  asana?: Asana;
  emotion: EmotionType;
  energy_level: EnergyLevel;
  focus_level: FocusLevel;
  memo?: string;
  practice_date: string;
  created_at: string;
  updated_at: string;
}

export type EmotionType =
  | "peaceful"
  | "energized"
  | "calm"
  | "focused"
  | "relaxed"
  | "stressed"
  | "tired"
  | "excited";

export type EnergyLevel = "very_low" | "low" | "medium" | "high" | "very_high";

export type FocusLevel = "very_low" | "low" | "medium" | "high" | "very_high";

export interface CreateRecordData {
  asana_id: string;
  emotion: EmotionType;
  energy_level: EnergyLevel;
  focus_level: FocusLevel;
  memo?: string;
  practice_date: string;
}

export interface RecordFilter {
  start_date?: string;
  end_date?: string;
  asana_id?: string;
  emotion?: EmotionType;
}

export interface RecordState {
  records: Record[];
  loading: boolean;
  error: string | null;
  filter: RecordFilter;
}
