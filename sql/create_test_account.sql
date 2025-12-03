-- test@onmatout.com 테스트 계정 생성
-- Supabase SQL Editor에서 실행하세요

-- 주의: Supabase의 auth.users 테이블은 직접 INSERT할 수 없습니다.
-- 대신 Supabase Dashboard에서 수동으로 계정을 생성하거나,
-- 앱에서 OTP를 요청하여 계정을 생성해야 합니다.

-- 1. 기존 테스트 계정이 있는지 확인
SELECT 
  id,
  email,
  phone,
  created_at,
  confirmed_at
FROM auth.users
WHERE email = 'test@onmatout.com';

-- 2. 테스트 계정이 없으면, Supabase Dashboard에서 수동으로 생성하거나
--    앱에서 test@onmatout.com으로 OTP를 요청하여 계정을 생성해야 합니다.

-- 3. 계정 생성 후 user_profiles 테이블에 프로필 생성
-- (계정이 생성되면 아래 쿼리를 실행하여 프로필을 생성할 수 있습니다)

-- 사용자 ID를 확인한 후 아래 쿼리를 실행하세요
-- INSERT INTO user_profiles (user_id, name, push_notifications, email_notifications, practice_reminders, theme, language)
-- VALUES (
--   'YOUR_USER_ID_HERE', -- auth.users에서 확인한 사용자 ID
--   '', -- 닉네임은 빈 문자열로 설정 (닉네임 설정 화면으로 리다이렉트)
--   true,
--   false,
--   true,
--   'light',
--   'ko'
-- )
-- ON CONFLICT (user_id) DO NOTHING;

-- 4. 확인 쿼리
SELECT 
  u.id,
  u.email,
  u.confirmed_at,
  p.name,
  p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.email = 'test@onmatout.com';

