-- 아사나 이미지 개수 컬럼 추가 및 데이터 세팅 스크립트
-- Supabase SQL Editor 에서 "전체 선택 → 실행" 해서 적용해주세요.

-- 1) asanas 테이블에 image_count 컬럼 추가 (기본값 1)
ALTER TABLE public.asanas
  ADD COLUMN IF NOT EXISTS image_count integer NOT NULL DEFAULT 1;

-- 2) 이미지가 2장 이상인 아사나에 대해 image_count 값 업데이트
--    (명시되지 않은 나머지는 기본값 1 그대로 사용)

UPDATE public.asanas SET image_count = 3 WHERE image_number = '6';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '7';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '8';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '10';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '13';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '17';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '20';
UPDATE public.asanas SET image_count = 4 WHERE image_number = '21';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '22';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '26';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '27';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '29';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '32';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '33';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '34';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '36';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '37';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '45';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '48';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '52';
UPDATE public.asanas SET image_count = 4 WHERE image_number = '54';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '58';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '59';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '65';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '66';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '67';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '69';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '70';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '73';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '74';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '75';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '76';
UPDATE public.asanas SET image_count = 4 WHERE image_number = '83';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '86';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '92';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '93';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '98';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '100';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '101';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '103';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '105';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '111';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '121';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '122';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '124';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '127';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '128';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '129';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '130';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '132';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '133';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '134';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '136';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '137';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '138';
UPDATE public.asanas SET image_count = 4 WHERE image_number = '139';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '140';
UPDATE public.asanas SET image_count = 4 WHERE image_number = '141';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '142';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '145';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '146';
UPDATE public.asanas SET image_count = 4 WHERE image_number = '150';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '155';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '157';
UPDATE public.asanas SET image_count = 4 WHERE image_number = '161';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '162';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '164';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '165';
UPDATE public.asanas SET image_count = 2 WHERE image_number = '166';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '170';
UPDATE public.asanas SET image_count = 4 WHERE image_number = '171';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '172';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '173';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '174';
UPDATE public.asanas SET image_count = 3 WHERE image_number = '175';
UPDATE public.asanas SET image_count = 5 WHERE image_number = '177';
UPDATE public.asanas SET image_count = 4 WHERE image_number = '178';
UPDATE public.asanas SET image_count = 5 WHERE image_number = '179';
UPDATE public.asanas SET image_count = 5 WHERE image_number = '180';


