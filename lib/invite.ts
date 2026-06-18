// 초대 딥링크에서 코드 추출 (유니버설 링크 / 커스텀 스킴 공용)
//  - 유니버설 링크: https://onmatout.com/a/OMS-XXXX
//  - 커스텀 스킴(레거시): onmatout://invite?code=OMS-XXXX
export function extractInviteCode(url: string | null): string | null {
  if (!url) return null;
  let raw: string | null = null;
  // 1) https 도메인 경로 형식: onmatout.com/a/CODE
  const pathM = url.match(/onmatout\.com\/a\/([^/?#\s]+)/i);
  if (pathM) raw = pathM[1];
  // 2) 쿼리 형식: ...?code=CODE (커스텀 스킴 등)
  if (!raw) {
    const qM = url.match(/[?&]code=([^&\s]+)/i);
    if (qM) raw = qM[1];
  }
  if (!raw) return null;
  return decodeURIComponent(raw).toUpperCase();
}
