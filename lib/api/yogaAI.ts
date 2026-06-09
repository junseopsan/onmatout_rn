import { supabase } from "../supabase";

export type YogaAskSource = {
  id: string;
  title: string;
  source_type: string;
  similarity: number;
};

export type YogaAskResponse = {
  answer: string;
  sources: YogaAskSource[];
  safety_notice_required: boolean;
  should_recommend_teacher: boolean;
  log_id: string | null;
};

export const yogaAIApi = {
  async ask(input: {
    question: string;
    threadId?: string | null;
    sourceTypes?: string[] | null;
  }): Promise<YogaAskResponse> {
    const { data, error } = await supabase.functions.invoke("yoga-ask", {
      body: {
        question: input.question,
        thread_id: input.threadId ?? null,
        source_types: input.sourceTypes ?? null,
      },
    });
    if (error) throw error;
    return data as YogaAskResponse;
  },

  async rateAnswer(logId: string, rating: 1 | -1) {
    const { error } = await supabase
      .from("ai_answer_logs")
      .update({ rating, rated_at: new Date().toISOString() })
      .eq("id", logId);
    if (error) throw error;
  },

  async listMyAnswerLogs(userId: string, limit = 30) {
    const { data, error } = await supabase
      .from("ai_answer_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  // 세션(thread_id) 별로 묶어서 리스트 반환 — 최신 활동순
  // null thread_id 로그는 "이전 대화" 가상 세션으로 묶음 (threadId === "")
  async listMySessions(userId: string) {
    const [{ data: logs, error }, { data: sessionRows }] = await Promise.all([
      supabase
        .from("ai_answer_logs")
        .select("id, thread_id, question, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("ai_sessions")
        .select("thread_id, title")
        .eq("user_id", userId),
    ]);
    if (error) throw error;
    const customTitleMap = new Map<string, string>();
    for (const s of (sessionRows ?? []) as any[]) {
      if (s.title) customTitleMap.set(s.thread_id, s.title);
    }
    const map = new Map<
      string,
      {
        threadId: string;
        firstQuestion: string;
        title: string;
        lastAt: string;
        count: number;
      }
    >();
    for (const l of (logs ?? []) as any[]) {
      const tid = (l.thread_id as string | null) ?? "";
      const existing = map.get(tid);
      if (!existing) {
        const firstQ =
          tid === "" ? "이전 대화" : (l.question as string);
        map.set(tid, {
          threadId: tid,
          firstQuestion: firstQ,
          title: customTitleMap.get(tid) ?? firstQ,
          lastAt: l.created_at as string,
          count: 1,
        });
      } else {
        existing.lastAt = l.created_at as string;
        existing.count += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      b.lastAt.localeCompare(a.lastAt),
    );
  },

  async updateSessionTitle(
    userId: string,
    threadId: string,
    title: string,
  ) {
    const trimmed = title.trim();
    const { error } = await supabase.from("ai_sessions").upsert(
      {
        thread_id: threadId,
        user_id: userId,
        title: trimmed || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "thread_id" },
    );
    if (error) throw error;
  },

  async deleteSession(userId: string, threadId: string) {
    if (threadId === "") {
      const { error } = await supabase
        .from("ai_answer_logs")
        .delete()
        .eq("user_id", userId)
        .is("thread_id", null);
      if (error) throw error;
      return;
    }
    const [logRes, sessionRes] = await Promise.all([
      supabase
        .from("ai_answer_logs")
        .delete()
        .eq("user_id", userId)
        .eq("thread_id", threadId),
      supabase
        .from("ai_sessions")
        .delete()
        .eq("user_id", userId)
        .eq("thread_id", threadId),
    ]);
    if (logRes.error) throw logRes.error;
    if (sessionRes.error) throw sessionRes.error;
  },

  async listLogsForThread(userId: string, threadId: string) {
    let q = supabase
      .from("ai_answer_logs")
      .select("*")
      .eq("user_id", userId);
    if (threadId === "") {
      q = q.is("thread_id", null);
    } else {
      q = q.eq("thread_id", threadId);
    }
    const { data, error } = await q.order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
};
