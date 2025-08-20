export interface Asana {
  id: string;
  sanskrit_name_kr: string;
  sanskrit_name_en: string;
  level: string;
  effect: string;
  created_at: string;
  updated_at: string;
  category_name_en: string;
  image_number: string;
  asana_meaning: string;
}

export type AsanaCategory =
  | "Rest"
  | "ForwardBend"
  | "BackBend"
  | "Twist"
  | "Standing"
  | "Inversion"
  | "Core"
  | "SideBend"
  | "Basic"
  | "Armbalance";

export type AsanaDifficulty = "beginner" | "intermediate" | "advanced";

export interface AsanaFilter {
  category?: AsanaCategory;
  difficulty?: AsanaDifficulty;
  search?: string;
  favorites?: boolean;
}

export interface AsanaState {
  asanas: Asana[];
  favorites: string[];
  loading: boolean;
  error: string | null;
  filter: AsanaFilter;
}
