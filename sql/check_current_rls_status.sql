-- 현재 RLS 상태 및 practice_records 테이블 확인
-- Supabase SQL Editor에서 실행하세요

-- 1. practice_records 테이블 RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'practice_records' AND schemaname = 'public';

-- 2. practice_records 테이블의 RLS 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'practice_records' AND schemaname = 'public';

-- 3. 특정 사용자의 수련기록 개수 확인
SELECT COUNT(*) as total_records 
FROM practice_records 
WHERE user_id = '260d9314-3fa8-472f-8250-32ef3a9dc7fc';

-- 4. 이번 주 수련기록 확인
SELECT COUNT(*) as this_week_records
FROM practice_records 
WHERE user_id = '260d9314-3fa8-472f-8250-32ef3a9dc7fc'
AND created_at >= date_trunc('week', CURRENT_DATE);

-- 5. 이번 달 수련기록 확인
SELECT COUNT(*) as this_month_records
FROM practice_records 
WHERE user_id = '260d9314-3fa8-472f-8250-32ef3a9dc7fc'
AND created_at >= date_trunc('month', CURRENT_DATE);

-- 6. 최근 수련기록 5개 확인
SELECT id, user_id, title, practice_date, created_at 
FROM practice_records 
WHERE user_id = '260d9314-3fa8-472f-8250-32ef3a9dc7fc'
ORDER BY created_at DESC 
LIMIT 5;
