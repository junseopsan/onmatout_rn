-- phone 컬럼에 유니크 제약조건 추가
-- 먼저 중복된 phone 값이 있는지 확인
SELECT phone, COUNT(*) as count
FROM user_profiles 
WHERE phone IS NOT NULL
GROUP BY phone 
HAVING COUNT(*) > 1;

-- phone 컬럼에 유니크 제약조건 추가 (중복이 없다면)
DO $$ 
BEGIN
    -- phone에 대한 유니크 제약조건이 있는지 확인
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_phone_key' 
        AND table_name = 'user_profiles'
    ) THEN
        -- 유니크 제약조건 추가
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_phone_key UNIQUE (phone);
        RAISE NOTICE 'phone 컬럼에 유니크 제약조건이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'phone 컬럼에 이미 유니크 제약조건이 존재합니다.';
    END IF;
END $$;
