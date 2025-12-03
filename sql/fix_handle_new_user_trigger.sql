-- handle_new_user 트리거 함수 수정
-- name unique constraint 위반 문제 해결
-- Supabase SQL Editor에서 실행하세요

-- 트리거 함수 수정: name이 없으면 빈 문자열 사용 (닉네임 설정 화면으로 리다이렉트)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id, 
    name, 
    email,
    push_notifications,
    email_notifications,
    practice_reminders,
    theme,
    language,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), ''), -- name이 없거나 빈 문자열이면 빈 문자열 사용
    NEW.email,
    true,
    false,
    true,
    'light',
    'ko',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING; -- 이미 프로필이 있으면 건너뜀
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 확인
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

