-- user_profiles 테이블 확장 및 user_settings 테이블 제거
-- Supabase SQL Editor에서 실행하세요

-- 1. user_profiles 테이블에 새로운 컬럼들 추가
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS practice_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ko' CHECK (language IN ('ko', 'en'));

-- 2. 기존 user_settings 데이터를 user_profiles로 마이그레이션 (있는 경우)
UPDATE user_profiles 
SET 
  theme = COALESCE(us.theme, 'dark'),
  push_notifications = COALESCE(us.notifications, true),
  language = COALESCE(us.language, 'ko')
FROM user_settings us 
WHERE user_profiles.user_id = us.user_id;

-- 3. user_settings 테이블 삭제
DROP TABLE IF EXISTS user_settings;

-- 4. user_profiles 테이블에 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_name ON user_profiles(name);

-- 5. RLS 정책 업데이트 (필요한 경우)
-- 기존 RLS 정책이 있다면 확인하고 필요시 업데이트

-- 6. 트리거 함수 업데이트 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거가 없다면 생성
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. 확인용 쿼리
-- SELECT 
--   id, user_id, name, email, avatar_url,
--   push_notifications, email_notifications, practice_reminders,
--   theme, language, created_at, updated_at
-- FROM user_profiles 
-- LIMIT 5;
