import { supabase } from "../supabase";

export type RoutineComment = {
  id: string;
  routine_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  author_name: string;
};

export const routineCommentsApi = {
  async list(routineId: string): Promise<RoutineComment[]> {
    const { data, error } = await supabase
      .from("routine_comments")
      .select("id, routine_id, user_id, content, parent_id, created_at")
      .eq("routine_id", routineId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as Omit<RoutineComment, "author_name">[];
    const ids = Array.from(new Set(rows.map((c) => c.user_id)));
    let names = new Map<string, string>();
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("user_profiles")
        .select("user_id, name")
        .in("user_id", ids);
      names = new Map(
        (profs ?? []).map((p: any) => [p.user_id, (p.name as string) ?? "사용자"]),
      );
    }
    return rows.map((c) => ({
      ...c,
      author_name: names.get(c.user_id) ?? "사용자",
    }));
  },

  async add(
    routineId: string,
    content: string,
    parentId?: string | null,
  ): Promise<void> {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) throw new Error("로그인이 필요합니다.");
    const { error } = await supabase.from("routine_comments").insert({
      routine_id: routineId,
      user_id: uid,
      content: content.trim(),
      parent_id: parentId ?? null,
    });
    if (error) throw error;
  },

  async update(commentId: string, content: string): Promise<void> {
    const { error } = await supabase
      .from("routine_comments")
      .update({ content: content.trim(), updated_at: new Date().toISOString() })
      .eq("id", commentId);
    if (error) throw error;
  },

  async remove(commentId: string): Promise<void> {
    const { error } = await supabase
      .from("routine_comments")
      .delete()
      .eq("id", commentId);
    if (error) throw error;
  },

  // @멘션 후보 — 시퀀스 소유자(선생님) + 그와 연결된 수련생
  // (RLS 로 접근 불가한 경우 빈 배열로 graceful 처리)
  async listMentionTargets(
    ownerId: string,
  ): Promise<{ key: string; name: string; userId: string | null }[]> {
    const targets: { key: string; name: string; userId: string | null }[] = [];
    const { data: owner } = await supabase
      .from("user_profiles")
      .select("user_id, name")
      .eq("user_id", ownerId)
      .maybeSingle();
    if (owner?.name) {
      targets.push({
        key: owner.user_id as string,
        name: owner.name as string,
        userId: owner.user_id as string,
      });
    }
    const { data: students } = await supabase
      .from("student_profiles")
      .select("id, name, user_id")
      .eq("teacher_id", ownerId);
    for (const s of students ?? []) {
      if (!s.name) continue;
      targets.push({
        key: s.id as string,
        name: s.name as string,
        userId: (s.user_id as string | null) ?? null,
      });
    }
    return targets;
  },

  async count(routineId: string): Promise<number> {
    const { count } = await supabase
      .from("routine_comments")
      .select("id", { count: "exact", head: true })
      .eq("routine_id", routineId);
    return count ?? 0;
  },
};
