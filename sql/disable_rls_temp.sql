-- 임시로 user_favorite_asanas 테이블의 RLS 비활성화
-- Supabase SQL Editor에서 실행하세요

-- user_favorite_asanas 테이블의 RLS 비활성화
ALTER TABLE user_favorite_asanas DISABLE ROW LEVEL SECURITY;

-- RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_favorite_asanas';
