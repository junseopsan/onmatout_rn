import { supabase } from "../supabase";

export type ChatRoom = {
  id: string;
  studio_id: string;
  scope: "studio" | "group";
  title: string | null;
  image_url: string | null;
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
    imageUrl?: string | null;
  }): Promise<string> {
    const { data, error } = await supabase.rpc("create_group_room", {
      p_studio_id: input.studioId,
      p_title: input.title,
      p_member_user_ids: input.memberUserIds,
      p_image_url: input.imageUrl ?? null,
    });
    if (error) throw error;
    return data as string;
  },

  // 그룹방 정보 수정 (방장만)
  async updateGroupRoom(input: {
    roomId: string;
    title: string;
    imageUrl?: string | null;
  }): Promise<void> {
    const { error } = await supabase.rpc("update_group_room", {
      p_room_id: input.roomId,
      p_title: input.title,
      p_image_url: input.imageUrl ?? null,
    });
    if (error) throw error;
  },

  async listRoomMembers(
    roomId: string,
  ): Promise<{ user_id: string; role: string; name: string | null }[]> {
    const { data, error } = await supabase.rpc("list_room_members", {
      p_room_id: roomId,
    });
    if (error) throw error;
    return (data ?? []) as {
      user_id: string;
      role: string;
      name: string | null;
    }[];
  },

  async addGroupMember(roomId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc("add_group_member", {
      p_room_id: roomId,
      p_user_id: userId,
    });
    if (error) throw error;
  },

  async removeGroupMember(roomId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc("remove_group_member", {
      p_room_id: roomId,
      p_user_id: userId,
    });
    if (error) throw error;
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

  // 방 진입 시 읽음 처리
  async markRoomRead(roomId: string): Promise<void> {
    await supabase.rpc("mark_room_read", { p_room_id: roomId });
  },

  // 방별 최신 메시지 + 안읽음 여부 (목록 미리보기/정렬용)
  async roomDigest(
    roomIds: string[],
    userId: string,
  ): Promise<
    Map<
      string,
      { body: string; created_at: string; sender_id: string; unread: boolean }
    >
  > {
    const result = new Map<
      string,
      { body: string; created_at: string; sender_id: string; unread: boolean }
    >();
    if (roomIds.length === 0) return result;
    const [{ data: members }, { data: msgs }] = await Promise.all([
      supabase
        .from("chat_room_members")
        .select("room_id, last_read_at")
        .in("room_id", roomIds)
        .eq("user_id", userId),
      supabase
        .from("chat_messages")
        .select("room_id, sender_id, body, created_at")
        .in("room_id", roomIds)
        .order("created_at", { ascending: false }),
    ]);
    const readMap = new Map<string, string | null>(
      (members ?? []).map((m: any) => [m.room_id, m.last_read_at]),
    );
    // room별 최신 메시지 1건
    for (const m of (msgs ?? []) as any[]) {
      if (result.has(m.room_id)) continue;
      const readAt = readMap.get(m.room_id) ?? null;
      const unread =
        m.sender_id !== userId && (!readAt || m.created_at > readAt);
      result.set(m.room_id, {
        body: m.body,
        created_at: m.created_at,
        sender_id: m.sender_id,
        unread,
      });
    }
    return result;
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
