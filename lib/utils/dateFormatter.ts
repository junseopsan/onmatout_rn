/**
 * 날짜 포맷팅 유틸리티 함수들
 */

/**
 * 날짜를 "MM월 DD일 (요일)" 형식으로 포맷 (간단한 형식)
 * @param dateString - 날짜 문자열 (ISO 형식 등)
 * @returns 포맷된 날짜 문자열
 */
export const formatDateSimple = (dateString: string): string => {
  if (!dateString) {
    return "날짜 없음";
  }

  const date = new Date(dateString);

  // Invalid Date 체크
  if (isNaN(date.getTime())) {
    return "날짜 없음";
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[date.getDay()];

  return `${month}월 ${day}일 (${weekday})`;
};

/**
 * 날짜를 "YYYY년 MM월 DD일 (요일)" 형식으로 포맷
 * @param dateString - 날짜 문자열 (ISO 형식 등)
 * @returns 포맷된 날짜 문자열
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) {
    return "날짜 없음";
  }

  const date = new Date(dateString);

  // Invalid Date 체크
  if (isNaN(date.getTime())) {
    return "날짜 없음";
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[date.getDay()];

  return `${year}년 ${month}월 ${day}일 (${weekday})`;
};

/**
 * 날짜를 "YYYY년 M월 D일" 형식으로 포맷 (편지 서명용, 요일 없음)
 */
export const formatDateLetter = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}.${month}.${day}`;
};

/**
 * 시간을 "HH:MM" 형식으로 포맷
 * @param dateString - 날짜/시간 문자열 (ISO 형식 등)
 * @returns 포맷된 시간 문자열
 */
export const formatTime = (dateString: string): string => {
  if (!dateString) {
    return "시간 없음";
  }

  const date = new Date(dateString);

  // Invalid Date 체크
  if (isNaN(date.getTime())) {
    return "시간 없음";
  }

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
};

/**
 * 상대 시간 포맷 (방금, 5분 전, 3시간 전, 2일 전 등)
 * @param dateString - 날짜/시간 문자열 (ISO 형식 등)
 * @returns 포맷된 상대 시간 문자열
 */
export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);
  const now = new Date();

  // Invalid Date 체크
  if (isNaN(date.getTime())) {
    return "";
  }

  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
};
