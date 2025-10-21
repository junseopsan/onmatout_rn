-- 테스트 사용자 강제 삭제

-- 1. 관련 데이터 먼저 삭제 (외래키 제약조건 때문에)
DELETE FROM practice_records 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

DELETE FROM user_profiles 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- 2. auth.users에서 테스트 사용자 삭제
DELETE FROM auth.users 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. 삭제 확인
SELECT 'auth.users 삭제 확인' as status;
SELECT COUNT(*) as remaining_users FROM auth.users 
WHERE id = '00000000-0000-0000-0000-000000000001';

SELECT 'user_profiles 삭제 확인' as status;
SELECT COUNT(*) as remaining_profiles FROM user_profiles 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

SELECT 'practice_records 삭제 확인' as status;
SELECT COUNT(*) as remaining_records FROM practice_records 
WHERE user_id = '00000000-0000-0000-0000-000000000001';
