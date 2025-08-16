import { Asana } from "./asana";

export interface Record {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD 형식
  asanas: string[]; // 선택된 아사나 ID 배열
  memo: string; // 경험 메모 (최대 500자)
  emotions: string[]; // 선택된 감정 배열
  energy_level: string; // 에너지 레벨
  photos: string[]; // 사진 URL 배열 (최대 3장)
  created_at: string;
  updated_at: string;
}

export interface RecordFormData {
  asanas: string[];
  memo: string;
  emotions: string[];
  energy_level: string;
  photos: string[];
}

export interface Emotion {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export interface EnergyLevel {
  id: string;
  label: string;
  emoji: string;
  color: string;
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
