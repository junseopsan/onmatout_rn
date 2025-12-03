-- 01000000000 전화번호 테스트 계정 생성
-- Supabase SQL Editor에서 실행하세요
-- 
-- 주의: Supabase의 auth.users 테이블은 직접 INSERT가 제한될 수 있습니다.
-- 만약 INSERT가 실패하면, Supabase Dashboard의 Authentication > Users에서
-- 수동으로 사용자를 생성하거나, 앱에서 실제로 OTP를 요청하여 계정을 생성해야 합니다.

-- 1. 기존 테스트 계정 확인
SELECT 
  id,
  email,
  phone,
  created_at,
  phone_confirmed_at
FROM auth.users
WHERE phone = '821000000000' OR phone = '+821000000000';

-- 2. user_profiles에서 기존 프로필 확인
SELECT 
  user_id,
  name,
  phone,
  created_at
FROM user_profiles
WHERE phone = '821000000000';

-- 3. 테스트 계정 생성 (auth.users)
-- 주의: 이 쿼리가 실패할 수 있습니다. 실패하면 Supabase Dashboard에서 수동 생성하세요.
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    phone,
    phone_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    gen_random_uuid(), -- 또는 고정 UUID 사용: '00000000-0000-0000-0000-000000000001'
    '00000000-0000-0000-0000-000000000000', -- Supabase 인스턴스 ID (필요시 수정)
    NULL, -- 이메일 없음
    '', -- 비밀번호 없음 (OTP 사용)
    NULL,
    '821000000000', -- 국제 형식 전화번호
    NOW(), -- 전화번호 확인됨
    NOW(),
    NOW(),
    '{"provider": "phone", "providers": ["phone"]}'::jsonb,
    '{"name": ""}'::jsonb, -- name을 빈 문자열로 설정하여 unique constraint 위반 방지
    false,
    'authenticated'
) ON CONFLICT (id) DO NOTHING
RETURNING id, phone, created_at;

-- 4. 생성된 사용자 ID 확인
-- 위 쿼리에서 반환된 ID를 사용하거나, 아래 쿼리로 확인
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- 사용자 ID 조회
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE phone = '821000000000'
    LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE '테스트 사용자를 찾을 수 없습니다. auth.users에 사용자를 먼저 생성해주세요.';
    ELSE
        RAISE NOTICE '테스트 사용자 ID: %', test_user_id;

        -- 5. user_profiles에 프로필 생성
        INSERT INTO user_profiles (
            user_id,
            name,
            phone,
            push_notifications,
            email_notifications,
            practice_reminders,
            theme,
            language,
            created_at,
            updated_at
        ) VALUES (
            test_user_id,
            '', -- 닉네임은 빈 문자열 (닉네임 설정 화면으로 리다이렉트)
            '821000000000',
            true,
            false,
            true,
            'light',
            'ko',
            NOW(),
            NOW()
        ) ON CONFLICT (user_id) DO UPDATE SET
            phone = EXCLUDED.phone,
            updated_at = NOW();

        RAISE NOTICE 'user_profiles 프로필 생성/업데이트 완료';
    END IF;
END $$;

-- 6. 최종 확인
SELECT 
    u.id as user_id,
    u.phone,
    u.phone_confirmed_at,
    u.created_at as user_created_at,
    p.name,
    p.phone as profile_phone,
    p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.phone = '821000000000';

-- 만약 auth.users에 직접 INSERT가 실패하는 경우:
-- 1. Supabase Dashboard > Authentication > Users에서 수동으로 사용자 생성
--    - Phone: +821000000000
--    - Email: (비워둠)
-- 2. 또는 앱에서 01000000000으로 OTP를 요청하여 계정 생성
-- 3. 계정 생성 후 위의 user_profiles INSERT 쿼리만 실행

