-- 수업 시작 시각 자동 출석 (PRD 보강)
--
-- 동작: 수업 시작 시각이 지난 'booked' 예약에 대해, 아직 출석 기록이 없으면
--       자동으로 present(출석) 기록을 생성한다. source='system_auto'.
--   - 횟수권(count)  : used_count +1, deducted=true  → 남은 횟수 감소(10→9)
--   - 주N회/무제한   : 기록만(present), 차감 없음(deducted=false)
--                      (주N회 슬롯 정산은 기존 weekly-absent-marking cron 이 담당)
--
-- 시작 시각 판정: KST 기준 (booking_date + class_schedules.start_time) <= now()
-- 멱등성: (class_id, student_id, attendance_date) UNIQUE + NOT EXISTS 가드.
--         cron 이 반복 실행돼도 중복 차감/기록 없음.
--
-- 참고: mark_attendance RPC 는 선생님(auth.uid) 권한이 필요해 cron 에서 못 쓰므로
--       동일한 차감 규칙을 시스템 함수로 별도 구현한다.

CREATE OR REPLACE FUNCTION public.process_class_start_attendance()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now_kst    timestamp := (now() AT TIME ZONE 'Asia/Seoul');
  v_today      date      := (now() AT TIME ZONE 'Asia/Seoul')::date;
  v_count      int := 0;
  v_b          record;
  v_membership public.memberships%ROWTYPE;
  v_teacher    uuid;
BEGIN
  FOR v_b IN
    SELECT DISTINCT b.class_id, b.student_id, b.booking_date
    FROM public.class_bookings b
    JOIN public.classes c ON c.id = b.class_id
    JOIN public.class_schedules sch
      ON sch.class_id = b.class_id
     AND sch.day_of_week = EXTRACT(DOW FROM b.booking_date)::int
    WHERE b.status = 'booked'
      AND c.is_active
      AND b.booking_date = v_today
      AND (b.booking_date + sch.start_time) <= v_now_kst
      AND NOT EXISTS (
        SELECT 1 FROM public.attendance a
        WHERE a.class_id = b.class_id
          AND a.student_id = b.student_id
          AND a.attendance_date = b.booking_date
      )
  LOOP
    SELECT teacher_id INTO v_teacher FROM public.classes WHERE id = v_b.class_id;

    -- 활성 횟수권 (가장 늦게 끝나는 것) — mark_attendance 와 동일 기준
    SELECT * INTO v_membership
    FROM public.memberships
    WHERE student_id = v_b.student_id
      AND status = 'active'
      AND type = 'count'
      AND start_date <= v_b.booking_date
      AND end_date   >= v_b.booking_date
    ORDER BY end_date DESC
    LIMIT 1;

    IF v_membership.id IS NOT NULL THEN
      UPDATE public.memberships
         SET used_count = used_count + 1
       WHERE id = v_membership.id;
    END IF;

    INSERT INTO public.attendance (
      teacher_id, student_id, class_id, attendance_date, status, source, deducted
    ) VALUES (
      v_teacher, v_b.student_id, v_b.class_id, v_b.booking_date,
      'present', 'system_auto', (v_membership.id IS NOT NULL)
    )
    ON CONFLICT (class_id, student_id, attendance_date) DO NOTHING;

    IF FOUND THEN
      v_count := v_count + 1;
    ELSIF v_membership.id IS NOT NULL THEN
      -- 동시 실행 등으로 이미 출석이 있어 INSERT 가 skip 되면 차감 롤백
      UPDATE public.memberships
         SET used_count = GREATEST(0, used_count - 1)
       WHERE id = v_membership.id;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_class_start_attendance() FROM PUBLIC;

-- 10분마다 실행
SELECT cron.schedule(
  'class-start-attendance',
  '*/10 * * * *',
  $$SELECT public.process_class_start_attendance();$$
);
