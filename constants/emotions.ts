import { Emotion, EnergyLevel } from "../types/record";

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

export const ENERGY_LEVELS: EnergyLevel[] = [
  {
    id: "very_low",
    label: "매우 낮음",
    emoji: "😴",
    color: "#9E9E9E",
  },
  {
    id: "low",
    label: "낮음",
    emoji: "😐",
    color: "#FF9800",
  },
  {
    id: "medium",
    label: "보통",
    emoji: "😊",
    color: "#4CAF50",
  },
  {
    id: "high",
    label: "높음",
    emoji: "😃",
    color: "#2196F3",
  },
  {
    id: "very_high",
    label: "매우 높음",
    emoji: "🤩",
    color: "#E91E63",
  },
];
