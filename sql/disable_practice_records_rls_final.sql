-- practice_records 테이블 RLS 비활성화 (최종)
-- Supabase SQL Editor에서 실행하세요

-- 1. RLS 비활성화
ALTER TABLE practice_records DISABLE ROW LEVEL SECURITY;

-- 2. 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'practice_records' AND schemaname = 'public';

-- 3. 테스트 쿼리
SELECT id, user_id, title, practice_date, created_at 
FROM practice_records 
ORDER BY created_at DESC 
LIMIT 5;
