-- user_profiles 테이블에 avatar_url 컬럼 추가
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 확인용 쿼리
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public';
