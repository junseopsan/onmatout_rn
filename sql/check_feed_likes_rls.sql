-- feed_likes 테이블 RLS 정책 확인 및 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. feed_likes 테이블 존재 확인
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'feed_likes';

-- 2. feed_likes 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'feed_likes'
ORDER BY ordinal_position;

-- 3. 현재 RLS 활성화 상태 확인
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'feed_likes';

-- 4. 현재 RLS 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'feed_likes' 
  AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 5. RLS 활성화 (없다면)
ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;

-- 6. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view feed likes" ON feed_likes;
DROP POLICY IF EXISTS "Users can insert feed likes" ON feed_likes;
DROP POLICY IF EXISTS "Users can delete feed likes" ON feed_likes;
DROP POLICY IF EXISTS "Authenticated users can view all likes" ON feed_likes;
DROP POLICY IF EXISTS "Authenticated users can insert own likes" ON feed_likes;
DROP POLICY IF EXISTS "Authenticated users can delete own likes" ON feed_likes;

-- 7. 새로운 RLS 정책 생성
-- SELECT: 모든 인증된 사용자가 모든 좋아요를 볼 수 있음 (피드 기능)
CREATE POLICY "Authenticated users can view all likes" ON feed_likes
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- INSERT: 인증된 사용자가 자신의 좋아요를 추가할 수 있음
CREATE POLICY "Authenticated users can insert own likes" ON feed_likes
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- DELETE: 인증된 사용자가 자신의 좋아요를 삭제할 수 있음
CREATE POLICY "Authenticated users can delete own likes" ON feed_likes
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 8. 생성된 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'feed_likes' 
  AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 9. 테스트: 좋아요 개수 확인
SELECT 
  COUNT(*) as total_likes,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT record_id) as unique_records
FROM feed_likes;

