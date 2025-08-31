/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const COLORS = {
  // Primary Colors
  primary: "#E53935", // 브랜드 포인트 컬러(빨강 등)
  primaryLight: "#FF6F60",
  primaryDark: "#B71C1C",

  // Secondary Colors
  secondary: "#10B981",
  secondaryLight: "#34D399",
  secondaryDark: "#059669",

  // Background Colors
  background: "#1A1A1A", // 더 어두운 배경색으로 변경
  backgroundDark: "#0A0A0A",
  surface: "#333333",
  surfaceDark: "#3A3A3A",

  // Text Colors
  text: "#F9FAFB",
  textSecondary: "#B0B0B0",
  textDark: "#F9FAFB",
  textSecondaryDark: "#D1D5DB",

  // Status Colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Border Colors
  border: "#222222",
  borderDark: "#333333",

  // Shadow Colors
  shadow: "rgba(0, 0, 0, 0.1)",
  shadowDark: "rgba(0, 0, 0, 0.3)",

  // Overlay Colors
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayDark: "rgba(0, 0, 0, 0.7)",

  // Additional Colors
  white: "#FFFFFF",
  lightGray: "#F5F5F5",

  // Transparent
  transparent: "transparent",
} as const;

export type ColorKey = keyof typeof COLORS;
