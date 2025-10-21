-- 아사나 테이블에 산스크리트어 컬럼 추가

-- 1. 산스크리트어 이름 컬럼 추가 (한글)
ALTER TABLE asanas ADD COLUMN IF NOT EXISTS sanskrit_name_kr TEXT;

-- 2. 산스크리트어 이름 컬럼 추가 (영문)
ALTER TABLE asanas ADD COLUMN IF NOT EXISTS sanskrit_name_en TEXT;

-- 3. 산스크리트어 발음 컬럼 추가 (한글 발음)
ALTER TABLE asanas ADD COLUMN IF NOT EXISTS sanskrit_pronunciation_kr TEXT;

-- 4. 산스크리트어 발음 컬럼 추가 (영문 발음)
ALTER TABLE asanas ADD COLUMN IF NOT EXISTS sanskrit_pronunciation_en TEXT;

-- 5. 산스크리트어 의미/해석 컬럼 추가
ALTER TABLE asanas ADD COLUMN IF NOT EXISTS sanskrit_meaning TEXT;

-- 6. 기존 데이터 확인
SELECT 
    id,
    sanskrit_name_kr,
    sanskrit_name_en,
    sanskrit_pronunciation_kr,
    sanskrit_pronunciation_en,
    sanskrit_meaning
FROM asanas 
LIMIT 5;

-- 7. 컬럼 추가 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'asanas' 
AND column_name LIKE '%sanskrit%'
ORDER BY ordinal_position;
