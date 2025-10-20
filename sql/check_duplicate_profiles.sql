-- 중복 사용자 프로필 확인
SELECT user_id, COUNT(*) as count
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 특정 사용자의 모든 프로필 레코드 확인
SELECT * FROM user_profiles 
WHERE user_id = '260d9314-3fa8-472f-8250-32ef3a9dc7fc'
ORDER BY created_at DESC;
