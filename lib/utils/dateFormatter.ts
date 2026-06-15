/**
 * 날짜 포맷팅 유틸리티 함수들
 */

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
