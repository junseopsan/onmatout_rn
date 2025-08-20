-- Supabase 스키마 캐시 새로고침
-- 이 스크립트를 실행하여 스키마 캐시를 업데이트하세요

-- 1. practice_records 테이블이 제대로 생성되었는지 확인
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'practice_records'
);

-- 2. practice_records 테이블의 컬럼 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'practice_records' 
ORDER BY ordinal_position;

-- 3. RLS 정책 확인
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'practice_records';

-- 4. 테이블 권한 확인
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'practice_records';

-- 5. 테스트 데이터 삽입 (선택사항)
-- INSERT INTO practice_records (user_id, practice_date, asanas, memo, states, photos)
-- VALUES (
--     'test-user-id',
--     CURRENT_DATE,
--     '["test-asana-1", "test-asana-2"]'::jsonb,
--     '테스트 메모',
--     '["calm", "energized"]'::jsonb,
--     '[]'::jsonb
-- );
