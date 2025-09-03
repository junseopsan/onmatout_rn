-- 요가원 데이터 INSERT 쿼리
-- studios 테이블에 요가원 정보 삽입

INSERT INTO studios (id, name, address, phone, website, instagram, description, image_url, latitude, longitude, created_at, updated_at) VALUES
(
  gen_random_uuid(),
  '요가스튜디오 나마스떼',
  '서울특별시 강남구 역삼동 123-45',
  '02-1234-5678',
  'https://namaste-yoga.com',
  'namaste_yoga_seoul',
  '마음과 몸의 균형을 찾는 하타요가 전문 스튜디오입니다. 초보자부터 고급자까지 모두를 위한 맞춤형 수업을 제공합니다.',
  'https://via.placeholder.com/300x200/4A4A4A/FFFFFF?text=Namaste+Yoga',
  37.5665,
  127.0018,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '마음의 요가',
  '서울특별시 서초구 서초동 456-78',
  '02-2345-6789',
  'https://mind-yoga.kr',
  'mind_yoga_center',
  '명상과 요가를 결합한 독특한 수업으로 내면의 평화를 찾아보세요. 전문 강사진이 함께합니다.',
  'https://via.placeholder.com/300x200/4A4A4A/FFFFFF?text=Mind+Yoga',
  37.5013,
  127.0246,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '평화 요가센터',
  '서울특별시 마포구 합정동 789-12',
  '02-3456-7890',
  'https://peace-yoga.co.kr',
  'peace_yoga_center',
  '도시 한가운데에서 평화를 찾을 수 있는 요가센터입니다. 자연 친화적인 환경에서 요가를 경험해보세요.',
  'https://via.placeholder.com/300x200/4A4A4A/FFFFFF?text=Peace+Yoga',
  37.5492,
  126.9134,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '에너지 요가',
  '서울특별시 용산구 이태원동 321-54',
  '02-4567-8901',
  'https://energy-yoga.com',
  'energy_yoga_studio',
  '활력 넘치는 파워요가와 빈야사 플로우를 통해 몸의 에너지를 끌어올려보세요.',
  'https://via.placeholder.com/300x200/4A4A4A/FFFFFF?text=Energy+Yoga',
  37.5344,
  126.9942,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '하모니 요가',
  '서울특별시 종로구 종로1가 654-32',
  '02-5678-9012',
  'https://harmony-yoga.kr',
  'harmony_yoga_seoul',
  '전통과 현대가 조화를 이루는 요가스튜디오입니다. 다양한 요가 스타일을 경험할 수 있습니다.',
  'https://via.placeholder.com/300x200/4A4A4A/FFFFFF?text=Harmony+Yoga',
  37.5704,
  126.9910,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '센터 요가',
  '서울특별시 중구 명동 987-65',
  '02-6789-0123',
  'https://center-yoga.com',
  'center_yoga_studio',
  '도심 한가운데 위치한 프리미엄 요가센터입니다. 최신 시설과 전문 강사진이 준비되어 있습니다.',
  'https://via.placeholder.com/300x200/4A4A4A/FFFFFF?text=Center+Yoga',
  37.5636,
  126.9834,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '그린 요가',
  '서울특별시 송파구 잠실동 147-89',
  '02-7890-1234',
  'https://green-yoga.kr',
  'green_yoga_center',
  '자연과 함께하는 요가를 경험해보세요. 넓은 공간과 친환경적인 시설을 제공합니다.',
  'https://via.placeholder.com/300x200/4A4A4A/FFFFFF?text=Green+Yoga',
  37.5139,
  127.1006,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '스피릿 요가',
  '서울특별시 강서구 마곡동 258-96',
  '02-8901-2345',
  'https://spirit-yoga.com',
  'spirit_yoga_studio',
  '영성과 요가를 결합한 독특한 수업을 제공합니다. 마음의 평화를 찾아보세요.',
  'https://via.placeholder.com/300x200/4A4A4A/FFFFFF?text=Spirit+Yoga',
  37.5663,
  126.8250,
  NOW(),
  NOW()
);

-- studio_operating_hours 테이블에 운영시간 데이터 삽입
-- 먼저 studios 테이블에서 studio_id를 가져와서 사용

INSERT INTO studio_operating_hours (id, studio_id, day_of_week, open_time, close_time, is_closed, created_at) 
SELECT 
  gen_random_uuid(),
  s.id,
  d.day_of_week,
  d.open_time::time,
  d.close_time::time,
  d.is_closed,
  NOW()
FROM studios s
CROSS JOIN (
  VALUES 
    (1, '07:00:00', '22:00:00', false),  -- 월요일
    (2, '07:00:00', '22:00:00', false),  -- 화요일
    (3, '07:00:00', '22:00:00', false),  -- 수요일
    (4, '07:00:00', '22:00:00', false),  -- 목요일
    (5, '07:00:00', '22:00:00', false),  -- 금요일
    (6, '09:00:00', '20:00:00', false),  -- 토요일
    (0, '09:00:00', '18:00:00', false)   -- 일요일
) AS d(day_of_week, open_time, close_time, is_closed)
WHERE s.name IN ('요가스튜디오 나마스떼', '마음의 요가', '평화 요가센터', '에너지 요가');

-- 일부 요가원은 일요일 휴무
UPDATE studio_operating_hours 
SET is_closed = true 
WHERE day_of_week = 0 AND studio_id IN (
  SELECT id FROM studios WHERE name IN ('하모니 요가', '센터 요가', '그린 요가', '스피릿 요가')
);
