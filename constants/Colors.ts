/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const COLORS = {
  // Primary Colors - 빨간색 계열 유지
  primary: "#E53935", // 브랜드 포인트 컬러(빨강 등)
  primaryLight: "#FF6F60",
  primaryDark: "#B71C1C",

  // Secondary Colors
  secondary: "#10B981",
  secondaryLight: "#34D399",
  secondaryDark: "#059669",

  // Background Colors - 이미지처럼 어두운 테마
  background: "#1A1A1A", // 이미지의 어두운 배경색
  backgroundDark: "#000000",
  surface: "#2D2D2D", // 어두운 회색 표면
  surfaceDark: "#1F1F1F",

  // Text Colors - 밝은 텍스트 (어두운 배경에 맞춤)
  text: "#FFFFFF", // 흰색 텍스트
  textSecondary: "#B0B0B0", // 연한 회색
  textDark: "#FFFFFF",
  textSecondaryDark: "#B0B0B0",

  // Status Colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Border Colors - 어두운 테마에 맞는 테두리
  border: "#404040",
  borderDark: "#2D2D2D",

  // Shadow Colors - 어두운 테마에 맞는 그림자
  shadow: "rgba(0, 0, 0, 0.3)",
  shadowDark: "rgba(0, 0, 0, 0.5)",

  // Overlay Colors
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayDark: "rgba(0, 0, 0, 0.7)",

  // Additional Colors
  white: "#FFFFFF", // 아사나 카드 이미지용 흰색 배경 유지
  lightGray: "#404040",

  // Transparent
  transparent: "transparent",
} as const;

export type ColorKey = keyof typeof COLORS;
