-- 01000000000 전화번호 테스트 계정 생성
-- Supabase SQL Editor에서 실행하세요
--
-- 사용법:
-- 1. 이 쿼리를 Supabase SQL Editor에서 실행
-- 2. 만약 auth.users INSERT가 실패하면, Supabase Dashboard에서 수동으로 사용자 생성 후
--    user_profiles INSERT 부분만 실행하세요

-- ============================================
-- 방법 1: auth.users에 직접 INSERT 시도
-- ============================================
-- 주의: Supabase의 auth.users 테이블은 직접 INSERT가 제한될 수 있습니다.
-- 실패하면 방법 2를 사용하세요.

-- 1-1. 기존 테스트 계정 확인
SELECT 
  id,
  phone,
  phone_confirmed_at,
  created_at
FROM auth.users
WHERE phone = '821000000000' OR phone = '+821000000000';

-- 1-2. 테스트 계정 생성 시도
-- 고정 UUID 사용 (이미 존재하면 건너뜀)
-- 주의: confirmed_at은 generated column이므로 제외
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
) 
SELECT 
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    NULL,
    '',
    NULL,
    '821000000000',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "phone", "providers": ["phone"]}'::jsonb,
    '{"name": ""}'::jsonb, -- name을 빈 문자열로 설정하여 unique constraint 위반 방지
    false,
    'authenticated'
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE phone = '821000000000' OR phone = '+821000000000'
);

-- ============================================
-- 방법 2: user_profiles만 생성 (auth.users는 이미 존재하는 경우)
-- ============================================
-- auth.users에 사용자가 이미 있거나, Dashboard에서 수동 생성한 경우
-- 아래 쿼리로 user_profiles만 생성/업데이트

DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- 사용자 ID 조회 (phone으로)
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE phone = '821000000000' OR phone = '+821000000000'
    LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE '⚠️  auth.users에 전화번호 821000000000 사용자를 찾을 수 없습니다.';
        RAISE NOTICE '   Supabase Dashboard > Authentication > Users에서 수동으로 사용자를 생성하거나,';
        RAISE NOTICE '   앱에서 01000000000으로 OTP를 요청하여 계정을 생성한 후 이 쿼리를 다시 실행하세요.';
    ELSE
        RAISE NOTICE '✅ 테스트 사용자 ID: %', test_user_id;

        -- user_profiles에 프로필 생성/업데이트
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

        RAISE NOTICE '✅ user_profiles 프로필 생성/업데이트 완료';
    END IF;
END $$;

-- ============================================
-- 최종 확인
-- ============================================
SELECT 
    u.id as user_id,
    u.phone,
    u.phone_confirmed_at,
    u.created_at as user_created_at,
    p.name,
    p.phone as profile_phone,
    p.created_at as profile_created_at,
    CASE 
        WHEN u.id IS NOT NULL AND p.user_id IS NOT NULL THEN '✅ 계정 및 프로필 생성 완료'
        WHEN u.id IS NOT NULL AND p.user_id IS NULL THEN '⚠️  계정은 있으나 프로필 없음'
        ELSE '❌ 계정 없음'
    END as status
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.phone = '821000000000' OR u.phone = '+821000000000';

-- ============================================
-- 참고: Supabase Dashboard에서 수동 생성 방법
-- ============================================
-- 1. Supabase Dashboard 접속
-- 2. Authentication > Users 메뉴로 이동
-- 3. "Add user" 버튼 클릭
-- 4. Phone: +821000000000 입력
-- 5. Email: (비워둠)
-- 6. Auto Confirm User: 체크
-- 7. 생성 후 위의 user_profiles INSERT 쿼리 실행

