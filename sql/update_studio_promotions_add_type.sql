-- studio_promotions 테이블에 프로모션 타입 / 정규수업 스케줄 정보를 추가합니다.

ALTER TABLE public.studio_promotions
  ADD COLUMN IF NOT EXISTS promotion_type text NOT NULL DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS schedule_text text;


