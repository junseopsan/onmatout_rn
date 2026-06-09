import { Platform } from "react-native";

/**
 * Linear + Notion 하이브리드 타이포그래피
 *
 * - sans: 시스템 default (iOS San Francisco / Android Roboto) — 본문/UI 전용
 * - serif: iOS Georgia / Android serif fallback — Notion 스타일 헤더 한정
 *
 * 향후 @expo-google-fonts/inter + newsreader 도입 시 sans/serif fontFamily 만 교체.
 */

// Noto Sans KR (sans, 한글+영문) + Noto Serif KR (serif, 한글+영문) — _layout.tsx 에서 useFonts 로 로드
// Newsreader Italic 은 영문 액센트(인용/이탤릭) 전용으로만 남겨둠
export const FONT = {
  sans: "NotoSansKR_500Medium",
  sansRegular: "NotoSansKR_400Regular",
  sansSemiBold: "NotoSansKR_600SemiBold",
  sansBold: "NotoSansKR_700Bold",
  serif: "NotoSerifKR_500Medium",
  serifRegular: "NotoSerifKR_500Medium",
  serifItalic: "Newsreader_400Regular_Italic",
  serifSemiBold: "NotoSerifKR_600SemiBold",
  mono: "SpaceMono",
} as const;

// 시스템 폰트 fallback (Platform 분기 필요한 경우 사용)
export const SYSTEM_FONT = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "System",
});

// 본문/UI/헤더 스타일 — fontWeight 대신 폰트 패밀리로 두께 구분 (Android Inter 가독성)
export const TEXT = {
  // 본문 UI
  body: { fontFamily: FONT.sansRegular, fontSize: 15, lineHeight: 22 },
  bodyMed: { fontFamily: FONT.sans, fontSize: 15, lineHeight: 22 },
  bodyLg: { fontFamily: FONT.sans, fontSize: 17, lineHeight: 24 },
  caption: { fontFamily: FONT.sansRegular, fontSize: 13, lineHeight: 18 },
  captionMed: { fontFamily: FONT.sans, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: FONT.sans, fontSize: 11, lineHeight: 14 },
  eyebrow: {
    fontFamily: FONT.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
  },

  // Sans 헤더 (페이지 헤더 / 섹션 / UI 강조)
  uiTitle: {
    fontFamily: FONT.sansBold,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  uiHero: {
    fontFamily: FONT.sansBold,
    fontSize: 28,
    letterSpacing: -0.5,
  },

  // Serif 헤더 (Notion 영감 — 루틴 / 회원 / 클래스 / 요가원 이름)
  serifTitle: {
    fontFamily: FONT.serifSemiBold,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  serifHero: {
    fontFamily: FONT.serifSemiBold,
    fontSize: 32,
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  serifItalic: {
    fontFamily: FONT.serifItalic,
    fontSize: 17,
  },
} as const;
