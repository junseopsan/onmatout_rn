import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { yogaTalkApi } from "../lib/api/yogaTalk";

// 탭바 배지용 unread 카운트 — 마운트 시 + 앱 포그라운드 + 30초 주기 폴링
export function useYogaTalkUnread() {
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const n = await yogaTalkApi.unreadCount();
      setUnread(n);
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

  return { unread, refresh };
}
