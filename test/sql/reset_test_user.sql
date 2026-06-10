-- ─────────────────────────────────────────────────────────────
-- 신규 온보딩 테스트 유저 초기화 (dev 전용)
--
-- 대상: 01011111111 / 코드 000000 / 비번 Test1234!
--       auth.users.id = 3c292326-0227-411d-ae4f-0e71d718e30a
--
-- 사용: Supabase(dev) SQL Editor 에 붙여넣고 실행하면
--       역할/프로필/매칭이 모두 지워져 "역할 선택"부터 다시 시작합니다.
--       (auth.users 계정 자체와 비밀번호는 유지 → 다시 로그인 가능)
--
-- ⚠️ dev 에서만 사용. 운영(main) 에서는 실행하지 말 것.
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_user uuid := '3c292326-0227-411d-ae4f-0e71d718e30a';
BEGIN
  -- 역할 / 프로필
  DELETE FROM public.user_roles    WHERE user_id = v_user;
  DELETE FROM public.user_profiles WHERE user_id = v_user;

  -- 학생으로 매칭했던 경우: 연결 해제 (지도자가 만든 수련생 카드는 보존)
  UPDATE public.student_profiles
     SET user_id = NULL, invite_code_used_at = NULL
   WHERE user_id = v_user;

  -- 지도자/원장으로 진행했던 경우
  DELETE FROM public.studio_teachers WHERE teacher_id = v_user;
  DELETE FROM public.pivot_studios   WHERE owner_id  = v_user;
  DELETE FROM public.teacher_profiles WHERE user_id  = v_user;

  -- 알림 / 푸시 토큰 / AI 세션 (있다면)
  DELETE FROM public.notifications     WHERE user_id = v_user;
  DELETE FROM public.user_push_tokens  WHERE user_id = v_user;
  DELETE FROM public.ai_answer_logs    WHERE user_id = v_user;
  DELETE FROM public.ai_sessions       WHERE user_id = v_user;

  RAISE NOTICE '테스트 유저 % 초기화 완료 (역할 선택부터 다시 시작)', v_user;
END $$;
