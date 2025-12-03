-- practice_records 테이블 피드 기능을 위한 RLS 정책 수정
-- 모든 인증된 사용자가 모든 기록을 볼 수 있도록 설정
-- Supabase SQL Editor에서 실행하세요

-- 1. 현재 RLS 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'practice_records' AND schemaname = 'public';

-- 2. 기존 SELECT 정책 삭제 (자신의 기록만 보는 정책)
DROP POLICY IF EXISTS "Users can view their own records" ON practice_records;
DROP POLICY IF EXISTS "Users can view own records" ON practice_records;
DROP POLICY IF EXISTS "Authenticated users can view records" ON practice_records;

-- 3. 새로운 SELECT 정책 생성 (모든 인증된 사용자가 모든 기록 조회 가능)
CREATE POLICY "Authenticated users can view all records" ON practice_records
  FOR SELECT 
  USING (auth.uid() IS NOT NULL); -- 인증된 사용자면 모든 기록 조회 가능

-- 4. INSERT, UPDATE, DELETE 정책은 기존대로 유지 (자신의 기록만 수정/삭제 가능)
-- 기존 정책이 없다면 생성
DO $$
BEGIN
  -- INSERT 정책 확인 및 생성
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'practice_records' 
    AND policyname = 'Users can insert their own records'
    AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Users can insert their own records" ON practice_records
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- UPDATE 정책 확인 및 생성
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'practice_records' 
    AND policyname = 'Users can update their own records'
    AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Users can update their own records" ON practice_records
      FOR UPDATE 
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- DELETE 정책 확인 및 생성
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'practice_records' 
    AND policyname = 'Users can delete their own records'
    AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Users can delete their own records" ON practice_records
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. 수정된 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'practice_records' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 6. 테스트: 모든 기록 조회 가능한지 확인
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users
FROM practice_records;

-- 7. 최근 기록 10개 확인 (모든 사용자)
SELECT 
  id,
  user_id,
  title,
  practice_date,
  created_at
FROM practice_records
ORDER BY created_at DESC
LIMIT 10;

