-- 심사용 테스트 계정(01000000000)을 위한 RLS 정책 예외 처리
-- Supabase SQL Editor에서 실행하세요
--
-- 문제: 테스트 계정은 세션이 생성되지 않아 auth.uid()가 null이 되어
--       RLS 정책에 막혀 일지 생성이 불가능합니다.
-- 해결: 테스트 계정의 user_id에 대해 예외 처리하는 정책을 추가합니다.

-- 테스트 계정 user_id (01000000000)
-- 실제 DB에 등록된 user_id: '7ec451a9-5895-40f5-bbc0-b6605c1407ed'

-- 1. 현재 RLS 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'practice_records' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 2. 테스트 계정용 INSERT 정책 추가
-- 기존 정책: auth.uid() = user_id
-- 새 정책: 테스트 계정 user_id도 허용
CREATE POLICY "Test account can insert records" ON practice_records
  FOR INSERT 
  WITH CHECK (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  );

-- 3. 테스트 계정용 UPDATE 정책 추가
CREATE POLICY "Test account can update records" ON practice_records
  FOR UPDATE 
  USING (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  )
  WITH CHECK (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  );

-- 4. 테스트 계정용 DELETE 정책 추가
CREATE POLICY "Test account can delete records" ON practice_records
  FOR DELETE 
  USING (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  );

-- 5. 테스트 계정용 SELECT 정책 추가 (자신의 기록 조회)
CREATE POLICY "Test account can view own records" ON practice_records
  FOR SELECT 
  USING (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  );

-- 6. 수정된 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'practice_records' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 7. 테스트: 테스트 계정으로 기록 생성 가능한지 확인
-- (실제로는 앱에서 테스트해야 하지만, 여기서는 정책이 제대로 생성되었는지 확인)
SELECT 
    'Test account RLS policies created successfully' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'practice_records' 
  AND schemaname = 'public'
  AND policyname LIKE '%Test account%';

-- 8. feed_comments 테이블에 대한 테스트 계정 RLS 정책 추가
-- 댓글 기능을 위한 예외 처리

-- 8-1. feed_comments 테이블의 현재 RLS 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'feed_comments' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 8-2. 테스트 계정용 INSERT 정책 추가 (댓글 작성)
CREATE POLICY "Test account can insert comments" ON feed_comments
  FOR INSERT 
  WITH CHECK (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  );

-- 8-3. 테스트 계정용 UPDATE 정책 추가 (댓글 수정)
CREATE POLICY "Test account can update comments" ON feed_comments
  FOR UPDATE 
  USING (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  )
  WITH CHECK (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  );

-- 8-4. 테스트 계정용 DELETE 정책 추가 (댓글 삭제)
CREATE POLICY "Test account can delete comments" ON feed_comments
  FOR DELETE 
  USING (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  );

-- 8-5. 테스트 계정용 SELECT 정책 추가 (댓글 조회)
CREATE POLICY "Test account can view comments" ON feed_comments
  FOR SELECT 
  USING (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  );

-- 8-6. feed_comments 테이블 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'feed_comments' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 9. user_favorite_asanas 테이블에 대한 테스트 계정 RLS 정책 추가
-- 즐겨찾기 기능을 위한 예외 처리

-- 9-1. user_favorite_asanas 테이블의 현재 RLS 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_favorite_asanas' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 9-2. 테스트 계정용 INSERT 정책 추가 (즐겨찾기 추가)
CREATE POLICY "Test account can insert favorites" ON user_favorite_asanas
  FOR INSERT 
  WITH CHECK (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  );

-- 9-3. 테스트 계정용 DELETE 정책 추가 (즐겨찾기 제거)
CREATE POLICY "Test account can delete favorites" ON user_favorite_asanas
  FOR DELETE 
  USING (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  );

-- 9-4. 테스트 계정용 SELECT 정책 추가 (즐겨찾기 조회)
CREATE POLICY "Test account can view favorites" ON user_favorite_asanas
  FOR SELECT 
  USING (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  );

-- 9-5. user_favorite_asanas 테이블 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_favorite_asanas' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 참고:
-- - 테스트 계정의 user_id는 '7ec451a9-5895-40f5-bbc0-b6605c1407ed'입니다 (실제 DB에 등록된 값).
-- - 이 정책은 auth.uid()가 null이어도 테스트 계정의 user_id로 기록을 생성/수정/삭제할 수 있게 합니다.
-- - 일반 사용자는 기존 정책(auth.uid() = user_id)을 사용합니다.
-- - feed_comments 테이블에도 동일한 예외 처리를 추가하여 댓글 기능이 정상 작동하도록 합니다.
-- - user_favorite_asanas 테이블에도 동일한 예외 처리를 추가하여 즐겨찾기 기능이 정상 작동하도록 합니다.

