-- 테스트 사용자 강제 삭제 및 재생성

-- 1. 현재 상태 확인
SELECT '현재 auth.users 상태' as status, COUNT(*) as count FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';
SELECT '현재 user_profiles 상태' as status, COUNT(*) as count FROM user_profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';
SELECT '현재 practice_records 상태' as status, COUNT(*) as count FROM practice_records WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- 2. 강제 삭제 (CASCADE 옵션 사용)
-- practice_records 먼저 삭제
DELETE FROM practice_records WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- user_profiles 삭제
DELETE FROM user_profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- auth.users 삭제
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. 삭제 확인
SELECT '삭제 후 auth.users 상태' as status, COUNT(*) as count FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';
SELECT '삭제 후 user_profiles 상태' as status, COUNT(*) as count FROM user_profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';
SELECT '삭제 후 practice_records 상태' as status, COUNT(*) as count FROM practice_records WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- 4. 새로운 UUID로 테스트 사용자 생성
INSERT INTO auth.users (
    id,
    email,
    phone,
    created_at,
    updated_at,
    email_confirmed_at,
    phone_confirmed_at
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    'test@hillyheally.com',
    '821000000000',
    NOW(),
    NOW(),
    NOW(),
    NOW()
);

-- 5. 새로운 UUID로 사용자 프로필 생성
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
    '00000000-0000-0000-0000-000000000002',
    '테스트 사용자',
    '821000000000',
    true,
    false,
    true,
    'light',
    'ko',
    NOW(),
    NOW()
);

-- 6. 새로운 UUID로 수련 기록 생성
INSERT INTO practice_records (
    id,
    user_id,
    title,
    asanas,
    states,
    memo,
    photos,
    practice_time,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002',
    '테스트 수련 기록',
    '[{"id": "asana1", "name": "아도무카스바나사나", "image_number": "001"}]',
    '["energized", "focused"]',
    '심사용 테스트 수련 기록입니다.',
    '[]',
    NOW(),
    NOW(),
    NOW()
);

-- 7. 최종 확인
SELECT '새 사용자 생성 확인' as status, id, email, phone FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000002';
SELECT '새 프로필 생성 확인' as status, user_id, name, phone FROM user_profiles WHERE user_id = '00000000-0000-0000-0000-000000000002';
SELECT '새 수련기록 생성 확인' as status, COUNT(*) as count FROM practice_records WHERE user_id = '00000000-0000-0000-0000-000000000002';
