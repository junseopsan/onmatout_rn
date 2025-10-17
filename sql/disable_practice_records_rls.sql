-- practice_records 테이블 RLS 임시 비활성화 (테스트용)
-- Supabase SQL Editor에서 실행하세요

-- RLS 비활성화
ALTER TABLE practice_records DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'practice_records' AND schemaname = 'public';
