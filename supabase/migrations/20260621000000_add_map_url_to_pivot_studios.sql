-- 요가원 주소 지도 링크 (Google/Naver/Kakao Map 등). 주소 텍스트와 별도로 클릭 시 열 링크.
ALTER TABLE public.pivot_studios
  ADD COLUMN IF NOT EXISTS map_url text;

COMMENT ON COLUMN public.pivot_studios.map_url IS '요가원 주소 지도 링크 (요가원 정보에서 주소 클릭 시 이동)';
