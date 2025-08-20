-- 현재 practice_records 테이블 스키마 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'practice_records' 
ORDER BY ordinal_position;

-- 테이블 존재 여부 확인
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'practice_records'
);

-- 테이블 구조 상세 확인
\d practice_records;
