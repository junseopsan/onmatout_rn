import { supabase } from "../supabase";
import type {
  Membership,
  StudentProfile,
} from "../../types/teacher";

export type StudentTeacherLink = {
  studentProfile: StudentProfile;
  teacherName: string | null;
  activeMembership: Membership | null;
};

export type MatchCandidate = {
  studentProfileId: string;
  studentName: string;
  teacherUserId: string;
  teacherStudioName: string | null;
  inviteCode: string;
};

export type StudioJoinResult = {
  studioId: string;
  studioName: string;
  studentProfileId: string;
  matched: boolean; // 미가입 명단과 전화 매칭으로 연결됨
  already: boolean; // 이미 이 요가원 멤버였음
  created: boolean; // 신규 수련생으로 생성됨
};

// 요가원 단위 초대코드(OMS-) 형식 확인. 초대는 QR/링크로만 들어오며 코드는 항상 OMS- 다.
export function isStudioInviteCode(code: string): boolean {
  return /^OMS-/i.test(code.trim());
}

export type StudentTeacherDetail = StudentTeacherLink & {
  attendance: {
    id: string;
    attendance_date: string;
    status: string;
    deducted: boolean;
  }[];
  allMemberships: Membership[];
};

export const studentApi = {
  async getTeacherDetail(
    userId: string,
    studentProfileId: string,
  ): Promise<StudentTeacherDetail | null> {
    const { data: profile, error: pErr } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("id", studentProfileId)
      .eq("user_id", userId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!profile) return null;

    const [teacherRes, memberships, attendance] = await Promise.all([
      supabase
        .from("teacher_profiles")
        .select("studio_name")
        .eq("user_id", profile.teacher_id)
        .maybeSingle(),
      supabase
        .from("memberships")
        .select("*")
        .eq("student_id", studentProfileId)
        .order("end_date", { ascending: false }),
      supabase
        .from("attendance")
        .select("id, attendance_date, status, deducted")
        .eq("student_id", studentProfileId)
        .order("attendance_date", { ascending: false })
        .limit(50),
    ]);

    const teacherName = teacherRes.data?.studio_name ?? null;
    const allMemberships = (memberships.data ?? []) as Membership[];
    const activeMembership =
      allMemberships.find((m) => m.status === "active") ?? null;

    return {
      studentProfile: profile as StudentProfile,
      teacherName,
      activeMembership,
      allMemberships,
      attendance: (attendance.data ?? []) as any[],
    };
  },

  async listMyTeachers(userId: string): Promise<StudentTeacherLink[]> {
    const { data: profiles, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;

    if (!profiles || profiles.length === 0) return [];

    const teacherIds = Array.from(new Set(profiles.map((p) => p.teacher_id)));
    const profileIds = profiles.map((p) => p.id);

    const [teachersRes, membershipsRes] = await Promise.all([
      supabase
        .from("teacher_profiles")
        .select("user_id, studio_name")
        .in("user_id", teacherIds),
      supabase
        .from("memberships")
        .select("*")
        .in("student_id", profileIds)
        .eq("status", "active"),
    ]);

    const teacherMap = new Map(
      (teachersRes.data ?? []).map((t) => [t.user_id, t.studio_name ?? null]),
    );
    const membershipMap = new Map<string, Membership>();
    for (const m of membershipsRes.data ?? []) {
      const existing = membershipMap.get(m.student_id);
      if (!existing || (m.end_date ?? "") > (existing.end_date ?? "")) {
        membershipMap.set(m.student_id, m as Membership);
      }
    }

    return profiles.map((p) => ({
      studentProfile: p as StudentProfile,
      teacherName: teacherMap.get(p.teacher_id) ?? null,
      activeMembership: membershipMap.get(p.id) ?? null,
    }));
  },

  // 가입 직후 phone 기반 자동 매칭: user_id 가 NULL 인 student_profiles 중 동일 phone 찾기
  async findMatchByPhone(phone: string): Promise<MatchCandidate[]> {
    const variants = phonePatterns(phone);
    if (variants.length === 0) return [];

    const { data, error } = await supabase
      .from("student_profiles")
      .select("id, name, phone, teacher_id, invite_code, user_id")
      .is("user_id", null)
      .in("phone", variants);
    if (error) throw error;
    if (!data || data.length === 0) return [];

    const teacherIds = Array.from(new Set(data.map((d) => d.teacher_id)));
    const { data: teachers } = await supabase
      .from("teacher_profiles")
      .select("user_id, studio_name")
      .in("user_id", teacherIds);
    const studioMap = new Map(
      (teachers ?? []).map((t) => [t.user_id, t.studio_name ?? null]),
    );

    return data.map((d) => ({
      studentProfileId: d.id,
      studentName: d.name,
      teacherUserId: d.teacher_id,
      teacherStudioName: studioMap.get(d.teacher_id) ?? null,
      inviteCode: d.invite_code,
    }));
  },

  async acceptMatch(userId: string, studentProfileId: string) {
    const { error } = await supabase
      .from("student_profiles")
      .update({
        user_id: userId,
        invite_code_used_at: new Date().toISOString(),
      })
      .eq("id", studentProfileId);
    if (error) throw error;
  },

  // 요가원 단위 초대코드(OMS-)로 가입: 서버에서 전화 자동매칭 또는 신규 수련생 생성
  async joinStudioByCode(
    code: string,
    userId: string,
    phone: string | null,
  ): Promise<StudioJoinResult> {
    const variants = phone ? phonePatterns(phone) : [];
    const { data, error } = await supabase.rpc("join_studio_by_code", {
      p_code: code.trim(),
      p_user_id: userId,
      p_phone_variants: variants,
    });
    if (error) throw error;
    const r = data as Record<string, unknown>;
    return {
      studioId: String(r.studio_id),
      studioName: String(r.studio_name ?? ""),
      studentProfileId: String(r.student_profile_id),
      matched: !!r.matched,
      already: !!r.already,
      created: !!r.created,
    };
  },
};

function formatHyphen(digits: string): string {
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

// 다양한 phone 표기 변형 생성 — 010 / 8210 / 하이픈 / + prefix
function phonePatterns(input: string): string[] {
  const raw = input.replace(/[^0-9]/g, "");
  if (!raw) return [];

  // 핵심 형태 (Korean): 010xxxxxxxx (11자리) 또는 82와 시작 (821xxxxxxxx 또는 82010xxxxxxxx)
  let local: string; // 010xxxxxxxx
  if (raw.startsWith("82")) {
    const rest = raw.slice(2);
    local = rest.startsWith("0") ? rest : "0" + rest;
  } else if (raw.startsWith("0")) {
    local = raw;
  } else {
    local = "0" + raw;
  }

  const country = "82" + local.slice(1); // 821xxxxxxxx
  const countryNoZero = "82" + local.slice(1); // 동일

  const variants = new Set<string>([
    local,
    raw,
    country,
    countryNoZero,
    "+" + country,
    formatHyphen(local),
  ]);

  // 흔한 변형: 공백
  variants.add(local.replace(/^(\d{3})(\d{4})(\d{4})$/, "$1 $2 $3"));

  return Array.from(variants).filter((v) => v.length >= 9);
}
