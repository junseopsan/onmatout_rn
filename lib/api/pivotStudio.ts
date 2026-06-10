import { supabase } from "../supabase";

export type PivotStudio = {
  id: string;
  owner_id: string;
  name: string;
  location: string | null;
  phone: string | null;
  hours_text: string | null;
  website_url: string | null;
  instagram_url: string | null;
  kakao_url: string | null;
  description: string | null;
  policy_text: string | null;
  pricing_text: string | null;
  cancel_cutoff_hours: number;
  created_at: string;
  updated_at: string;
};

export type PivotStudioInput = {
  name: string;
  location?: string | null;
  phone?: string | null;
  hours_text?: string | null;
  website_url?: string | null;
  instagram_url?: string | null;
  kakao_url?: string | null;
  description?: string | null;
  policy_text?: string | null;
  pricing_text?: string | null;
  cancel_cutoff_hours?: number;
};

export const pivotStudioApi = {
  async listMyStudios(userId: string): Promise<PivotStudio[]> {
    // 내가 소유한 요가원 + 선생님으로 초대된 요가원 (status=active)
    const [{ data: owned, error: oErr }, { data: invited, error: iErr }] =
      await Promise.all([
        supabase
          .from("pivot_studios")
          .select("*")
          .eq("owner_id", userId),
        supabase
          .from("studio_teachers")
          .select("studio:pivot_studios(*)")
          .eq("teacher_id", userId)
          .eq("status", "active"),
      ]);
    if (oErr) throw oErr;
    if (iErr) throw iErr;
    const invitedStudios = ((invited ?? []) as any[])
      .map((r) => (Array.isArray(r.studio) ? r.studio[0] : r.studio))
      .filter(Boolean) as PivotStudio[];
    const merged: PivotStudio[] = [
      ...((owned ?? []) as PivotStudio[]),
      ...invitedStudios,
    ];
    const seen = new Set<string>();
    return merged
      .filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
  },

  async listStudioTeachers(studioId: string) {
    const { data, error } = await supabase
      .from("studio_teachers")
      .select("teacher_id, status, added_at, added_by")
      .eq("studio_id", studioId)
      .order("added_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async promoteStudentToTeacher(input: {
    studioId: string;
    teacherUserId: string;
  }) {
    // 1. studio_teachers 등록
    const { error: stErr } = await supabase
      .from("studio_teachers")
      .upsert(
        {
          studio_id: input.studioId,
          teacher_id: input.teacherUserId,
          status: "active",
        },
        { onConflict: "studio_id,teacher_id" },
      );
    if (stErr) throw stErr;

    // 2. teacher 역할 부여 (없으면)
    const { error: roleErr } = await supabase
      .from("user_roles")
      .upsert(
        { user_id: input.teacherUserId, role: "teacher" },
        { onConflict: "user_id,role" },
      );
    if (roleErr) throw roleErr;
  },

  async removeStudioTeacher(input: {
    studioId: string;
    teacherUserId: string;
    reason?: string | null;
    addedAt?: string | null;
  }) {
    // 사유는 별도 history 테이블에 기록
    if (input.reason && input.reason.trim().length > 0) {
      await supabase.from("studio_teacher_removals").insert({
        studio_id: input.studioId,
        teacher_id: input.teacherUserId,
        reason: input.reason.trim(),
        added_at: input.addedAt ?? null,
      });
    }
    const { error } = await supabase
      .from("studio_teachers")
      .delete()
      .eq("studio_id", input.studioId)
      .eq("teacher_id", input.teacherUserId);
    if (error) throw error;
  },

  async getStudio(id: string): Promise<PivotStudio | null> {
    const { data, error } = await supabase
      .from("pivot_studios")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as PivotStudio) ?? null;
  },

  async createStudio(input: { ownerId: string } & PivotStudioInput) {
    const { ownerId, ...rest } = input;
    const { data, error } = await supabase
      .from("pivot_studios")
      .insert({
        owner_id: ownerId,
        name: rest.name,
        location: rest.location ?? null,
        phone: rest.phone ?? null,
        hours_text: rest.hours_text ?? null,
        website_url: rest.website_url ?? null,
        instagram_url: rest.instagram_url ?? null,
        kakao_url: rest.kakao_url ?? null,
        description: rest.description ?? null,
        policy_text: rest.policy_text ?? null,
        pricing_text: rest.pricing_text ?? null,
        cancel_cutoff_hours: rest.cancel_cutoff_hours ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data as PivotStudio;
  },

  async updateStudio(id: string, input: Partial<PivotStudioInput>) {
    const patch: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) patch.name = input.name;
    if (input.location !== undefined) patch.location = input.location;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.hours_text !== undefined) patch.hours_text = input.hours_text;
    if (input.website_url !== undefined) patch.website_url = input.website_url;
    if (input.instagram_url !== undefined)
      patch.instagram_url = input.instagram_url;
    if (input.kakao_url !== undefined) patch.kakao_url = input.kakao_url;
    if (input.description !== undefined) patch.description = input.description;
    if (input.policy_text !== undefined) patch.policy_text = input.policy_text;
    if (input.pricing_text !== undefined)
      patch.pricing_text = input.pricing_text;
    if (input.cancel_cutoff_hours !== undefined)
      patch.cancel_cutoff_hours = input.cancel_cutoff_hours;
    const { data, error } = await supabase
      .from("pivot_studios")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as PivotStudio;
  },

  async applyForStudio(input: { applicantUserId: string } & PivotStudioInput) {
    const { data, error } = await supabase
      .from("studio_applications")
      .insert({
        applicant_user_id: input.applicantUserId,
        name: input.name,
        location: input.location ?? null,
        phone: input.phone ?? null,
        hours_text: input.hours_text ?? null,
        website_url: input.website_url ?? null,
        description: input.description ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as {
      id: string;
      status: "pending" | "auto_approved" | "approved" | "rejected" | "suspended";
      studio_id: string | null;
    };
  },

  async listMyApplications(applicantUserId: string) {
    const { data, error } = await supabase
      .from("studio_applications")
      .select("id, name, status, studio_id, created_at")
      .eq("applicant_user_id", applicantUserId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getMyStudentStudio(userId: string): Promise<PivotStudio | null> {
    const { data: sp } = await supabase
      .from("student_profiles")
      .select("studio_id")
      .eq("user_id", userId)
      .not("studio_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sp?.studio_id) return null;
    const { data: studio } = await supabase
      .from("pivot_studios")
      .select("*")
      .eq("id", sp.studio_id)
      .maybeSingle();
    return (studio as PivotStudio) ?? null;
  },
};
