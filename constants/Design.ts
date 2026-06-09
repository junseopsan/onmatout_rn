// Floga 스타일 디자인 토큰
// 기존 COLORS 와 함께 사용 — 점진적 마이그레이션을 위해 분리

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 22,
  fab: 28,
  card: 24,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const TYPE = {
  hero: { size: 26, weight: "700" as const, letterSpacing: -0.3 },
  title: { size: 18, weight: "700" as const },
  body: { size: 15, weight: "500" as const },
  caption: { size: 13, weight: "500" as const },
  eyebrow: {
    size: 11,
    weight: "600" as const,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
} as const;

export const SHADOW = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  fab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;
