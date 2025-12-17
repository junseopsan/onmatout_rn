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

// 카테고리 표시 순서 (아사나 탭, 검색 모달 등에서 공통 사용)
export const CATEGORY_ORDER: AsanaCategory[] = [
  "Basic",
  "BackBend",
  "ForwardBend",
  "Twist",
  "Inversion",
  "SideBend",
  "Standing",
  "Armbalance",
  "Core",
  "Rest",
];

export const CATEGORY_OPTIONS = CATEGORY_ORDER.map((key) => ({
  value: key,
  ...CATEGORIES[key],
}));
