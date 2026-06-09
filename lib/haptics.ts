import * as Haptics from "expo-haptics";

// 일관된 햅틱 사용 — 무거운 action 위주로
export const haptics = {
  // 가벼운 tap (탭 전환, 칩 토글, 책갈피)
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined),
  // 보통 tap (저장, 신청, 추가)
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined),
  // 무거운 tap (삭제, 종료 같은 destructive)
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined),
  // 성공 (저장 완료, 출석 완료)
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined),
  // 경고 / 에러
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined),
  // 선택 변경 (스튜디오 전환, 탭 변경)
  select: () => Haptics.selectionAsync().catch(() => undefined),
};
