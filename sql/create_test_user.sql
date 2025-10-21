-- 심사용 테스트 계정 생성

-- 1. 테스트용 사용자 프로필 생성 (01000000000)
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
    'test-user-01000000000',
    '테스트 사용자',
    '01000000000',
    true,
    false,
    true,
    'light',
    'ko',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- 2. 테스트용 수련 기록 생성 (샘플 데이터)
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
    'test-user-01000000000',
    '테스트 수련 기록',
    '[{"id": "asana1", "name": "아도무카스바나사나", "image_number": "001"}]',
    '["energized", "focused"]',
    '심사용 테스트 수련 기록입니다.',
    '[]',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- 3. 테스트 계정 확인
SELECT 
    user_id,
    name,
    phone,
    created_at
FROM user_profiles 
WHERE phone = '01000000000';

-- 4. 테스트 수련 기록 확인
SELECT 
    id,
    user_id,
    title,
    memo,
    created_at
FROM practice_records 
WHERE user_id = 'test-user-01000000000';
