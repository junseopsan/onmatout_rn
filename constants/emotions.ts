import { Emotion, EnergyLevelInfo } from "../types/record";

export const EMOTIONS: Emotion[] = [
  {
    id: "peaceful",
    label: "평온",
    emoji: "😊",
    color: "#4CAF50",
  },
  {
    id: "energized",
    label: "활기",
    emoji: "💪",
    color: "#FF9800",
  },
  {
    id: "calm",
    label: "차분",
    emoji: "🧘",
    color: "#2196F3",
  },
  {
    id: "focused",
    label: "집중",
    emoji: "🎯",
    color: "#9C27B0",
  },
  {
    id: "relaxed",
    label: "편안",
    emoji: "😌",
    color: "#00BCD4",
  },
  {
    id: "stressed",
    label: "스트레스",
    emoji: "😰",
    color: "#F44336",
  },
  {
    id: "tired",
    label: "피곤",
    emoji: "💤",
    color: "#607D8B",
  },
  {
    id: "excited",
    label: "신남",
    emoji: "🤩",
    color: "#E91E63",
  },
];

export const ENERGY_LEVELS: EnergyLevelInfo[] = [
  {
    id: "calm",
    label: "차분",
    emoji: "😌",
    color: "#3B82F6",
  },
  {
    id: "balanced",
    label: "균형",
    emoji: "⚖️",
    color: "#10B981",
  },
  {
    id: "light",
    label: "가벼움",
    emoji: "🪶",
    color: "#F59E0B",
  },
  {
    id: "full",
    label: "충만",
    emoji: "✨",
    color: "#EF4444",
  },
];
