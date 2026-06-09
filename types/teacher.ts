import type { Tables, TablesInsert, TablesUpdate } from "./database.types";

export type Class = Tables<"classes">;
export type ClassInsert = TablesInsert<"classes">;
export type ClassUpdate = TablesUpdate<"classes">;

export type ClassSchedule = Tables<"class_schedules">;
export type ClassScheduleInsert = TablesInsert<"class_schedules">;

export type ClassStudent = Tables<"class_students">;

export type StudentProfile = Tables<"student_profiles">;
export type StudentProfileInsert = TablesInsert<"student_profiles">;
export type StudentProfileUpdate = TablesUpdate<"student_profiles">;

export type Membership = Tables<"memberships">;
export type MembershipInsert = TablesInsert<"memberships">;
export type MembershipType = "count" | "period_weekly" | "period_unlimited";

export type Attendance = Tables<"attendance">;
export type AttendanceInsert = TablesInsert<"attendance">;
export type AttendanceStatus =
  | "present"
  | "late"
  | "makeup"
  | "absent"
  | "canceled";

export type Routine = Tables<"routines">;
export type RoutineInsert = TablesInsert<"routines">;
export type RoutineItem = Tables<"routine_items">;
export type RoutineShare = Tables<"routine_shares">;

export const DAY_OF_WEEK_LABELS_KO: Record<number, string> = {
  0: "일",
  1: "월",
  2: "화",
  3: "수",
  4: "목",
  5: "금",
  6: "토",
};
