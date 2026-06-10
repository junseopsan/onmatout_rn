// 사용기한(일)을 "3개월(90일)", "1년(365일)" 형식으로 표기.
// 30의 배수면 N개월, 365의 배수면 N년, 그 외는 일 단위로만.
export function formatValidDays(days: number): string {
  if (days <= 0) return `${days}일`;
  if (days % 365 === 0) return `${days / 365}년(${days}일)`;
  if (days % 30 === 0) return `${days / 30}개월(${days}일)`;
  return `${days}일`;
}

// 한국 전화번호 표기 포맷 (010-1234-5678, 02-123-4567 등)
export function formatPhone(raw: string): string {
  const d = raw.replace(/[^\d]/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) {
    if (d.startsWith("02")) return `02-${d.slice(2, 6)}-${d.slice(6)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (d.length === 9 && d.startsWith("02"))
    return `02-${d.slice(2, 5)}-${d.slice(5)}`;
  return raw;
}
