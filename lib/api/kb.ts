import { supabase } from "../supabase";

export type KbCandidate = {
  id: string;
  message_id: string;
  studio_id: string | null;
  status: "pending" | "approved" | "rejected";
  message_body: string | null;
  question_body: string | null;
  helpful_count: number;
  distilled_title: string | null;
  distilled_content: string | null;
  safety_flag: boolean | null;
  created_at: string;
};

export type DistillResult = {
  title: string;
  content: string;
  safety: boolean;
  drop: boolean;
};

export const kbApi = {
  async isAdmin(): Promise<boolean> {
    const { data, error } = await supabase.rpc("is_app_admin");
    if (error) return false;
    return !!data;
  },

  async listPending(): Promise<KbCandidate[]> {
    const { data, error } = await supabase
      .from("kb_candidates")
      .select("*")
      .eq("status", "pending")
      .order("helpful_count", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as KbCandidate[];
  },

  // distill 엣지함수로 익명·일반화 초안 생성
  async distill(messageId: string): Promise<DistillResult> {
    const { data, error } = await supabase.functions.invoke("yoga-distill", {
      body: { message_id: messageId },
    });
    if (error) throw error;
    return data as DistillResult;
  },

  // 승인 → yoga-ingest로 적재 + 후보 상태 갱신
  async approve(input: {
    candidateId: string;
    messageId: string;
    studioId: string | null;
    title: string;
    content: string;
    safety: boolean;
  }): Promise<void> {
    const { data, error } = await supabase.functions.invoke("yoga-ingest", {
      body: {
        source_type: "chat",
        source_id: input.messageId,
        title: input.title,
        content: input.content,
        metadata: {
          studio_id: input.studioId,
          anonymized: true,
          safety: input.safety,
        },
      },
    });
    if (error) throw error;
    const kdId = (data as any)?.id ?? null;
    const me = (await supabase.auth.getUser()).data.user?.id ?? null;
    const { error: upErr } = await supabase
      .from("kb_candidates")
      .update({
        status: "approved",
        distilled_title: input.title,
        distilled_content: input.content,
        safety_flag: input.safety,
        knowledge_document_id: kdId,
        reviewed_by: me,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.candidateId);
    if (upErr) throw upErr;
  },

  async reject(candidateId: string): Promise<void> {
    const me = (await supabase.auth.getUser()).data.user?.id ?? null;
    const { error } = await supabase
      .from("kb_candidates")
      .update({
        status: "rejected",
        reviewed_by: me,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId);
    if (error) throw error;
  },
};
