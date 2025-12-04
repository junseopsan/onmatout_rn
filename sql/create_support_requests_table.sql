-- 고객지원 건의사항 테이블 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. support_requests 테이블 생성
CREATE TABLE IF NOT EXISTS support_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('bug', 'feature', 'question', 'other')) DEFAULT 'other',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')) DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS 활성화
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책 생성
-- 사용자는 자신의 건의사항만 조회 가능
CREATE POLICY "Users can view own support requests" ON support_requests
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 사용자는 자신의 건의사항만 생성 가능
CREATE POLICY "Users can insert own support requests" ON support_requests
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 건의사항만 수정 가능 (답변 전까지)
CREATE POLICY "Users can update own support requests" ON support_requests
  FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 건의사항 조회 가능 (필요시 별도 정책 추가)
-- CREATE POLICY "Admins can view all support requests" ON support_requests
--   FOR SELECT 
--   USING (auth.jwt() ->> 'role' = 'admin');

-- 4. 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON support_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_created_at ON support_requests(created_at DESC);

-- 5. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_support_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_support_requests_updated_at
  BEFORE UPDATE ON support_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_support_requests_updated_at();

-- 6. 테스트 계정 예외 처리 (01000000000)
-- 테스트 계정용 INSERT 정책 추가
CREATE POLICY "Test account can insert support requests" ON support_requests
  FOR INSERT 
  WITH CHECK (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  );

-- 테스트 계정용 SELECT 정책 추가
CREATE POLICY "Test account can view own support requests" ON support_requests
  FOR SELECT 
  USING (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  );

-- 테스트 계정용 UPDATE 정책 추가
CREATE POLICY "Test account can update own support requests" ON support_requests
  FOR UPDATE 
  USING (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid AND status = 'pending'
  )
  WITH CHECK (
    user_id = '7ec451a9-5895-40f5-bbc0-b6605c1407ed'::uuid
  );

-- 7. 테이블 및 정책 확인
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'support_requests' AND schemaname = 'public';

SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'support_requests' AND schemaname = 'public'
ORDER BY cmd, policyname;

