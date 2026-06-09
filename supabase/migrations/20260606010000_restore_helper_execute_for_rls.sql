-- RLS 정책 내부에서 호출되는 helper 함수들의 EXECUTE 권한을 authenticated 에 복구.
-- 함수 자체는 SECURITY DEFINER + auth.uid() 검증으로 안전.
-- 이전 마이그레이션 (helper_revoke_public, function_hardening) 에서 너무 강하게 REVOKE 했더니
-- 정책 평가 시 RLS 가 함수 호출에 권한 없음 → 403 발생. 복구 필요.

GRANT EXECUTE ON FUNCTION public.is_my_student(uuid)              TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_student_profile(uuid)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher_of_class(uuid)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_student_in_class(uuid)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_routine_shared_with_me(uuid)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_thread(uuid)          TO authenticated;
