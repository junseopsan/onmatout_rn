import { supabase } from "../supabase";

export type YogaTalkThread = {
  id: string;
  teacher_id: string;
  student_id: string;
  class_id: string | null;
  category: string;
  title: string;
  status: string;
  is_default: boolean;
  last_activity_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TopicThreadSummary = {
  id: string;
  title: string;
  is_default: boolean;
  last_activity_at: string;
  created_at: string;
  last_message_preview: string | null;
};

export type YogaTalkMessage = {
  id: string;
  thread_id: string;
  sender_id: string | null;
  sender_type: "teacher" | "student" | "system";
  body: string;
  created_at: string;
  updated_at: string;
};

export type ThreadSummary = YogaTalkThread & {
  last_message: YogaTalkMessage | null;
  class_title: string | null;
  counterpart_name: string | null;
  my_read_at: string | null;
  counterpart_read_at: string | null;
  counterpart_user_id: string | null;
};

export const yogaTalkApi = {
  // 지도자 측: 페어당 기본 스레드만 (목록 화면)
  async listAsTeacher(teacherUserId: string): Promise<ThreadSummary[]> {
    const { data, error } = await supabase
      .from("yoga_talk_threads")
      .select(
        "*, classes:class_id(title), student:student_profiles!yoga_talk_threads_student_id_fkey(name)",
      )
      .eq("teacher_id", teacherUserId)
      .eq("is_default", true)
      .order("last_activity_at", { ascending: false });
    if (error) throw error;
    return enrichWithLast((data ?? []) as any[], "student");
  },

  // 수련생 측: 페어당 기본 스레드만
  async listAsStudent(studentProfileIds: string[]): Promise<ThreadSummary[]> {
    if (studentProfileIds.length === 0) return [];
    const { data, error } = await supabase
      .from("yoga_talk_threads")
      .select(
        "*, classes:class_id(title), teacher:user_profiles!yoga_talk_threads_teacher_id_fkey(name)",
      )
      .in("student_id", studentProfileIds)
      .eq("is_default", true)
      .order("last_activity_at", { ascending: false });
    if (error) throw error;
    return enrichWithLast((data ?? []) as any[], "teacher");
  },

  async getOrCreateThread(input: {
    teacherUserId: string;
    studentProfileId: string;
    classId?: string | null;
    title: string;
    category?: string;
  }): Promise<YogaTalkThread> {
    // (teacher, student) 페어의 default 스레드 — 없으면 default 로 새로 생성
    const { data: existing, error: exErr } = await supabase
      .from("yoga_talk_threads")
      .select("*")
      .eq("teacher_id", input.teacherUserId)
      .eq("student_id", input.studentProfileId)
      .eq("is_default", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (exErr) throw exErr;
    if (existing) {
      if (existing.status !== "open") {
        const { data: reopened } = await supabase
          .from("yoga_talk_threads")
          .update({
            status: "open",
            closed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();
        return (reopened ?? existing) as YogaTalkThread;
      }
      return existing as YogaTalkThread;
    }

    const { data: created, error } = await supabase
      .from("yoga_talk_threads")
      .insert({
        teacher_id: input.teacherUserId,
        student_id: input.studentProfileId,
        class_id: input.classId ?? null,
        title: input.title,
        category: input.category ?? "general",
        status: "open",
        is_default: true,
      })
      .select()
      .single();
    if (error) throw error;
    return created as YogaTalkThread;
  },

  // (teacher, student) 페어의 모든 토픽 스레드 (사이드바용)
  async listTopicThreads(
    teacherUserId: string,
    studentProfileId: string,
  ): Promise<TopicThreadSummary[]> {
    const { data: threads, error } = await supabase
      .from("yoga_talk_threads")
      .select("id, title, is_default, last_activity_at, created_at")
      .eq("teacher_id", teacherUserId)
      .eq("student_id", studentProfileId)
      .order("is_default", { ascending: false })
      .order("last_activity_at", { ascending: false });
    if (error) throw error;
    const list = (threads ?? []) as any[];
    if (list.length === 0) return [];
    const ids = list.map((t) => t.id);
    const { data: lastMsgs } = await supabase
      .from("yoga_talk_messages")
      .select("thread_id, body, created_at")
      .in("thread_id", ids)
      .order("created_at", { ascending: false });
    const previewByThread = new Map<string, string>();
    for (const m of (lastMsgs ?? []) as any[]) {
      if (!previewByThread.has(m.thread_id)) {
        previewByThread.set(m.thread_id, (m.body ?? "").slice(0, 40));
      }
    }
    return list.map((t) => ({
      id: t.id,
      title: t.title,
      is_default: !!t.is_default,
      last_activity_at: t.last_activity_at,
      created_at: t.created_at,
      last_message_preview: previewByThread.get(t.id) ?? null,
    }));
  },

  // 새 토픽 스레드 생성 (is_default = false)
  async createTopicThread(input: {
    teacherUserId: string;
    studentProfileId: string;
    title: string;
  }): Promise<YogaTalkThread> {
    const { data, error } = await supabase
      .from("yoga_talk_threads")
      .insert({
        teacher_id: input.teacherUserId,
        student_id: input.studentProfileId,
        class_id: null,
        title: input.title.trim() || "새 대화",
        category: "general",
        status: "open",
        is_default: false,
      })
      .select()
      .single();
    if (error) throw error;
    return data as YogaTalkThread;
  },

  async renameThread(threadId: string, title: string) {
    const trimmed = title.trim();
    if (!trimmed) throw new Error("제목을 입력해 주세요.");
    const { error } = await supabase
      .from("yoga_talk_threads")
      .update({ title: trimmed, updated_at: new Date().toISOString() })
      .eq("id", threadId);
    if (error) throw error;
  },

  async deleteThread(threadId: string) {
    // 기본 스레드는 삭제 불가
    const { data: t, error: getErr } = await supabase
      .from("yoga_talk_threads")
      .select("is_default")
      .eq("id", threadId)
      .maybeSingle();
    if (getErr) throw getErr;
    if (t?.is_default) {
      throw new Error("기본 대화는 삭제할 수 없어요.");
    }
    const { error } = await supabase
      .from("yoga_talk_threads")
      .delete()
      .eq("id", threadId);
    if (error) throw error;
  },

  async listMessages(threadId: string): Promise<YogaTalkMessage[]> {
    const { data, error } = await supabase
      .from("yoga_talk_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as YogaTalkMessage[];
  },

  async sendMessage(input: {
    threadId: string;
    senderUserId: string;
    senderType: "teacher" | "student";
    body: string;
  }) {
    const { data: msg, error } = await supabase
      .from("yoga_talk_messages")
      .insert({
        thread_id: input.threadId,
        sender_id: input.senderUserId,
        sender_type: input.senderType,
        body: input.body,
      })
      .select()
      .single();
    if (error) throw error;

    // 마지막 활동 시각 갱신
    await supabase
      .from("yoga_talk_threads")
      .update({
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.threadId);

    return msg as YogaTalkMessage;
  },

  async unreadCount(): Promise<number> {
    const { data, error } = await supabase.rpc("yoga_talk_unread_count");
    if (error) throw error;
    return typeof data === "number" ? data : 0;
  },

  async markThreadRead(threadId: string) {
    await supabase.rpc("yoga_talk_mark_read", { p_thread_id: threadId });
  },

  async closeThread(threadId: string) {
    const { error } = await supabase
      .from("yoga_talk_threads")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", threadId);
    if (error) throw error;
  },
};

async function enrichWithLast(
  rows: any[],
  counterpartKey: "teacher" | "student",
): Promise<ThreadSummary[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [{ data: msgs }, meAuth, { data: reads }] = await Promise.all([
    supabase
      .from("yoga_talk_messages")
      .select("*")
      .in("thread_id", ids)
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
    supabase
      .from("yoga_talk_thread_reads")
      .select("thread_id, user_id, last_read_at")
      .in("thread_id", ids),
  ]);
  const myUserId = meAuth.data.user?.id ?? null;

  const lastByThread = new Map<string, YogaTalkMessage>();
  for (const m of (msgs ?? []) as YogaTalkMessage[]) {
    if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m);
  }

  const readByThreadUser = new Map<string, string>(); // `${threadId}|${userId}` → last_read_at
  for (const r of (reads ?? []) as any[]) {
    readByThreadUser.set(`${r.thread_id}|${r.user_id}`, r.last_read_at);
  }

  // 학생 user_id 조회 (counterpartKey === "student" 인 경우 teacher 입장에서 학생 user_id 필요)
  let studentUserIdMap = new Map<string, string | null>();
  if (counterpartKey === "student") {
    const studentProfileIds = Array.from(
      new Set(rows.map((r) => r.student_id)),
    );
    if (studentProfileIds.length > 0) {
      const { data: sps } = await supabase
        .from("student_profiles")
        .select("id, user_id")
        .in("id", studentProfileIds);
      for (const sp of (sps ?? []) as any[]) {
        studentUserIdMap.set(sp.id, sp.user_id);
      }
    }
  }

  return rows.map((r) => {
    const counterpartRaw = r[counterpartKey];
    const counterpart = Array.isArray(counterpartRaw)
      ? counterpartRaw[0]
      : counterpartRaw;
    const classRaw = r.classes;
    const classRow = Array.isArray(classRaw) ? classRaw[0] : classRaw;

    // counterpart user_id (read_at lookup용)
    let counterpartUserId: string | null = null;
    if (counterpartKey === "teacher") {
      counterpartUserId = r.teacher_id ?? null;
    } else {
      counterpartUserId = studentUserIdMap.get(r.student_id) ?? null;
    }

    const myRead = myUserId
      ? readByThreadUser.get(`${r.id}|${myUserId}`) ?? null
      : null;
    const counterpartRead = counterpartUserId
      ? readByThreadUser.get(`${r.id}|${counterpartUserId}`) ?? null
      : null;

    return {
      ...r,
      last_message: lastByThread.get(r.id) ?? null,
      class_title: classRow?.title ?? null,
      counterpart_name: counterpart?.name ?? null,
      my_read_at: myRead,
      counterpart_read_at: counterpartRead,
      counterpart_user_id: counterpartUserId,
    } as ThreadSummary;
  });
}
