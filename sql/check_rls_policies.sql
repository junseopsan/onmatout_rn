-- RLS 정책 확인 및 임시 비활성화
-- Supabase SQL Editor에서 실행하세요

-- 1. user_profiles 테이블의 RLS 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- 2. RLS 활성화 여부 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- 3. 임시로 RLS 비활성화 (테스트용)
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 4. 또는 phone 컬럼에 대한 조회 정책 추가
-- CREATE POLICY "Allow phone lookup" ON user_profiles
--   FOR SELECT USING (true);

-- 5. 현재 데이터 확인
SELECT id, user_id, name, phone, created_at 
FROM user_profiles 
ORDER BY created_at DESC;
