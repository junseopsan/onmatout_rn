import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { studentApi } from "../lib/api/student";
import { useAuth } from "./useAuth";
import { useRoles } from "./useRoles";

// 로그인 직후 1회: phone 매칭 후보가 있고, 본인이 아직 어느 student_profile 에도 연결되지 않았으면
// onMatch 콜백 (보통 navigation.navigate("AuthMatch")) 호출.
export function useStudentMatchCheck(onMatch: () => void) {
  const { user } = useAuth();
  const { activeRole, loaded } = useRoles();
  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!loaded) return;
    if (!user?.id || !user?.phone) return;
    if (activeRole !== "student") return;
    if (checkedRef.current === user.id) return;
    checkedRef.current = user.id;

    (async () => {
      try {
        const { data: linked } = await supabase
          .from("student_profiles")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);
        if (linked && linked.length > 0) return;

        const candidates = await studentApi.findMatchByPhone(user.phone!);
        if (candidates.length > 0) onMatch();
      } catch (e) {
        console.warn("[StudentMatchCheck] failed", e);
      }
    })();
  }, [user?.id, user?.phone, activeRole, loaded, onMatch]);
}
