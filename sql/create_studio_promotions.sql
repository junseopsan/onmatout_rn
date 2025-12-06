-- 요가원 일일 클래스 / 프로모션 정보를 위한 테이블
-- 제목 / 날짜 / 금액 / 디스크립션 / 링크 / 요가원(studio_id) 정보를 저장합니다.

create table if not exists public.studio_promotions (
  id uuid primary key default gen_random_uuid(),

  -- 어떤 요가원의 프로모션인지
  studio_id uuid not null references public.studios (id) on delete cascade,

  -- 프로모션 기본 정보
  title text not null,
  class_date date not null,
  price integer,
  description text,
  link text,

  -- 노출 제어
  is_active boolean not null default true,

  created_at timestamptz not null default now()
);

-- 조회 최적화를 위한 인덱스
create index if not exists idx_studio_promotions_class_date
  on public.studio_promotions (class_date desc);

create index if not exists idx_studio_promotions_is_active
  on public.studio_promotions (is_active)
  where is_active = true;


