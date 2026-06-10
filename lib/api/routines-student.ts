import { supabase } from "../supabase";
import type { Routine, RoutineItem } from "../../types/teacher";

export type RoutinePreviewItem = {
  order_index: number;
  asanas: {
    id: string;
    sanskrit_name_kr: string;
    image_number: string | null;
  } | null;
};

export type RoutineSummary = Routine & {
  teacher_studio_name: string | null;
  item_count: number;
  preview: RoutinePreviewItem[];
  like_count: number;
  liked_by_me: boolean;
};

async function withTeacherStudio(
  routines: any[],
  currentUserId?: string,
): Promise<RoutineSummary[]> {
  if (routines.length === 0) return [];
  const teacherIds = Array.from(new Set(routines.map((r) => r.teacher_id)));
  const { data: teachers } = await supabase
    .from("teacher_profiles")
    .select("user_id, studio_name")
    .in("user_id", teacherIds);
  const studioMap = new Map(
    (teachers ?? []).map((t) => [t.user_id, t.studio_name ?? null]),
  );
  return routines.map((r: any) => {
    const likes: { user_id: string }[] = r.routine_likes ?? [];
    return {
      ...r,
      teacher_studio_name: studioMap.get(r.teacher_id) ?? null,
      item_count: r.routine_items?.[0]?.count ?? 0,
      preview: (r.preview ?? []) as RoutinePreviewItem[],
      like_count: likes.length,
      liked_by_me: !!currentUserId && likes.some((l) => l.user_id === currentUserId),
    };
  }) as RoutineSummary[];
}

export const studentRoutinesApi = {
  // 내 소유 루틴 + 공유받은 루틴 (다른 사람의 단순 public 노출은 둘러보기 탭에서)
  async listSharedRoutines(userId?: string): Promise<RoutineSummary[]> {
    let query = supabase
      .from("routines")
      .select(
        "*, routine_items(count), routine_likes(user_id), preview:routine_items(order_index, asanas(id, sanskrit_name_kr, image_number))",
      )
      .eq("is_draft", false)
      .order("created_at", { ascending: false });
    if (userId) {
      query = query.or(`visibility.neq.public,teacher_id.eq.${userId}`);
    }
    const { data: routines, error } = await query;
    if (error) throw error;
    return withTeacherStudio(routines ?? [], userId);
  },

  async listPublicRoutines(excludeUserId?: string): Promise<RoutineSummary[]> {
    let query = supabase
      .from("routines")
      .select(
        "*, routine_items(count), routine_likes(user_id), preview:routine_items(order_index, asanas(id, sanskrit_name_kr, image_number))",
      )
      .eq("visibility", "public")
      .eq("is_draft", false)
      .order("created_at", { ascending: false })
      .limit(50);
    if (excludeUserId) {
      query = query.neq("teacher_id", excludeUserId);
    }
    const { data: routines, error } = await query;
    if (error) throw error;
    return withTeacherStudio(routines ?? [], excludeUserId);
  },

  async toggleRoutineLike(
    routineId: string,
    userId: string,
  ): Promise<{ liked: boolean; like_count: number }> {
    const { data: existing, error: selErr } = await supabase
      .from("routine_likes")
      .select("user_id")
      .eq("routine_id", routineId)
      .eq("user_id", userId)
      .maybeSingle();
    if (selErr) throw selErr;
    if (existing) {
      const { error } = await supabase
        .from("routine_likes")
        .delete()
        .eq("routine_id", routineId)
        .eq("user_id", userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("routine_likes")
        .insert({ routine_id: routineId, user_id: userId });
      if (error) throw error;
    }
    const { count } = await supabase
      .from("routine_likes")
      .select("user_id", { count: "exact", head: true })
      .eq("routine_id", routineId);
    return { liked: !existing, like_count: count ?? 0 };
  },

  async cloneRoutine(sourceRoutineId: string, newTitle?: string) {
    const { data, error } = await supabase.rpc("clone_routine", {
      p_source_routine_id: sourceRoutineId,
      p_new_title: newTitle ?? undefined,
    });
    if (error) throw error;
    return data as string;
  },

  async getRoutine(routineId: string) {
    const { data: routine, error } = await supabase
      .from("routines")
      .select("*")
      .eq("id", routineId)
      .single();
    if (error) throw error;
    const { data: items, error: iErr } = await supabase
      .from("routine_items")
      .select("*, asanas(*)")
      .eq("routine_id", routineId)
      .order("order_index", { ascending: true });
    if (iErr) throw iErr;
    return {
      routine: routine as Routine,
      items: (items ?? []) as (RoutineItem & {
        asanas: {
          id: string;
          sanskrit_name_kr: string;
          sanskrit_name_en: string;
          image_number: string | null;
          category_name_en: string | null;
        };
      })[],
    };
  },
};
