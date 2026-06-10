import { supabase } from "../supabase";
import type {
  Attendance,
  Class,
  ClassInsert,
  ClassSchedule,
  ClassScheduleInsert,
  ClassStudent,
  ClassUpdate,
  Membership,
  MembershipInsert,
  Routine,
  RoutineInsert,
  RoutineItem,
  RoutineShare,
  StudentProfile,
  StudentProfileInsert,
  StudentProfileUpdate,
} from "../../types/teacher";
import type { TablesUpdate } from "../../types/database.types";

export type TeacherProfileUpdate = TablesUpdate<"teacher_profiles">;

export type AttendanceWithClass = Attendance & {
  classes: {
    title: string;
    class_schedules: {
      day_of_week: number;
      start_time: string;
      end_time: string;
    }[];
  } | null;
};
export type TeacherProfile = {
  user_id: string;
  studio_name: string | null;
  bio: string | null;
  location: string | null;
  cancellation_hours_before: number;
};

export type StudentProfileWithSummary = StudentProfile & {
  active_membership?: Membership | null;
  recent_attendance_count?: number;
};

export const teacherApi = {
  async listMyStudents(teacherId: string, studioId?: string | null) {
    let q = supabase
      .from("student_profiles")
      .select("*")
      .eq("teacher_id", teacherId);
    if (studioId) q = q.eq("studio_id", studioId);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as StudentProfile[];
  },

  async getStudent(studentProfileId: string) {
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("id", studentProfileId)
      .single();
    if (error) throw error;
    return data as StudentProfile;
  },

  async createStudent(input: StudentProfileInsert) {
    const { data, error } = await supabase
      .from("student_profiles")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as StudentProfile;
  },

  async listMyClasses(teacherId: string, studioId?: string | null) {
    let q = supabase
      .from("classes")
      .select("*, class_schedules(*)")
      .eq("teacher_id", teacherId);
    if (studioId) q = q.eq("studio_id", studioId);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as (Class & { class_schedules: ClassSchedule[] })[];
  },

  async getStudentMembership(studentProfileId: string) {
    const { data, error } = await supabase
      .from("memberships")
      .select("*")
      .eq("student_id", studentProfileId)
      .eq("status", "active")
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as Membership | null;
  },

  async listStudentAttendance(studentProfileId: string, limit = 20) {
    const { data, error } = await supabase
      .from("attendance")
      .select(
        "*, classes:class_id(title, class_schedules(day_of_week, start_time, end_time))",
      )
      .eq("student_id", studentProfileId)
      .order("attendance_date", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AttendanceWithClass[];
  },

  async getClass(classId: string) {
    const { data, error } = await supabase
      .from("classes")
      .select("*, class_schedules(*)")
      .eq("id", classId)
      .single();
    if (error) throw error;
    return data as Class & { class_schedules: ClassSchedule[] };
  },

  async createClass(
    input: ClassInsert,
    schedules: { day_of_week: number; start_time: string; end_time: string }[],
  ) {
    const { data: created, error } = await supabase
      .from("classes")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    const cls = created as Class;
    if (schedules.length > 0) {
      const scheduleRows: ClassScheduleInsert[] = schedules.map((s) => ({
        class_id: cls.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
      }));
      const { error: schedErr } = await supabase
        .from("class_schedules")
        .insert(scheduleRows);
      if (schedErr) throw schedErr;
    }
    return cls;
  },

  async listClassStudents(classId: string) {
    const { data, error } = await supabase
      .from("class_students")
      .select("*, student_profiles(*)")
      .eq("class_id", classId)
      .order("joined_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as (ClassStudent & {
      student_profiles: StudentProfile;
    })[];
  },

  async assignStudentsToClass(classId: string, studentIds: string[]) {
    if (studentIds.length === 0) return;
    const rows = studentIds.map((sid) => ({
      class_id: classId,
      student_id: sid,
      status: "active" as const,
    }));
    const { error } = await supabase
      .from("class_students")
      .upsert(rows, { onConflict: "class_id,student_id" });
    if (error) throw error;
  },

  async createMembership(input: MembershipInsert) {
    const { data, error } = await supabase
      .from("memberships")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as Membership;
  },

  async listClassAttendance(classId: string, date: string) {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("class_id", classId)
      .eq("attendance_date", date);
    if (error) throw error;
    return (data ?? []) as Attendance[];
  },

  async markAttendance(input: {
    classId: string;
    studentId: string;
    date: string;
    status: Attendance["status"];
    memo?: string | null;
  }) {
    const { data, error } = await supabase.rpc("mark_attendance", {
      p_class_id: input.classId,
      p_student_id: input.studentId,
      p_attendance_date: input.date,
      p_status: input.status,
      p_source: "teacher_manual",
      p_memo: input.memo ?? null,
    });
    if (error) throw error;
    return data as Attendance;
  },

  async cancelAttendance(attendanceId: string, memo?: string | null) {
    const { data, error } = await supabase.rpc("cancel_attendance", {
      p_attendance_id: attendanceId,
      p_memo: memo ?? null,
    });
    if (error) throw error;
    return data as Attendance;
  },

  // 출석 해제: 행 삭제 + 차감 복구 (같은 상태 재탭 토글)
  async unmarkAttendance(input: {
    classId: string;
    studentId: string;
    date: string;
  }) {
    const { error } = await supabase.rpc("unmark_attendance", {
      p_class_id: input.classId,
      p_student_id: input.studentId,
      p_attendance_date: input.date,
    });
    if (error) throw error;
  },

  async listMyRoutines(teacherId: string) {
    const [{ data, error }, { data: profile }] = await Promise.all([
      supabase
        .from("routines")
        .select(
          "*, routine_items(count), routine_likes(user_id), preview:routine_items(order_index, asanas(id, sanskrit_name_kr, image_number))",
        )
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false }),
      supabase
        .from("teacher_profiles")
        .select("studio_name")
        .eq("user_id", teacherId)
        .maybeSingle(),
    ]);
    if (error) throw error;
    const studioName = profile?.studio_name ?? null;
    return (data ?? []).map((r: any) => {
      const likes: { user_id: string }[] = r.routine_likes ?? [];
      return {
        ...r,
        teacher_studio_name: studioName,
        like_count: likes.length,
        liked_by_me: likes.some((l) => l.user_id === teacherId),
      };
    }) as (Routine & {
      routine_items: { count: number }[];
      preview: {
        order_index: number;
        asanas: {
          id: string;
          sanskrit_name_kr: string;
          image_number: string | null;
        } | null;
      }[];
      teacher_studio_name: string | null;
      like_count: number;
      liked_by_me: boolean;
      is_draft: boolean;
      visibility: string;
    })[];
  },

  async toggleRoutineLike(
    routineId: string,
    userId: string,
  ): Promise<{ liked: boolean; like_count: number }> {
    const { data: existing, error: selErr } = await supabase
      .from("routine_likes")
      .select("user_id")
      .eq("routine_id", routineId)
      .eq("user_id", userId)
      .maybeSingle();
    if (selErr) throw selErr;
    if (existing) {
      const { error } = await supabase
        .from("routine_likes")
        .delete()
        .eq("routine_id", routineId)
        .eq("user_id", userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("routine_likes")
        .insert({ routine_id: routineId, user_id: userId });
      if (error) throw error;
    }
    const { count } = await supabase
      .from("routine_likes")
      .select("user_id", { count: "exact", head: true })
      .eq("routine_id", routineId);
    return { liked: !existing, like_count: count ?? 0 };
  },

  async getRoutine(routineId: string) {
    const { data: routine, error: rErr } = await supabase
      .from("routines")
      .select("*")
      .eq("id", routineId)
      .single();
    if (rErr) throw rErr;
    const { data: items, error: iErr } = await supabase
      .from("routine_items")
      .select("*, asanas(*)")
      .eq("routine_id", routineId)
      .order("order_index", { ascending: true });
    if (iErr) throw iErr;
    return {
      routine: routine as Routine,
      items: (items ?? []) as (RoutineItem & {
        asanas: {
          id: string;
          sanskrit_name_kr: string;
          sanskrit_name_en: string;
          image_number: string | null;
          category_name_en: string | null;
        };
      })[],
    };
  },

  async createRoutine(
    input: RoutineInsert & { is_draft?: boolean },
    items: { asana_id: string; duration_seconds?: number | null; memo?: string | null }[],
  ) {
    const { data: created, error } = await supabase
      .from("routines")
      .insert(input as any)
      .select()
      .single();
    if (error) throw error;
    const routine = created as Routine;
    if (items.length > 0) {
      const rows = items.map((it, idx) => ({
        routine_id: routine.id,
        asana_id: it.asana_id,
        order_index: idx,
        duration_seconds: it.duration_seconds ?? null,
        memo: it.memo ?? null,
      }));
      const { error: itemErr } = await supabase.from("routine_items").insert(rows);
      if (itemErr) throw itemErr;
    }
    return routine;
  },

  async shareRoutine(input: {
    routineId: string;
    teacherId: string;
    classId?: string | null;
    studentId?: string | null;
  }) {
    const { error } = await supabase.from("routine_shares").insert({
      routine_id: input.routineId,
      teacher_id: input.teacherId,
      class_id: input.classId ?? null,
      student_id: input.studentId ?? null,
    });
    if (error) throw error;
  },

  async setRoutineVisibility(routineId: string, visibility: "private" | "public") {
    const { error } = await supabase
      .from("routines")
      .update({ visibility })
      .eq("id", routineId);
    if (error) throw error;
  },

  async updateRoutine(
    routineId: string,
    patch: {
      title?: string;
      description?: string | null;
      visibility?: "private" | "public";
      is_draft?: boolean;
    },
  ) {
    const { error } = await supabase
      .from("routines")
      .update({ ...patch, updated_at: new Date().toISOString() } as any)
      .eq("id", routineId);
    if (error) throw error;
  },

  async replaceRoutineItems(
    routineId: string,
    items: {
      asana_id: string;
      duration_seconds?: number | null;
      memo?: string | null;
    }[],
  ) {
    const { error: delErr } = await supabase
      .from("routine_items")
      .delete()
      .eq("routine_id", routineId);
    if (delErr) throw delErr;
    if (items.length === 0) return;
    const rows = items.map((it, idx) => ({
      routine_id: routineId,
      asana_id: it.asana_id,
      order_index: idx,
      duration_seconds: it.duration_seconds ?? null,
      memo: it.memo ?? null,
    }));
    const { error } = await supabase.from("routine_items").insert(rows);
    if (error) throw error;
  },

  async cloneRoutine(sourceRoutineId: string, newTitle?: string) {
    const { data, error } = await supabase.rpc("clone_routine", {
      p_source_routine_id: sourceRoutineId,
      p_new_title: newTitle ?? undefined,
    });
    if (error) throw error;
    return data as string;
  },

  async deleteRoutine(routineId: string) {
    // 의존 행 정리 후 본체 삭제 (FK cascade 미설정 대비)
    await supabase.from("routine_shares").delete().eq("routine_id", routineId);
    await supabase.from("routine_items").delete().eq("routine_id", routineId);
    const { error } = await supabase
      .from("routines")
      .delete()
      .eq("id", routineId);
    if (error) throw error;
  },

  async getMyTeacherProfile(userId: string) {
    const { data, error } = await supabase
      .from("teacher_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data as TeacherProfile | null;
  },

  async upsertTeacherProfile(input: {
    userId: string;
    studio_name?: string | null;
    bio?: string | null;
    location?: string | null;
    cancellation_hours_before?: number;
  }) {
    const { error } = await supabase
      .from("teacher_profiles")
      .upsert(
        {
          user_id: input.userId,
          studio_name: input.studio_name ?? null,
          bio: input.bio ?? null,
          location: input.location ?? null,
          cancellation_hours_before: input.cancellation_hours_before ?? 24,
        },
        { onConflict: "user_id" },
      );
    if (error) throw error;
  },

  async updateClass(classId: string, input: ClassUpdate) {
    const { data, error } = await supabase
      .from("classes")
      .update(input)
      .eq("id", classId)
      .select()
      .single();
    if (error) throw error;
    return data as Class;
  },

  async updateStudent(studentProfileId: string, input: StudentProfileUpdate) {
    const { data, error } = await supabase
      .from("student_profiles")
      .update(input)
      .eq("id", studentProfileId)
      .select()
      .single();
    if (error) throw error;
    return data as StudentProfile;
  },

  // 클래스/날짜별 신청자 + 대기자 명단
  async listClassBookingsForDate(classId: string, date: string) {
    const { data, error } = await supabase
      .from("class_bookings")
      .select("*, student:student_profiles!class_bookings_student_id_fkey(id, name, phone)")
      .eq("class_id", classId)
      .eq("booking_date", date)
      .in("status", ["booked", "waitlisted", "attended"])
      .order("status", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as any[];
  },

  async listRoutineShares(routineId: string) {
    const { data, error } = await supabase
      .from("routine_shares")
      .select("*, classes(title), student_profiles(name)")
      .eq("routine_id", routineId)
      .order("shared_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as (RoutineShare & {
      classes: { title: string } | null;
      student_profiles: { name: string } | null;
    })[];
  },
};
