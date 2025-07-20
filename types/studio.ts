export interface Studio {
  id: string;
  name: string;
  address: string;
  phone: string;
  website?: string;
  instagram?: string;
  operating_hours: OperatingHours[];
  description?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface OperatingHours {
  day: DayOfWeek;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface StudioFilter {
  search?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

export interface StudioState {
  studios: Studio[];
  loading: boolean;
  error: string | null;
  filter: StudioFilter;
}
