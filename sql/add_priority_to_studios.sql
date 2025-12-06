-- 요가원 우선순위 컬럼 추가 스크립트
-- Supabase SQL Editor 에서 전체 선택 후 실행하세요.

-- 1) studios 테이블에 priority 컬럼 추가
--    1,2,3,... 숫자가 작을수록 상단에 노출됩니다.
ALTER TABLE public.studios
  ADD COLUMN IF NOT EXISTS priority integer;

-- 2) 기본값 설정 (아직 우선순위를 지정하지 않은 기존 데이터용)
--    필요에 따라 10 대신 다른 기본 우선순위를 사용하셔도 됩니다.
UPDATE public.studios
SET priority = 10
WHERE priority IS NULL;

-- 3) 조회 성능을 위한 인덱스 (정렬에 자주 사용할 예정)
CREATE INDEX IF NOT EXISTS idx_studios_priority_created_at
ON public.studios (priority ASC, created_at DESC);


