-- practice_records 테이블 데이터 확인
-- Supabase SQL Editor에서 실행하세요

-- 1. 특정 사용자의 수련기록 확인
SELECT id, user_id, title, practice_date, created_at 
FROM practice_records 
WHERE user_id = '260d9314-3fa8-472f-8250-32ef3a9dc7fc'
ORDER BY created_at DESC 
LIMIT 10;

-- 2. 전체 수련기록 개수 확인
SELECT COUNT(*) as total_records FROM practice_records;

-- 3. 최근 수련기록 확인 (모든 사용자)
SELECT id, user_id, title, practice_date, created_at 
FROM practice_records 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. practice_records 테이블의 RLS 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'practice_records' AND schemaname = 'public';

-- 5. RLS 활성화 여부 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'practice_records' AND schemaname = 'public';
