-- practice_records 테이블 RLS 정책 수정
-- Supabase SQL Editor에서 실행하세요

-- 1. 현재 RLS 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'practice_records' AND schemaname = 'public';

-- 2. 기존 정책 삭제 (필요한 경우)
-- DROP POLICY IF EXISTS "Users can view own records" ON practice_records;
-- DROP POLICY IF EXISTS "Users can insert own records" ON practice_records;
-- DROP POLICY IF EXISTS "Users can update own records" ON practice_records;
-- DROP POLICY IF EXISTS "Users can delete own records" ON practice_records;

-- 3. 새로운 정책 생성 (인증된 사용자만 접근)
CREATE POLICY "Authenticated users can view records" ON practice_records
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert records" ON practice_records
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update records" ON practice_records
  FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete records" ON practice_records
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 4. 또는 RLS 임시 비활성화 (테스트용)
-- ALTER TABLE practice_records DISABLE ROW LEVEL SECURITY;

-- 5. 테스트 쿼리
SELECT id, user_id, title, practice_date, created_at 
FROM practice_records 
WHERE user_id = '260d9314-3fa8-472f-8250-32ef3a9dc7fc'
ORDER BY created_at DESC 
LIMIT 5;
