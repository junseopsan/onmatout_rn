-- ONMATOUT Pivot Phase 1: 함수 보안 하드닝
-- 작성일: 2026-06-05
--
-- 두 가지를 정리:
--   1) Phase1 schema 에서 만든 트리거 함수 3개의 search_path 고정
--      (advisor: function_search_path_mutable)
--   2) RLS helper 함수 6개의 PostgREST RPC 노출 차단
--      (advisor: anon/authenticated_security_definer_function_executable)
--
-- RPC 차단해도 RLS 정책 내부 호출은 영향 없음 — 정책 평가 시 함수는 postgres role 로 실행되며
-- REVOKE EXECUTE 는 anon/authenticated 의 직접 호출만 막는다.

-- =========================================
-- 1) search_path 고정 (트리거용)
-- =========================================

ALTER FUNCTION public.set_updated_at()                SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_invite_code()          SET search_path = public, pg_temp;
ALTER FUNCTION public.set_student_invite_code()       SET search_path = public, pg_temp;

-- =========================================
-- 2) RLS helper RPC 노출 차단
-- =========================================

REVOKE EXECUTE ON FUNCTION public.is_my_student(uuid)              FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_my_student_profile(uuid)      FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_teacher_of_class(uuid)        FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_student_in_class(uuid)        FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_routine_shared_with_me(uuid)  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_thread(uuid)          FROM anon, authenticated;
