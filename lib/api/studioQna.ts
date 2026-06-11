import { supabase } from "../supabase";

export type StudioQnaMessage = {
  id: string;
  studio_id: string;
  sender_id: string;
  sender_role: "teacher" | "student";
  body: string;
  created_at: string;
};

export const studioQnaApi = {
  async listMessages(studioId: string): Promise<StudioQnaMessage[]> {
    const { data, error } = await supabase
      .from("studio_qna_messages")
      .select("*")
      .eq("studio_id", studioId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as StudioQnaMessage[];
  },

  async sendMessage(input: {
    studioId: string;
    senderId: string;
    role: "teacher" | "student";
    body: string;
  }): Promise<StudioQnaMessage> {
    const { data, error } = await supabase
      .from("studio_qna_messages")
      .insert({
        studio_id: input.studioId,
        sender_id: input.senderId,
        sender_role: input.role,
        body: input.body,
      })
      .select()
      .single();
    if (error) throw error;
    return data as StudioQnaMessage;
  },

  // 보낸 사람 이름 표시용 (user_id → name)
  async senderNames(userIds: string[]): Promise<Map<string, string>> {
    const ids = Array.from(new Set(userIds.filter(Boolean)));
    if (ids.length === 0) return new Map();
    const { data } = await supabase
      .from("user_profiles")
      .select("user_id, name")
      .in("user_id", ids);
    return new Map(
      (data ?? []).map((r: any) => [r.user_id as string, (r.name as string) ?? "사용자"]),
    );
  },

  async listHelpful(
    messageIds: string[],
  ): Promise<{ message_id: string; user_id: string }[]> {
    if (messageIds.length === 0) return [];
    const { data, error } = await supabase
      .from("studio_qna_helpful")
      .select("message_id, user_id")
      .in("message_id", messageIds);
    if (error) throw error;
    return (data ?? []) as { message_id: string; user_id: string }[];
  },

  async toggleHelpful(messageId: string, userId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from("studio_qna_helpful")
      .select("message_id")
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("studio_qna_helpful")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", userId);
      if (error) throw error;
      return false;
    }
    const { error } = await supabase
      .from("studio_qna_helpful")
      .insert({ message_id: messageId, user_id: userId });
    if (error) throw error;
    return true;
  },

  // 원장이 Q&A 채널 사용 여부 토글 (owner RLS)
  async setEnabled(studioId: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from("pivot_studios")
      .update({ qna_enabled: enabled, updated_at: new Date().toISOString() })
      .eq("id", studioId);
    if (error) throw error;
  },
};
