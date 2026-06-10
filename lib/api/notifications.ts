import { supabase } from "../supabase";

export type AppNotification = {
  id: string;
  user_id: string;
  type: "yoga_talk" | "booking_confirmed" | "waitlist_promoted" | "general";
  title: string;
  body: string | null;
  data: Record<string, any> | null;
  read_at: string | null;
  created_at: string;
};

export const notificationsApi = {
  async list(limit = 50): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AppNotification[];
  },

  async unreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    if (error) throw error;
    return count ?? 0;
  },

  async markRead(id: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .is("read_at", null);
    if (error) throw error;
  },

  async markAllRead(): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    if (error) throw error;
  },
};
