export interface Asana {
  id: string;
  name_kr: string;
  name_sanskrit: string;
  name_en: string;
  description: string;
  benefits: string[];
  category: AsanaCategory;
  difficulty: AsanaDifficulty;
  meaning: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export type AsanaCategory =
  | "standing"
  | "sitting"
  | "lying"
  | "inverted"
  | "twisting"
  | "balancing"
  | "backbend"
  | "forward_bend";

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
