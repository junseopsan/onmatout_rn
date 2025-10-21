-- 테스트 사용자 삭제 및 재생성 (올바른 전화번호로)

-- 1. 관련 데이터 먼저 삭제 (외래키 제약조건 때문에)
DELETE FROM practice_records WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM user_profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- 2. auth.users에서 테스트 사용자 삭제
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. 삭제 확인
SELECT 'auth.users 삭제 확인' as status, COUNT(*) as count FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';
SELECT 'user_profiles 삭제 확인' as status, COUNT(*) as count FROM user_profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';
SELECT 'practice_records 삭제 확인' as status, COUNT(*) as count FROM practice_records WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- 4. 올바른 전화번호로 테스트 사용자 재생성
INSERT INTO auth.users (
    id,
    email,
    phone,
    created_at,
    updated_at,
    email_confirmed_at,
    phone_confirmed_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test@hillyheally.com',
    '821000000000',
    NOW(),
    NOW(),
    NOW(),
    NOW()
);

-- 5. 테스트용 사용자 프로필 생성 (올바른 전화번호)
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
    '00000000-0000-0000-0000-000000000001',
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

-- 6. 테스트용 수련 기록 생성 (샘플 데이터)
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
    '00000000-0000-0000-0000-000000000001',
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
SELECT 'auth.users 생성 확인' as status, id, email, phone FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';
SELECT 'user_profiles 생성 확인' as status, user_id, name, phone FROM user_profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';
SELECT 'practice_records 생성 확인' as status, COUNT(*) as count FROM practice_records WHERE user_id = '00000000-0000-0000-0000-000000000001';
