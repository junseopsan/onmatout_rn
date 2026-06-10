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
