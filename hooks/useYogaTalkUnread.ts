import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { chatApi } from "../lib/api/chat";
import { yogaTalkApi } from "../lib/api/yogaTalk";
import { useYogaTalkBadgeStore } from "../stores/yogaTalkBadgeStore";
import { usePivotStudios } from "./usePivotStudios";
import { useRoles } from "./useRoles";
import { useStudentStudios } from "./useStudentStudios";

// 탭바 배지용 unread 카운트 — 1:1 스레드 + 방 합산.
// 방 안읽음은 "현재 보이는 요가원" 범위로 한정한다:
//   선생님 → 활성 요가원, 수련생 → 가입한 요가원들.
// 마운트 시 + 앱 포그라운드 + 30초 주기 + 읽음 신호(tick) 에 갱신.
export function useYogaTalkUnread() {
  const [unread, setUnread] = useState(0);
  const tick = useYogaTalkBadgeStore((s) => s.tick);
  const { isTeacher } = useRoles();
  const { activeStudio } = usePivotStudios();
  const { memberships } = useStudentStudios();

  const studioIds = isTeacher
    ? activeStudio
      ? [activeStudio.id]
      : []
    : memberships.map((m) => m.studio.id);
  const studioKey = studioIds.join(",");

  const refresh = useCallback(async () => {
    try {
      const ids = studioKey ? studioKey.split(",") : [];
      const [threads, rooms] = await Promise.all([
        yogaTalkApi.unreadCount().catch(() => 0),
        chatApi.unreadCount(ids).catch(() => 0),
      ]);
      setUnread(threads + rooms);
    } catch {
      // ignore
    }
  }, [studioKey]);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refresh();
    });
    const interval = setInterval(refresh, 30000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [refresh]);

  // 읽음 처리 등 전역 신호 발생 시 즉시 재조회
  useEffect(() => {
    if (tick > 0) refresh();
  }, [tick, refresh]);

  return { unread, refresh };
}
