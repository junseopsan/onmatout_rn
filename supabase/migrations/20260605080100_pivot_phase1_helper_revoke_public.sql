-- ONMATOUT Pivot Phase 1: RLS helper 함수 PUBLIC EXECUTE 권한 회수
-- 작성일: 2026-06-05
--
-- 이전 80000 마이그레이션에서 anon, authenticated 에 대한 REVOKE 만 했는데,
-- PostgreSQL 함수는 기본적으로 PUBLIC role 에 EXECUTE 가 부여되고
-- anon / authenticated 는 PUBLIC 을 상속하므로 PUBLIC 까지 회수해야 실제로 차단된다.
--
-- service_role 과 postgres 는 별도 GRANT 가 있어 영향 없음.
-- RLS 정책 내부 함수 호출은 정책 평가 시 postgres role 컨텍스트라 영향 없음.

REVOKE EXECUTE ON FUNCTION public.is_my_student(uuid)              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_my_student_profile(uuid)      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_teacher_of_class(uuid)        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_student_in_class(uuid)        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_routine_shared_with_me(uuid)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_thread(uuid)          FROM PUBLIC;
