-- RLS 정책 수정: user_id 기반으로 변경
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can upsert own profile" ON user_profiles;

-- 새로운 정책 생성: user_id 기반
CREATE POLICY "Users can update own profile by user_id" ON user_profiles
FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can upsert own profile by user_id" ON user_profiles
FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- 또는 더 간단한 방법: RLS 임시 비활성화 (개발용)
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
