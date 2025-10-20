-- user_profiles 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 현재 제약조건 확인
SELECT 
    constraint_name, 
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_profiles';

-- 현재 데이터 확인
SELECT * FROM user_profiles 
WHERE user_id = '260d9314-3fa8-472f-8250-32ef3a9dc7fc';

-- phone 컬럼 중복 확인
SELECT phone, COUNT(*) as count
FROM user_profiles 
WHERE phone IS NOT NULL
GROUP BY phone 
HAVING COUNT(*) > 1;
