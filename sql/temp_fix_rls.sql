-- 임시 RLS 정책 수정 (auth.uid() 문제 해결)
-- Supabase SQL Editor에서 실행하세요

-- user_favorite_asanas 테이블의 RLS 정책을 임시로 수정
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorite_asanas;
DROP POLICY IF EXISTS "Users can insert own favorites" ON user_favorite_asanas;
DROP POLICY IF EXISTS "Users can delete own favorites" ON user_favorite_asanas;

-- 인증된 사용자는 모든 즐겨찾기 조회 가능 (임시)
CREATE POLICY "Authenticated users can view favorites" ON user_favorite_asanas
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 인증된 사용자는 즐겨찾기 추가 가능 (임시)
CREATE POLICY "Authenticated users can insert favorites" ON user_favorite_asanas
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 인증된 사용자는 즐겨찾기 삭제 가능 (임시)
CREATE POLICY "Authenticated users can delete favorites" ON user_favorite_asanas
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_favorite_asanas'
ORDER BY policyname;
