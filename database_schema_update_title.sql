-- practice_records 테이블에 title 컬럼 추가
ALTER TABLE practice_records ADD COLUMN IF NOT EXISTS title TEXT;

-- 기존 레코드에 기본 제목 설정 (날짜 기반)
UPDATE practice_records 
SET title = CONCAT('수련 기록 - ', TO_CHAR(practice_date, 'YYYY-MM-DD'))
WHERE title IS NULL;

-- 제목 컬럼에 NOT NULL 제약 조건 추가 (기본값 설정 후)
ALTER TABLE practice_records ALTER COLUMN title SET NOT NULL;

-- 제목 컬럼에 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_practice_records_title ON practice_records(title);

-- RLS 정책은 기존 정책이 title 컬럼도 포함하므로 추가 설정 불필요
