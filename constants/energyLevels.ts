import { EnergyLevel } from "../types/record";

export const ENERGY_LEVELS: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  calm: {
    label: "차분",
    emoji: "😌",
    color: "#3B82F6",
  },
  balanced: {
    label: "균형",
    emoji: "⚖️",
    color: "#10B981",
  },
  light: {
    label: "가벼움",
    emoji: "🪶",
    color: "#F59E0B",
  },
  full: {
    label: "충만",
    emoji: "✨",
    color: "#EF4444",
  },
};

export const ENERGY_LEVEL_OPTIONS = Object.entries(ENERGY_LEVELS).map(
  ([key, value]) => ({
    value: key as unknown as EnergyLevel,
    label: value.label,
    emoji: value.emoji,
    color: value.color,
  })
);
