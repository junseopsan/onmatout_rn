-- 중복 사용자 프로필 문제 해결

-- 1. 중복 레코드 확인
SELECT user_id, COUNT(*) as count
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. 각 사용자별로 가장 최근 레코드만 남기고 나머지 삭제
WITH ranked_profiles AS (
  SELECT id, user_id, created_at,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM user_profiles
)
DELETE FROM user_profiles 
WHERE id IN (
  SELECT id FROM ranked_profiles WHERE rn > 1
);

-- 3. user_id에 대한 유니크 제약조건 추가 (이미 있다면 무시)
DO $$ 
BEGIN
    -- user_id에 대한 유니크 제약조건이 있는지 확인
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_user_id_key' 
        AND table_name = 'user_profiles'
    ) THEN
        -- 유니크 제약조건 추가
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 4. 결과 확인
SELECT user_id, COUNT(*) as count
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;
