-- user_profiles 테이블의 RLS 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- RLS 활성화 여부 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles' AND schemaname = 'public'; 