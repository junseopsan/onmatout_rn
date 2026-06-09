-- ONMATOUT Phase 1 test seed
-- ⚠️ DEV ONLY — main 에 절대 적용하지 말 것
--
-- 사용법:
--   1. 테스트 teacher 계정으로 앱에서 가입 (전화번호 OTP)
--   2. 가입 후 auth.users 에서 user_id 확인:
--      SELECT id, phone, email FROM auth.users ORDER BY created_at DESC LIMIT 1;
--   3. 아래 v_teacher_id 의 placeholder UUID 를 실제 user_id 로 치환
--   4. dev 에 실행 (mcp execute_sql 또는 supabase studio)
--
-- 생성되는 것:
--   - teacher 역할 + teacher_profile 1
--   - student_profiles 5명 (모두 user_id NULL — 회원 가입 매칭 테스트용)
--   - teacher_students 5 (N:M 연결)
--   - class 1개 + schedules 3 (월/수/금 09:00-10:30) + class_students 5
--   - memberships 5 (혼합 타입)
--   - attendance: 이번 주 월~오늘까지

DO $$
DECLARE
  v_teacher_id uuid := '00000000-0000-0000-0000-000000000000';  -- ⚠️ 실제 user_id 로 치환
  v_class_id   uuid;
  r            record;
  d            date;
BEGIN
  IF v_teacher_id = '00000000-0000-0000-0000-000000000000' THEN
    RAISE EXCEPTION 'v_teacher_id 를 실제 가입한 user_id 로 치환하세요';
  END IF;

  -- teacher 역할
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_teacher_id, 'teacher')
  ON CONFLICT DO NOTHING;

  -- teacher profile
  INSERT INTO public.teacher_profiles (user_id, studio_name, bio, location, cancellation_hours_before)
  VALUES (v_teacher_id, '온매트 스튜디오', '하타요가 / 정렬 위주 수업', '서울 강남구', 24)
  ON CONFLICT (user_id) DO NOTHING;

  -- students 5명 (invite_code 는 trigger 가 자동 생성)
  INSERT INTO public.student_profiles (teacher_id, name, phone, phone_consent_at, status, memo)
  VALUES
    (v_teacher_id, '김미정', '010-1111-1111', now(), 'active', '오십견 회복 중 — 어깨 무리 X'),
    (v_teacher_id, '이수진', '010-2222-2222', now(), 'active', '매주 화요일 야간조 가능'),
    (v_teacher_id, '박지현',  NULL,           NULL,  'active', '전화번호 미수집'),
    (v_teacher_id, '최은영', '010-4444-4444', now(), 'paused', '출산 휴식 중'),
    (v_teacher_id, '정하늘',  NULL,           NULL,  'active', '신규 — 첫 수업 후 follow-up');

  -- teacher_students N:M
  INSERT INTO public.teacher_students (teacher_id, student_profile_id, status)
  SELECT v_teacher_id, id, status
  FROM public.student_profiles
  WHERE teacher_id = v_teacher_id;

  -- class
  INSERT INTO public.classes (teacher_id, title, description, location, capacity, is_active)
  VALUES (v_teacher_id, '월수금 오전 하타요가', '느린 호흡과 정렬 위주 90분', '온매트 스튜디오 A룸', 10, true)
  RETURNING id INTO v_class_id;

  -- schedules: 월(1), 수(3), 금(5) 09:00-10:30
  INSERT INTO public.class_schedules (class_id, day_of_week, start_time, end_time)
  VALUES
    (v_class_id, 1, '09:00', '10:30'),
    (v_class_id, 3, '09:00', '10:30'),
    (v_class_id, 5, '09:00', '10:30');

  -- 클래스에 5명 모두 배정 (paused 회원도 등록은 유지)
  INSERT INTO public.class_students (class_id, student_id, status)
  SELECT v_class_id, id, status
  FROM public.student_profiles
  WHERE teacher_id = v_teacher_id;

  -- memberships: 혼합 타입
  --   김미정: count 10회 (4회 사용)
  --   이수진: period_weekly 주3 × 1개월
  --   박지현: period_unlimited 1개월
  --   최은영: count 5회 (paused — 휴면)
  --   정하늘: count 20회 (0회 사용 — 신규)
  FOR r IN
    SELECT id, name FROM public.student_profiles
    WHERE teacher_id = v_teacher_id
    ORDER BY name
  LOOP
    IF r.name = '김미정' THEN
      INSERT INTO public.memberships (student_id, class_id, type, total_count, used_count, start_date, end_date, status)
      VALUES (r.id, v_class_id, 'count', 10, 4, CURRENT_DATE - 14, CURRENT_DATE + 46, 'active');
    ELSIF r.name = '이수진' THEN
      INSERT INTO public.memberships (student_id, class_id, type, weekly_limit, start_date, end_date, status)
      VALUES (r.id, v_class_id, 'period_weekly', 3, CURRENT_DATE - 7, CURRENT_DATE + 23, 'active');
    ELSIF r.name = '박지현' THEN
      INSERT INTO public.memberships (student_id, class_id, type, start_date, end_date, status)
      VALUES (r.id, v_class_id, 'period_unlimited', CURRENT_DATE - 7, CURRENT_DATE + 23, 'active');
    ELSIF r.name = '최은영' THEN
      INSERT INTO public.memberships (student_id, class_id, type, total_count, used_count, start_date, end_date, status)
      VALUES (r.id, v_class_id, 'count', 5, 1, CURRENT_DATE - 30, CURRENT_DATE + 30, 'paused');
    ELSIF r.name = '정하늘' THEN
      INSERT INTO public.memberships (student_id, class_id, type, total_count, used_count, start_date, end_date, status)
      VALUES (r.id, v_class_id, 'count', 20, 0, CURRENT_DATE, CURRENT_DATE + 60, 'active');
    END IF;
  END LOOP;

  -- attendance: 이번 주 월/수/금 중 오늘까지
  FOR d IN
    SELECT generate_series(
      date_trunc('week', CURRENT_DATE)::date,
      LEAST((date_trunc('week', CURRENT_DATE) + INTERVAL '4 days')::date, CURRENT_DATE),
      INTERVAL '2 days'
    )::date
  LOOP
    INSERT INTO public.attendance (teacher_id, student_id, class_id, attendance_date, status, source, deducted, memo)
    SELECT
      v_teacher_id,
      sp.id,
      v_class_id,
      d,
      CASE
        WHEN sp.name = '최은영' THEN 'absent'                                          -- paused
        WHEN sp.name = '정하늘' AND d = date_trunc('week', CURRENT_DATE)::date THEN 'late'
        WHEN sp.name = '박지현' AND d = date_trunc('week', CURRENT_DATE)::date THEN 'makeup'
        ELSE 'present'
      END,
      'teacher_manual',
      CASE WHEN sp.name = '최은영' THEN false ELSE true END,
      NULL
    FROM public.student_profiles sp
    WHERE sp.teacher_id = v_teacher_id;
  END LOOP;

  RAISE NOTICE 'Phase 1 test seed applied. teacher_id=%, class_id=%', v_teacher_id, v_class_id;
END $$;
