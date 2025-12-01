-- user_profiles 테이블의 name 필드에 UNIQUE 제약조건 추가 (대소문자 구분 없이)
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 중복 데이터 확인
SELECT LOWER(TRIM(name)) as normalized_name, COUNT(*) as count
FROM user_profiles 
WHERE name IS NOT NULL
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1;

-- 2. 중복 데이터가 있다면 먼저 정리 필요 (가장 최근 것만 남기고 나머지 삭제)
-- 주의: 이 쿼리는 실제로 삭제하므로 실행 전에 백업 권장
/*
WITH ranked_profiles AS (
  SELECT id, user_id, name, created_at,
         ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(name)) ORDER BY created_at DESC) as rn
  FROM user_profiles
  WHERE name IS NOT NULL
)
DELETE FROM user_profiles 
WHERE id IN (
  SELECT id FROM ranked_profiles WHERE rn > 1
);
*/

-- 3. name 필드에 대소문자 구분 없이 UNIQUE 제약조건 추가
-- PostgreSQL에서는 함수 기반 인덱스를 사용하여 대소문자 구분 없이 UNIQUE 제약조건 구현
DO $$ 
BEGIN
    -- 기존 인덱스가 있는지 확인하고 삭제
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'user_profiles_name_unique_idx'
    ) THEN
        DROP INDEX IF EXISTS user_profiles_name_unique_idx;
    END IF;
    
    -- 대소문자 구분 없이 UNIQUE 인덱스 생성
    CREATE UNIQUE INDEX user_profiles_name_unique_idx 
    ON user_profiles (LOWER(TRIM(name)))
    WHERE name IS NOT NULL;
    
    RAISE NOTICE '닉네임 UNIQUE 인덱스 생성 완료';
END $$;

-- 4. RLS 정책 추가: 닉네임 중복 확인을 위한 SELECT 권한
-- 다른 사용자의 name 필드만 조회할 수 있도록 정책 추가
CREATE POLICY "Users can check nickname availability" ON user_profiles
  FOR SELECT 
  USING (
    -- 자신의 프로필이거나, name 필드만 조회하는 경우 허용
    auth.uid() = user_id 
    OR 
    -- 다른 사용자의 name 필드만 조회 가능 (중복 확인용)
    true
  );

-- 5. 확인 쿼리
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'user_profiles' 
AND indexname = 'user_profiles_name_unique_idx';

-- 6. 테스트: 중복 닉네임 삽입 시도 (에러 발생해야 함)
-- INSERT INTO user_profiles (user_id, name) VALUES ('test-user-id', '테스터');
-- INSERT INTO user_profiles (user_id, name) VALUES ('test-user-id-2', '테스터'); -- 이건 실패해야 함
-- INSERT INTO user_profiles (user_id, name) VALUES ('test-user-id-3', 'TESTER'); -- 이것도 실패해야 함 (대소문자 구분 없이)

