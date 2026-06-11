import { supabase } from "../supabase";

export type StudioClass = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  capacity: number | null;
  is_active: boolean;
  teacher_id: string;
  studio_id: string | null;
  class_schedules: {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }[];
};

export type ClassBooking = {
  id: string;
  class_id: string;
  student_id: string;
  booking_date: string;
  status: "booked" | "canceled" | "attended";
  created_at: string;
};

export type StudentStudioMembership = {
  studentProfileId: string;
  teacherId: string;
  studio: {
    id: string;
    name: string;
    location: string | null;
  };
};

export type StudioFullInfo = {
  id: string;
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
  pricing_image_url: string | null;
  policy_image_url: string | null;
  description_image_url: string | null;
  rules_image_url: string | null;
  photos: string[];
  hours_by_day: Record<string, string> | null;
  bank_account: string | null;
  cancel_cutoff_hours: number;
  qna_enabled: boolean;
  ownerName: string | null;
};

export type MyMembershipInfo = {
  id: string;
  type: string;
  class_id: string | null;
  class_title: string | null;
  total_count: number | null;
  used_count: number | null;
  weekly_limit: number | null;
  start_date: string | null;
  end_date: string | null;
};

export const studentBookingApi = {
  async getStudioFullInfo(studioId: string): Promise<StudioFullInfo | null> {
    const { data: studio, error } = await supabase
      .from("pivot_studios")
      .select(
        "id, name, location, phone, hours_text, website_url, instagram_url, kakao_url, description, policy_text, pricing_text, pricing_image_url, policy_image_url, description_image_url, rules_image_url, photos, hours_by_day, bank_account, cancel_cutoff_hours, qna_enabled, owner_id",
      )
      .eq("id", studioId)
      .maybeSingle();
    if (error) throw error;
    if (!studio) return null;
    let ownerName: string | null = null;
    if (studio.owner_id) {
      const { data: ownerProfile } = await supabase
        .from("user_profiles")
        .select("name")
        .eq("user_id", studio.owner_id)
        .maybeSingle();
      ownerName = (ownerProfile?.name as string | null) ?? null;
    }
    return {
      id: studio.id as string,
      name: studio.name as string,
      location: (studio.location as string | null) ?? null,
      phone: (studio.phone as string | null) ?? null,
      hours_text: (studio.hours_text as string | null) ?? null,
      website_url: (studio.website_url as string | null) ?? null,
      instagram_url: (studio.instagram_url as string | null) ?? null,
      kakao_url: (studio.kakao_url as string | null) ?? null,
      description: (studio.description as string | null) ?? null,
      policy_text: (studio.policy_text as string | null) ?? null,
      pricing_text: (studio.pricing_text as string | null) ?? null,
      pricing_image_url: (studio.pricing_image_url as string | null) ?? null,
      policy_image_url: (studio.policy_image_url as string | null) ?? null,
      description_image_url:
        (studio.description_image_url as string | null) ?? null,
      rules_image_url: (studio.rules_image_url as string | null) ?? null,
      photos: (studio.photos as string[] | null) ?? [],
      hours_by_day:
        (studio.hours_by_day as Record<string, string> | null) ?? null,
      bank_account: (studio.bank_account as string | null) ?? null,
      cancel_cutoff_hours: (studio.cancel_cutoff_hours as number | null) ?? 0,
      qna_enabled: (studio.qna_enabled as boolean | null) ?? false,
      ownerName,
    };
  },

  async listActiveMemberships(
    studentProfileId: string,
  ): Promise<MyMembershipInfo[]> {
    const { data, error } = await supabase
      .from("memberships")
      .select(
        "id, type, class_id, total_count, used_count, weekly_limit, start_date, end_date, classes(title)",
      )
      .eq("student_id", studentProfileId)
      .eq("status", "active")
      .order("end_date", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return ((data ?? []) as any[]).map((m) => ({
      id: m.id as string,
      type: m.type as string,
      class_id: (m.class_id as string | null) ?? null,
      class_title:
        (Array.isArray(m.classes) ? m.classes[0]?.title : m.classes?.title) ??
        null,
      total_count: (m.total_count as number | null) ?? null,
      used_count: (m.used_count as number | null) ?? null,
      weekly_limit: (m.weekly_limit as number | null) ?? null,
      start_date: (m.start_date as string | null) ?? null,
      end_date: (m.end_date as string | null) ?? null,
    }));
  },

  // All studios the user is registered as a student in (1 per student_profiles row)
  async listMyMemberships(userId: string): Promise<StudentStudioMembership[]> {
    const { data, error } = await supabase
      .from("student_profiles")
      .select(
        "id, teacher_id, studio_id, studio:pivot_studios(id, name, location)",
      )
      .eq("user_id", userId)
      .not("studio_id", "is", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as any[])
      .map((row) => {
        const studio = Array.isArray(row.studio) ? row.studio[0] : row.studio;
        if (!studio) return null;
        return {
          studentProfileId: row.id as string,
          teacherId: row.teacher_id as string,
          studio: {
            id: studio.id as string,
            name: studio.name as string,
            location: (studio.location as string | null) ?? null,
          },
        };
      })
      .filter((x): x is StudentStudioMembership => x !== null);
  },

  async listStudioClasses(studioId: string): Promise<StudioClass[]> {
    const { data, error } = await supabase
      .from("classes")
      .select("*, class_schedules(*)")
      .eq("studio_id", studioId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as StudioClass[];
  },

  // Classes the student has been assigned to by the 선생님/원장 via class_students
  async listMyEnrolledClasses(
    studentProfileId: string,
  ): Promise<StudioClass[]> {
    const { data, error } = await supabase
      .from("class_students")
      .select("classes(*, class_schedules(*))")
      .eq("student_id", studentProfileId)
      .eq("status", "active");
    if (error) throw error;
    const rows = (data ?? []) as any[];
    return rows
      .map((r) => (Array.isArray(r.classes) ? r.classes[0] : r.classes))
      .filter((c): c is StudioClass => !!c && c.is_active !== false);
  },

  async listMyBookings(
    studentProfileId: string,
    fromDate: string,
  ): Promise<ClassBooking[]> {
    const { data, error } = await supabase
      .from("class_bookings")
      .select("*")
      .eq("student_id", studentProfileId)
      .gte("booking_date", fromDate)
      .order("booking_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ClassBooking[];
  },

  async book(input: {
    classId: string;
    studentProfileId: string;
    bookingDate: string;
  }) {
    const { data, error } = await supabase
      .from("class_bookings")
      .insert({
        class_id: input.classId,
        student_id: input.studentProfileId,
        booking_date: input.bookingDate,
        status: "booked",
      })
      .select()
      .single();
    if (error) throw error;
    return data as ClassBooking;
  },

  async cancel(bookingId: string) {
    const { error } = await supabase
      .from("class_bookings")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("id", bookingId);
    if (error) throw error;
  },

  // 정원 체크 후 자동으로 booked / waitlisted 로 분기
  async bookOrWaitlist(input: {
    classId: string;
    studentProfileId: string;
    bookingDate: string;
  }): Promise<ClassBooking> {
    const { data, error } = await supabase.rpc("book_or_waitlist", {
      p_class_id: input.classId,
      p_student_profile_id: input.studentProfileId,
      p_booking_date: input.bookingDate,
    });
    if (error) throw error;
    return (Array.isArray(data) ? data[0] : data) as ClassBooking;
  },

  // 등록된 모든 클래스 + 메타 (정원 / 선생님 이름 / 클래스 스케줄)
  async listMyEnrolledClassesWithMeta(studentProfileId: string) {
    const { data, error } = await supabase
      .from("class_students")
      .select(
        "classes(id, title, description, location, capacity, is_active, teacher_id, studio_id, class_schedules(*))",
      )
      .eq("student_id", studentProfileId)
      .eq("status", "active");
    if (error) throw error;
    const rows = (data ?? []) as any[];
    const classes = rows
      .map((r) => (Array.isArray(r.classes) ? r.classes[0] : r.classes))
      .filter((c): c is StudioClass => !!c && c.is_active !== false);

    if (classes.length === 0) return { classes: [] as StudioClass[], teacherNames: new Map<string, string>() };

    // 선생님 이름 batch 조회
    const teacherIds = Array.from(new Set(classes.map((c) => c.teacher_id)));
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("user_id, name")
      .in("user_id", teacherIds);
    const teacherNames = new Map<string, string>(
      (profiles ?? []).map((p: any) => [p.user_id, p.name ?? "선생님"]),
    );

    return { classes, teacherNames };
  },

  // 특정 (class, date) 통계
  async getClassDayStats(classId: string, bookingDate: string) {
    const { data, error } = await supabase.rpc("class_day_stats", {
      p_class_id: classId,
      p_booking_date: bookingDate,
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as
      | { booked_count: number; waitlist_count: number; my_status: string | null }
      | null;
    return (
      row ?? { booked_count: 0, waitlist_count: 0, my_status: null }
    );
  },

  async listMyAttendance(studentProfileId: string, limit = 30) {
    const { data, error } = await supabase
      .from("attendance")
      .select("id, attendance_date, status, deducted, class_id, classes(title)")
      .eq("student_id", studentProfileId)
      .order("attendance_date", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data ?? []) as any[]).map((row) => ({
      id: row.id as string,
      attendance_date: row.attendance_date as string,
      status: row.status as
        | "present"
        | "late"
        | "makeup"
        | "absent"
        | "canceled",
      deducted: row.deducted as boolean,
      class_id: row.class_id as string,
      classes: Array.isArray(row.classes)
        ? (row.classes[0] as { title: string } | undefined) ?? null
        : ((row.classes as { title: string } | null) ?? null),
    }));
  },
};
