-- user_profiles.name 컬럼의 UNIQUE 인덱스 제거 스크립트
-- Supabase SQL Editor에서 전체 실행하세요.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM   pg_indexes
    WHERE  schemaname = 'public'
    AND    tablename = 'user_profiles'
    AND    indexname = 'user_profiles_name_unique_idx'
  ) THEN
    DROP INDEX IF EXISTS user_profiles_name_unique_idx;
    RAISE NOTICE '✅ user_profiles_name_unique_idx 인덱스를 삭제했습니다.';
  ELSE
    RAISE NOTICE 'ℹ️ user_profiles_name_unique_idx 인덱스가 존재하지 않습니다.';
  END IF;
END$$;
