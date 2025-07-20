/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const COLORS = {
  // Primary Colors
  primary: "#6366F1",
  primaryLight: "#818CF8",
  primaryDark: "#4F46E5",

  // Secondary Colors
  secondary: "#10B981",
  secondaryLight: "#34D399",
  secondaryDark: "#059669",

  // Background Colors
  background: "#FFFFFF",
  backgroundDark: "#1F2937",
  surface: "#F9FAFB",
  surfaceDark: "#374151",

  // Text Colors
  text: "#111827",
  textSecondary: "#6B7280",
  textDark: "#F9FAFB",
  textSecondaryDark: "#D1D5DB",

  // Status Colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Border Colors
  border: "#E5E7EB",
  borderDark: "#4B5563",

  // Shadow Colors
  shadow: "rgba(0, 0, 0, 0.1)",
  shadowDark: "rgba(0, 0, 0, 0.3)",

  // Overlay Colors
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayDark: "rgba(0, 0, 0, 0.7)",

  // Transparent
  transparent: "transparent",
} as const;

export type ColorKey = keyof typeof COLORS;
