import * as Updates from "expo-updates";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

// OTA(EAS Update) 적용 안내.
//  - 앱 실행 시 expo-updates 가 ON_LOAD 로 받아둔 업데이트(isUpdatePending) 감지
//  - 실행 중(포그라운드 복귀)에는 직접 check/fetch 해서 받은 뒤 감지
//  → pending=true 가 되면 상위에서 "지금 다시 시작" 다이얼로그를 띄운다.
//    동의 시 reloadAsync() 로 즉시 적용(검은 화면 없이 스플래시 후 새 번들).
export function useOtaUpdate() {
  const { isUpdatePending } = Updates.useUpdates();
  const [dismissed, setDismissed] = useState(false);
  const busy = useRef(false);

  const check = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled || busy.current) return;
    busy.current = true;
    try {
      const res = await Updates.checkForUpdateAsync();
      if (res.isAvailable) {
        await Updates.fetchUpdateAsync(); // 완료되면 isUpdatePending=true
      }
    } catch {
      // 체크/다운로드 실패는 조용히 무시
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") check();
    });
    return () => sub.remove();
  }, [check]);

  const restart = useCallback(async () => {
    try {
      await Updates.reloadAsync();
    } catch {
      // ignore
    }
  }, []);

  return {
    pending: isUpdatePending && !dismissed,
    restart,
    dismiss: () => setDismissed(true),
  };
}
