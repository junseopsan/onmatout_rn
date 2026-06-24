// 공유/딥링크 URL 빌더 + 파서. (hilly_rn lib/links.ts 패턴 참조)
// 웹(onmatout.com)·앱이 동일 도메인 사용. App Links(onmatout.com/*) + iOS associatedDomains 로 앱 딥링크 연결.
//   - 시퀀스 공유 링크: https://onmatout.com/r/{routineId}  (앱 미설치 시 웹 폴백)
//   - 앱 설치 시 유니버설 링크/앱링크로 앱이 열리며 해당 시퀀스 상세로 이동.
export const WEB_BASE_URL = "https://onmatout.com";

export function buildRoutineShareUrl(routineId: string): string {
  return `${WEB_BASE_URL}/r/${routineId}`;
}

// /r/{uuid} (https://onmatout.com/r/.. 또는 onmatout://r/..), 또는 ?routine={uuid}
const ROUTINE_PATH_RE =
  /\/r\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export function parseRoutineIdFromUrl(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(ROUTINE_PATH_RE);
  if (m) return m[1].toLowerCase();
  const q = url.match(/[?&]routine=([0-9a-f-]{36})/i);
  return q ? q[1].toLowerCase() : null;
}
