/**
 * Linear + Notion 하이브리드 팔레트 (다크 베이스)
 *
 * 컨셉:
 *   - Background: 깊은 흑 (Linear 풍, 미세 그라데이션 가능)
 *   - Surface: 살짝 떠 있는 dark gray (border 와 명확 분리)
 *   - Primary: 보라 #8B5CF6 (sahasrara — 차크라 모티프, Linear 톤)
 *   - Secondary: 에메랄드 #10B981 (anahata — 따뜻한 액센트)
 *   - Text: 회색 톤 단계화 (textSecondary 도 너무 어둡지 않게)
 *   - Border: 따뜻한 회색 (차가운 회색 → #262626)
 */

export const COLORS = {
  // Brand — Linear 풍 보라
  primary: "#8B5CF6",        // sahasrara — main brand
  primaryLight: "#A78BFA",
  primaryDark: "#7C3AED",

  // Secondary — anahata 에메랄드 (따뜻한 액센트, 성공/완료에도 사용)
  secondary: "#10B981",
  secondaryLight: "#34D399",
  secondaryDark: "#059669",

  // Background — 깊은 흑
  background: "#0A0A0A",     // 본 배경
  backgroundDark: "#000000",

  // Surface — 미세하게 떠 있는 카드/입력 (border 와 분리)
  surface: "#171717",        // 카드/입력 배경
  surfaceDark: "#0F0F0F",    // 약간 더 어두운 surface (modal 등)

  // Text — 가독성 단계화
  text: "#FAFAFA",           // 본문 (#FFF 보다 살짝 덜 강함)
  textSecondary: "#A1A1AA",  // 부제목 / 메타
  textDark: "#FAFAFA",       // (light mode 대비용 alias)
  textSecondaryDark: "#A1A1AA",
  textMuted: "#71717A",      // 더 약한 hint / placeholder

  // Status
  success: "#10B981",
  warning: "#F59E0B",
  error: "#F87171",
  info: "#60A5FA",

  // Border — 차가운 회색 대신 한 단계 부드러운 톤
  border: "#262626",         // 기본 카드/구분선
  borderDark: "#171717",     // surface 와 동일
  borderStrong: "#3F3F46",   // 강조 구분선

  // Shadow / overlay
  shadow: "rgba(0, 0, 0, 0.5)",
  shadowDark: "rgba(0, 0, 0, 0.7)",
  overlay: "rgba(0, 0, 0, 0.6)",
  overlayDark: "rgba(0, 0, 0, 0.8)",

  // Util
  white: "#FFFFFF",          // 아사나 카드 일러스트 배경에 사용
  lightGray: "#3F3F46",
  transparent: "transparent",

  // Chakra 팔레트 (Notion 의 컬러 토큰 같은 의미적 사용 — 카테고리/감정 매핑)
  chakraCrown: "#8B5CF6",    // 보라
  chakraThirdEye: "#6366F1", // 남보라
  chakraThroat: "#0EA5E9",   // 푸른
  chakraHeart: "#10B981",    // 초록
  chakraSolar: "#FACC15",    // 노랑
  chakraSacral: "#FB923C",   // 주황
  chakraRoot: "#EF4444",     // 빨강
} as const;

export type ColorKey = keyof typeof COLORS;
