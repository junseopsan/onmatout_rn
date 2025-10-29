-- RLS 정책 수정 및 활성화
-- Supabase SQL Editor에서 실행하세요

-- 1. user_favorite_asanas 테이블 RLS 활성화 및 정책 설정
ALTER TABLE user_favorite_asanas ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorite_asanas;
DROP POLICY IF EXISTS "Users can insert own favorites" ON user_favorite_asanas;
DROP POLICY IF EXISTS "Users can delete own favorites" ON user_favorite_asanas;

-- 새로운 정책 생성
CREATE POLICY "Users can view own favorites" ON user_favorite_asanas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON user_favorite_asanas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON user_favorite_asanas
  FOR DELETE USING (auth.uid() = user_id);

-- 2. practice_records 테이블 RLS 활성화 및 정책 설정
ALTER TABLE practice_records ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own records" ON practice_records;
DROP POLICY IF EXISTS "Users can insert own records" ON practice_records;
DROP POLICY IF EXISTS "Users can update own records" ON practice_records;
DROP POLICY IF EXISTS "Users can delete own records" ON practice_records;

-- 새로운 정책 생성
CREATE POLICY "Users can view own records" ON practice_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON practice_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON practice_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" ON practice_records
  FOR DELETE USING (auth.uid() = user_id);

-- 3. user_profiles 테이블 RLS 활성화 및 정책 설정
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

-- 새로운 정책 생성
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- 4. asanas 테이블은 공개 읽기 허용 (RLS 비활성화 유지)
-- ALTER TABLE asanas DISABLE ROW LEVEL SECURITY;

-- 5. 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;