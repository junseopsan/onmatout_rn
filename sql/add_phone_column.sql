-- user_profiles 테이블에 phone 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. phone 컬럼 추가
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. phone 컬럼에 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

-- 3. 기존 사용자 데이터 확인
SELECT id, user_id, name, phone, created_at 
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. 기존 사용자에게 전화번호 업데이트 (필요한 경우)
-- UPDATE user_profiles 
-- SET phone = '+821083138230' 
-- WHERE user_id = '260d9314-3fa8-472f-8250-32ef3a9dc7fc';

-- 5. 컬럼 추가 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
