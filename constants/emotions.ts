import { EmotionType } from "../types/record";

export const EMOTIONS: Record<
  EmotionType,
  { label: string; emoji: string; color: string }
> = {
  peaceful: {
    label: "평온한",
    emoji: "😌",
    color: "#4ADE80",
  },
  energized: {
    label: "활기찬",
    emoji: "⚡",
    color: "#FBBF24",
  },
  calm: {
    label: "차분한",
    emoji: "🧘",
    color: "#60A5FA",
  },
  focused: {
    label: "집중된",
    emoji: "🎯",
    color: "#A78BFA",
  },
  relaxed: {
    label: "편안한",
    emoji: "😊",
    color: "#34D399",
  },
  stressed: {
    label: "스트레스",
    emoji: "😰",
    color: "#F87171",
  },
  tired: {
    label: "피곤한",
    emoji: "😴",
    color: "#9CA3AF",
  },
  excited: {
    label: "신나는",
    emoji: "🎉",
    color: "#FB7185",
  },
};

export const EMOTION_OPTIONS = Object.entries(EMOTIONS).map(([key, value]) => ({
  value: key as EmotionType,
  ...value,
}));
