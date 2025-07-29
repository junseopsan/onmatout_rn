import { AsanaCategory } from "../types/asana";

export const CATEGORIES: Record<
  AsanaCategory,
  { label: string; emoji: string; color: string }
> = {
  Rest: {
    label: "휴식",
    emoji: "😌",
    color: "#6B7280",
  },
  ForwardBend: {
    label: "전굴",
    emoji: "🙇",
    color: "#84CC16",
  },
  BackBend: {
    label: "후굴",
    emoji: "🏹",
    color: "#EF4444",
  },
  Twist: {
    label: "비틀기",
    emoji: "🔄",
    color: "#F59E0B",
  },
  Standing: {
    label: "스탠딩",
    emoji: "🧍",
    color: "#3B82F6",
  },
  Inversion: {
    label: "도립",
    emoji: "🤸",
    color: "#EC4899",
  },
  Core: {
    label: "코어",
    emoji: "💪",
    color: "#10B981",
  },
  SideBend: {
    label: "측굴",
    emoji: "↔️",
    color: "#8B5CF6",
  },
  Basic: {
    label: "기본",
    emoji: "⭐",
    color: "#06B6D4",
  },
  Armbalance: {
    label: "암밸런스",
    emoji: "🤸‍♂️",
    color: "#F97316",
  },
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORIES).map(
  ([key, value]) => ({
    value: key as AsanaCategory,
    ...value,
  })
);
