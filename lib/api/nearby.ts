import { supabase } from "../supabase";

export type NearbyStudent = {
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
  distance_m: number;
};

export type StudentInvite = {
  id: string;
  teacher_id: string;
  user_id: string;
  studio_id: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

export const nearbyApi = {
  // 본인 위치 갱신
  async updateLocation(lat: number, lng: number): Promise<void> {
    const { error } = await supabase.rpc("update_my_location", {
      p_lat: lat,
      p_lng: lng,
    });
    if (error) throw error;
  },

  // 발견 허용 토글
  async setDiscoverable(on: boolean): Promise<void> {
    const { error } = await supabase.rpc("set_discoverable", { p_on: on });
    if (error) throw error;
  },

  // 내 발견 허용 상태 조회
  async getDiscoverable(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from("user_profiles")
      .select("discoverable")
      .eq("user_id", userId)
      .maybeSingle();
    return !!data?.discoverable;
  },

  // 선생님: 근처 수련생 조회
  async findNearbyStudents(
    lat: number,
    lng: number,
    radiusM = 100,
  ): Promise<NearbyStudent[]> {
    const { data, error } = await supabase.rpc("find_nearby_students", {
      p_host_lat: lat,
      p_host_lng: lng,
      p_radius_m: radiusM,
    });
    if (error) throw error;
    return (data ?? []) as NearbyStudent[];
  },

  // 선생님: 근처 수련생 초대
  async inviteNearbyStudent(
    userId: string,
  ): Promise<{ invite_id: string; status: string }> {
    const { data, error } = await supabase.rpc("invite_nearby_student", {
      p_user_id: userId,
    });
    if (error) throw error;
    return data as { invite_id: string; status: string };
  },

  // 수련생: 받은 대기중 초대 목록 (선생님 이름 포함)
  async listMyInvites(): Promise<
    (StudentInvite & { teacher_name: string | null })[]
  > {
    const { data, error } = await supabase
      .from("student_invites")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const invites = (data ?? []) as StudentInvite[];
    if (invites.length === 0) return [];
    const teacherIds = Array.from(new Set(invites.map((i) => i.teacher_id)));
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("user_id, name")
      .in("user_id", teacherIds);
    const nameMap = new Map(
      (profiles ?? []).map((p: any) => [p.user_id, p.name]),
    );
    return invites.map((i) => ({
      ...i,
      teacher_name: nameMap.get(i.teacher_id) ?? null,
    }));
  },

  // 수련생: 초대 수락 → student_profiles 자동 생성+연결
  async acceptInvite(inviteId: string): Promise<string> {
    const { data, error } = await supabase.rpc("accept_student_invite", {
      p_invite_id: inviteId,
    });
    if (error) throw error;
    return data as string;
  },

  // 수련생: 초대 거절
  async declineInvite(inviteId: string): Promise<void> {
    const { error } = await supabase
      .from("student_invites")
      .update({ status: "declined", decided_at: new Date().toISOString() })
      .eq("id", inviteId);
    if (error) throw error;
  },
};
