import { supabase } from "../supabase";

export type ChatRoom = {
  id: string;
  studio_id: string;
  scope: "studio" | "group";
  title: string | null;
  created_by: string;
  created_at: string;
  last_activity_at: string;
};

export type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  sender_role: "teacher" | "student";
  body: string;
  created_at: string;
};

export const chatApi = {
  // 내가 속한 방 목록 (RLS가 멤버 방만 반환). studio 방 + 내 그룹방
  async listRooms(studioId: string): Promise<ChatRoom[]> {
    const { data, error } = await supabase
      .from("chat_rooms")
      .select("*")
      .eq("studio_id", studioId)
      .order("scope", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ChatRoom[];
  },

  async getOrCreateStudioRoom(studioId: string): Promise<string> {
    const { data, error } = await supabase.rpc("get_or_create_studio_room", {
      p_studio_id: studioId,
    });
    if (error) throw error;
    return data as string;
  },

  async createGroupRoom(input: {
    studioId: string;
    title: string;
    memberUserIds: string[];
  }): Promise<string> {
    const { data, error } = await supabase.rpc("create_group_room", {
      p_studio_id: input.studioId,
      p_title: input.title,
      p_member_user_ids: input.memberUserIds,
    });
    if (error) throw error;
    return data as string;
  },

  async getRoom(roomId: string): Promise<ChatRoom | null> {
    const { data, error } = await supabase
      .from("chat_rooms")
      .select("*")
      .eq("id", roomId)
      .maybeSingle();
    if (error) throw error;
    return (data as ChatRoom) ?? null;
  },

  async listMessages(roomId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ChatMessage[];
  },

  async sendMessage(input: {
    roomId: string;
    senderId: string;
    role: "teacher" | "student";
    body: string;
  }): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        room_id: input.roomId,
        sender_id: input.senderId,
        sender_role: input.role,
        body: input.body,
      })
      .select()
      .single();
    if (error) throw error;
    return data as ChatMessage;
  },

  async senderNames(userIds: string[]): Promise<Map<string, string>> {
    const ids = Array.from(new Set(userIds.filter(Boolean)));
    if (ids.length === 0) return new Map();
    const { data } = await supabase
      .from("user_profiles")
      .select("user_id, name")
      .in("user_id", ids);
    return new Map(
      (data ?? []).map((r: any) => [
        r.user_id as string,
        (r.name as string) ?? "사용자",
      ]),
    );
  },

  // 방별 멤버 수 (목록 표시용)
  async memberCounts(roomIds: string[]): Promise<Map<string, number>> {
    if (roomIds.length === 0) return new Map();
    const { data } = await supabase
      .from("chat_room_members")
      .select("room_id")
      .in("room_id", roomIds);
    const map = new Map<string, number>();
    for (const r of (data ?? []) as { room_id: string }[]) {
      map.set(r.room_id, (map.get(r.room_id) ?? 0) + 1);
    }
    return map;
  },

  async listHelpful(
    messageIds: string[],
  ): Promise<{ message_id: string; user_id: string }[]> {
    if (messageIds.length === 0) return [];
    const { data, error } = await supabase
      .from("chat_helpful")
      .select("message_id, user_id")
      .in("message_id", messageIds);
    if (error) throw error;
    return (data ?? []) as { message_id: string; user_id: string }[];
  },

  async toggleHelpful(messageId: string, userId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from("chat_helpful")
      .select("message_id")
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("chat_helpful")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", userId);
      if (error) throw error;
      return false;
    }
    const { error } = await supabase
      .from("chat_helpful")
      .insert({ message_id: messageId, user_id: userId });
    if (error) throw error;
    return true;
  },
};
