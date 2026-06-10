import { supabase } from "../supabase";

export type MembershipPlanType =
  | "count"
  | "period_weekly"
  | "period_unlimited";

export type MembershipPlan = {
  id: string;
  studio_id: string;
  name: string;
  type: MembershipPlanType;
  duration_min: number | null;
  total_count: number | null;
  weekly_limit: number | null;
  valid_days: number | null;
  price: number | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type MembershipPlanInput = {
  studio_id: string;
  name: string;
  type: MembershipPlanType;
  duration_min?: number | null;
  total_count?: number | null;
  weekly_limit?: number | null;
  valid_days?: number | null;
  price?: number | null;
  image_url?: string | null;
  sort_order?: number;
};

export const membershipPlansApi = {
  async listByStudio(
    studioId: string,
    opts?: { activeOnly?: boolean },
  ): Promise<MembershipPlan[]> {
    let q = supabase
      .from("membership_plans")
      .select("*")
      .eq("studio_id", studioId);
    if (opts?.activeOnly) q = q.eq("is_active", true);
    const { data, error } = await q
      .order("sort_order", { ascending: true })
      .order("price", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as MembershipPlan[];
  },

  async create(input: MembershipPlanInput): Promise<MembershipPlan> {
    const { data, error } = await supabase
      .from("membership_plans")
      .insert({
        studio_id: input.studio_id,
        name: input.name,
        type: input.type,
        duration_min: input.duration_min ?? null,
        total_count: input.total_count ?? null,
        weekly_limit: input.weekly_limit ?? null,
        valid_days: input.valid_days ?? null,
        price: input.price ?? null,
        image_url: input.image_url ?? null,
        sort_order: input.sort_order ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data as MembershipPlan;
  },

  async update(
    id: string,
    patch: Partial<MembershipPlanInput> & { is_active?: boolean },
  ): Promise<MembershipPlan> {
    const next: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    for (const k of [
      "name",
      "type",
      "duration_min",
      "total_count",
      "weekly_limit",
      "valid_days",
      "price",
      "image_url",
      "sort_order",
      "is_active",
    ] as const) {
      if ((patch as any)[k] !== undefined) next[k] = (patch as any)[k];
    }
    const { data, error } = await supabase
      .from("membership_plans")
      .update(next)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as MembershipPlan;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from("membership_plans")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
