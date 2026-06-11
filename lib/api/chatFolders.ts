import { supabase } from "../supabase";

export type ChatFolder = {
  id: string;
  name: string;
  sort_order: number;
};

export type FolderItemType = "thread" | "room";

export type FolderItem = {
  folder_id: string;
  item_type: FolderItemType;
  item_id: string;
};

// 폴더 아이템 식별 키 (thread/room 통합)
export function itemKey(type: FolderItemType, id: string) {
  return `${type}:${id}`;
}

export const chatFoldersApi = {
  async listFolders(): Promise<ChatFolder[]> {
    const { data, error } = await supabase
      .from("chat_folders")
      .select("id, name, sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ChatFolder[];
  },

  // 내 모든 폴더의 아이템 (필터링용)
  async listItems(): Promise<FolderItem[]> {
    const { data, error } = await supabase
      .from("chat_folder_items")
      .select("folder_id, item_type, item_id");
    if (error) throw error;
    return (data ?? []) as FolderItem[];
  },

  async createFolder(name: string): Promise<ChatFolder> {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) throw new Error("로그인이 필요합니다.");
    const { data, error } = await supabase
      .from("chat_folders")
      .insert({ user_id: uid, name: name.trim() })
      .select("id, name, sort_order")
      .single();
    if (error) throw error;
    return data as ChatFolder;
  },

  async renameFolder(id: string, name: string): Promise<void> {
    const { error } = await supabase
      .from("chat_folders")
      .update({ name: name.trim() })
      .eq("id", id);
    if (error) throw error;
  },

  async deleteFolder(id: string): Promise<void> {
    const { error } = await supabase.from("chat_folders").delete().eq("id", id);
    if (error) throw error;
  },

  async addItem(
    folderId: string,
    itemType: FolderItemType,
    itemId: string,
  ): Promise<void> {
    const { error } = await supabase
      .from("chat_folder_items")
      .upsert(
        { folder_id: folderId, item_type: itemType, item_id: itemId },
        { onConflict: "folder_id,item_type,item_id" },
      );
    if (error) throw error;
  },

  async removeItem(
    folderId: string,
    itemType: FolderItemType,
    itemId: string,
  ): Promise<void> {
    const { error } = await supabase
      .from("chat_folder_items")
      .delete()
      .eq("folder_id", folderId)
      .eq("item_type", itemType)
      .eq("item_id", itemId);
    if (error) throw error;
  },
};
