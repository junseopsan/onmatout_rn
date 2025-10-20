-- user_profiles 테이블의 RLS 비활성화
-- 이렇게 하면 RLS 정책과 관계없이 모든 사용자가 프로필을 업데이트할 수 있습니다
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 확인: RLS가 비활성화되었는지 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';
