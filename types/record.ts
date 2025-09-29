export interface Record {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD 형식
  practice_date?: string; // YYYY-MM-DD 형식 (새 스키마)
  practice_time?: string; // 수련 시간 (새 스키마)
  title: string; // 기록 제목
  asanas: string[]; // 선택된 아사나 ID 배열
  memo: string; // 경험 메모 (최대 500자)
  states: string[]; // 선택된 상태 배열
  photos: string[]; // 사진 URL 배열 (최대 3장)
  created_at: string;
  updated_at: string;
}

export interface RecordFormData {
  title: string; // 기록 제목
  asanas: string[];
  memo: string;
  states: string[];
  photos: string[];
  date?: string; // 선택적 날짜 필드 (기본값: 오늘)
}

export interface State {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export interface Emotion {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export interface EnergyLevelInfo {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export interface RecordFilter {
  start_date?: string;
  end_date?: string;
  asana_id?: string;
  states?: string[];
}

export interface RecordState {
  records: Record[];
  loading: boolean;
  error: string | null;
  filter: RecordFilter;
}
