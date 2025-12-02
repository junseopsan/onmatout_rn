-- 피드 테스트용 데모 데이터 생성 (100개)
-- practice_records 테이블에 다양한 사용자의 수련 기록 삽입
-- Supabase SQL Editor에서 실행하세요

-- 주의: RLS가 활성화되어 있다면 임시로 비활성화하거나 관리자 권한으로 실행해야 합니다
-- ALTER TABLE practice_records DISABLE ROW LEVEL SECURITY;

-- 실제 존재하는 사용자 ID 조회 및 사용
DO $$
DECLARE
  -- 실제 존재하는 사용자 ID를 조회
  user_ids UUID[];
  
  -- 실제 사용자 ID가 없을 경우를 대비한 기본값
  default_user_id UUID := 'c5ce8d5a-f09b-4752-b591-5797721d87df'::UUID;
  
  asana_ids TEXT[] := ARRAY[
    '733fb491-478f-47e5-9029-6e216c96019d',
    '2904baf3-1c54-4125-ad05-7627bd0f7893',
    gen_random_uuid()::TEXT,
    gen_random_uuid()::TEXT,
    gen_random_uuid()::TEXT,
    gen_random_uuid()::TEXT,
    gen_random_uuid()::TEXT,
    gen_random_uuid()::TEXT,
    gen_random_uuid()::TEXT,
    gen_random_uuid()::TEXT
  ];
  
  states_array TEXT[] := ARRAY['calm', 'peaceful', 'energized', 'tired', 'focused', 'tense', 'pressured', 'balanced'];
  
  titles TEXT[] := ARRAY[
    '오늘의 요가',
    '아침 수련',
    '저녁 요가',
    '평화로운 시간',
    '에너지 충전',
    '명상과 함께',
    '스트레스 해소',
    '몸과 마음의 균형',
    '새로운 도전',
    '편안한 하루',
    '집중력 향상',
    '휴식의 시간',
    '활력 넘치는 하루',
    '차분한 마음',
    '요가의 힘',
    '내면의 평화',
    '자기계발',
    '건강한 하루',
    '마음의 여유',
    '일상의 요가'
  ];
  
  memos TEXT[] := ARRAY[
    '오늘은 정말 평화로웠어요',
    '새로운 아사나를 시도해봤습니다',
    '몸이 많이 풀렸어요',
    '스트레스가 많이 해소되었습니다',
    '집중력이 향상된 것 같아요',
    '편안한 하루였습니다',
    '에너지가 넘칩니다',
    '차분한 마음으로 수련했습니다',
    '오늘도 좋은 하루',
    '요가의 힘을 느꼈어요',
    '명상과 함께하는 시간',
    '몸과 마음이 하나가 되는 느낌',
    '새로운 도전을 해봤어요',
    '평화로운 시간이었습니다',
    '활력이 넘치는 하루',
    '내면의 평화를 찾았어요',
    '자기계발의 시간',
    '건강한 하루를 시작했습니다',
    '마음의 여유를 느꼈어요',
    '일상 속 작은 행복',
    '오늘의 수련이 특별했어요',
    '새로운 경험을 했습니다',
    '몸이 가벼워진 느낌',
    '마음이 편안해졌어요',
    '좋은 하루였습니다',
    NULL, -- 메모 없는 경우도 포함
    NULL,
    NULL
  ];
  
  i INTEGER;
  current_user_id UUID;
  practice_date DATE;
  practice_time TIMESTAMP WITH TIME ZONE;
  selected_asanas JSONB;
  selected_states JSONB;
  selected_title TEXT;
  selected_memo TEXT;
  num_asanas INTEGER;
  num_states INTEGER;
BEGIN
  -- 실제 존재하는 사용자 ID 조회
  SELECT ARRAY_AGG(id) INTO user_ids
  FROM auth.users
  WHERE id IS NOT NULL;
  
  -- 사용자 ID가 없으면 기본 사용자 ID만 사용
  IF user_ids IS NULL OR array_length(user_ids, 1) IS NULL THEN
    user_ids := ARRAY[default_user_id];
    RAISE NOTICE '실제 사용자 ID를 찾을 수 없어 기본 사용자 ID만 사용합니다.';
  ELSE
    RAISE NOTICE '총 % 명의 사용자 ID를 찾았습니다.', array_length(user_ids, 1);
  END IF;
  
  FOR i IN 1..100 LOOP
    -- 랜덤 사용자 선택 (실제 존재하는 사용자만)
    current_user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::INTEGER];
    
    -- 날짜: 최근 90일 중 랜덤
    practice_date := CURRENT_DATE - (floor(random() * 90)::INTEGER);
    
    -- 시간: 해당 날짜의 랜덤 시간 (오전 6시 ~ 오후 11시)
    practice_time := (practice_date + (6 + floor(random() * 17)::INTEGER) * INTERVAL '1 hour' + 
                     floor(random() * 60)::INTEGER * INTERVAL '1 minute')::TIMESTAMP WITH TIME ZONE;
    
    -- 아사나 선택 (1~3개)
    num_asanas := 1 + floor(random() * 3)::INTEGER;
    selected_asanas := (
      SELECT jsonb_agg(asana_ids[1 + floor(random() * array_length(asana_ids, 1))::INTEGER])
      FROM generate_series(1, num_asanas)
    );
    
    -- 상태 선택 (1~2개)
    num_states := 1 + floor(random() * 2)::INTEGER;
    selected_states := (
      SELECT jsonb_agg(states_array[1 + floor(random() * array_length(states_array, 1))::INTEGER])
      FROM generate_series(1, num_states)
    );
    
    -- 제목 선택
    selected_title := titles[1 + floor(random() * array_length(titles, 1))::INTEGER];
    
    -- 메모 선택 (70% 확률로 메모 있음)
    IF random() < 0.7 THEN
      selected_memo := memos[1 + floor(random() * array_length(memos, 1))::INTEGER];
    ELSE
      selected_memo := NULL;
    END IF;
    
    -- 레코드 삽입
    INSERT INTO practice_records (
      id,
      user_id,
      practice_date,
      practice_time,
      asanas,
      memo,
      states,
      photos,
      created_at,
      updated_at,
      title
    ) VALUES (
      gen_random_uuid(),
      current_user_id,
      practice_date,
      practice_time,
      selected_asanas,
      selected_memo,
      selected_states,
      '[]'::JSONB, -- 사진은 빈 배열
      practice_time, -- created_at은 practice_time과 동일하게
      practice_time, -- updated_at도 동일하게
      selected_title
    );
  END LOOP;
  
  RAISE NOTICE '100개의 데모 피드 데이터가 생성되었습니다.';
END $$;

-- 생성된 데이터 확인
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(practice_date) as earliest_date,
  MAX(practice_date) as latest_date
FROM practice_records;

-- 사용자별 기록 수 확인
SELECT 
  user_id,
  COUNT(*) as record_count
FROM practice_records
GROUP BY user_id
ORDER BY record_count DESC;

-- 최근 기록 10개 확인
SELECT 
  id,
  user_id,
  practice_date,
  title,
  jsonb_array_length(asanas) as asana_count,
  states,
  memo
FROM practice_records
ORDER BY practice_time DESC
LIMIT 10;

