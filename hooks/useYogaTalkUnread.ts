import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { chatApi } from "../lib/api/chat";
import { yogaTalkApi } from "../lib/api/yogaTalk";
import { useYogaTalkBadgeStore } from "../stores/yogaTalkBadgeStore";

// 탭바 배지용 unread 카운트 — 1:1 스레드 + 그룹/요가원 방 합산
// 마운트 시 + 앱 포그라운드 + 30초 주기 폴링
export function useYogaTalkUnread() {
  const [unread, setUnread] = useState(0);
  const tick = useYogaTalkBadgeStore((s) => s.tick);

  const refresh = useCallback(async () => {
    try {
      const [threads, rooms] = await Promise.all([
        yogaTalkApi.unreadCount().catch(() => 0),
        chatApi.unreadCount().catch(() => 0),
      ]);
      setUnread(threads + rooms);
    } catch {
      // ignore
    }
  }, []);

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
