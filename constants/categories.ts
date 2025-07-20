import { AsanaCategory } from "../types/asana";

export const CATEGORIES: Record<
  AsanaCategory,
  { label: string; emoji: string; color: string }
> = {
  standing: {
    label: "서기 자세",
    emoji: "🧍",
    color: "#3B82F6",
  },
  sitting: {
    label: "앉기 자세",
    emoji: "🧘",
    color: "#8B5CF6",
  },
  lying: {
    label: "누워서 하는 자세",
    emoji: "🛌",
    color: "#06B6D4",
  },
  inverted: {
    label: "역전 자세",
    emoji: "🤸",
    color: "#EC4899",
  },
  twisting: {
    label: "비틀기 자세",
    emoji: "🔄",
    color: "#F59E0B",
  },
  balancing: {
    label: "균형 자세",
    emoji: "⚖️",
    color: "#10B981",
  },
  backbend: {
    label: "뒤로 굽히기",
    emoji: "🏹",
    color: "#EF4444",
  },
  forward_bend: {
    label: "앞으로 굽히기",
    emoji: "🙇",
    color: "#84CC16",
  },
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORIES).map(
  ([key, value]) => ({
    value: key as AsanaCategory,
    ...value,
  })
);
