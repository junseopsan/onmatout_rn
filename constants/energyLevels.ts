import { EnergyLevel } from "../types/record";

export const ENERGY_LEVELS: Record<
  EnergyLevel,
  { label: string; emoji: string; color: string }
> = {
  very_low: {
    label: "매우 낮음",
    emoji: "🔋",
    color: "#EF4444",
  },
  low: {
    label: "낮음",
    emoji: "🔋",
    color: "#F97316",
  },
  medium: {
    label: "보통",
    emoji: "🔋",
    color: "#EAB308",
  },
  high: {
    label: "높음",
    emoji: "🔋",
    color: "#22C55E",
  },
  very_high: {
    label: "매우 높음",
    emoji: "🔋",
    color: "#10B981",
  },
};

export const ENERGY_LEVEL_OPTIONS = Object.entries(ENERGY_LEVELS).map(
  ([key, value]) => ({
    value: key as EnergyLevel,
    ...value,
  })
);
