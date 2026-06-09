import type { Tables } from "./database.types";

export type UserRole = "teacher" | "student";

export type UserRoleRow = Tables<"user_roles">;
export type TeacherProfileRow = Tables<"teacher_profiles">;
export type StudentProfileRow = Tables<"student_profiles">;
export type TeacherStudentRow = Tables<"teacher_students">;
