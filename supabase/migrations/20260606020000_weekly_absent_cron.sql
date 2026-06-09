-- 주간 자동 결석 마감 cron (PRD §4)
--
-- 대상: period_weekly 타입 활성 수업권
-- 동작: 이번 주(월~일)에 출석 카운트가 weekly_limit 미만이면, 등록된 클래스 스케줄 중
--       오늘 이전 + attendance 없는 날짜에 system_auto / absent 행 생성 (잔여 슬롯 수만큼).
--
-- 실행: 매주 일요일 23:59 KST (= UTC 일요일 14:59) via pg_cron
--
-- 주의:
--   - day_of_week (0=일, 6=토) ↔ date_trunc('week') (월요일 시작) 간 변환에 EXTRACT(DOW) 사용
--   - 멱등: 같은 (class_id, student_id, date) 에 이미 attendance 가 있으면 ON CONFLICT 로 skip

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.process_weekly_absences()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count       int := 0;
  v_week_start  date := date_trunc('week', (now() AT TIME ZONE 'Asia/Seoul')::date)::date;
  v_week_end    date := v_week_start + 6;
  v_today_kst   date := (now() AT TIME ZONE 'Asia/Seoul')::date;
  v_membership  record;
  v_existing    int;
  v_remaining   int;
  v_slot        record;
BEGIN
  FOR v_membership IN
    SELECT m.id, m.student_id, m.class_id, m.weekly_limit
    FROM public.memberships m
    WHERE m.status = 'active'
      AND m.type = 'period_weekly'
      AND m.start_date <= v_week_end
      AND m.end_date   >= v_week_start
      AND m.weekly_limit IS NOT NULL
      AND m.weekly_limit > 0
  LOOP
    -- 이번 주 attendance 카운트 (모든 상태 포함 — 슬롯 점유 기준)
    SELECT COUNT(*) INTO v_existing
    FROM public.attendance a
    WHERE a.student_id = v_membership.student_id
      AND a.attendance_date BETWEEN v_week_start AND v_week_end
      AND (v_membership.class_id IS NULL OR a.class_id = v_membership.class_id);

    v_remaining := v_membership.weekly_limit - v_existing;
    IF v_remaining <= 0 THEN CONTINUE; END IF;

    -- 등록된 클래스의 이번 주 스케줄 중 오늘 이전 + attendance 없는 날짜
    FOR v_slot IN
      SELECT
        c.id AS class_id,
        c.teacher_id,
        d::date AS sched_date
      FROM public.class_students cs
      JOIN public.classes c ON c.id = cs.class_id
      JOIN public.class_schedules sch ON sch.class_id = c.id
      CROSS JOIN LATERAL generate_series(v_week_start, v_week_end, '1 day'::interval) d
      WHERE cs.student_id = v_membership.student_id
        AND cs.status = 'active'
        AND c.is_active
        AND (v_membership.class_id IS NULL OR c.id = v_membership.class_id)
        AND EXTRACT(DOW FROM d)::int = sch.day_of_week
        AND d::date <= v_today_kst
        AND NOT EXISTS (
          SELECT 1 FROM public.attendance a
          WHERE a.student_id = v_membership.student_id
            AND a.class_id = c.id
            AND a.attendance_date = d::date
        )
      ORDER BY d ASC
      LIMIT v_remaining
    LOOP
      INSERT INTO public.attendance (
        teacher_id, student_id, class_id, attendance_date, status, source, deducted
      ) VALUES (
        v_slot.teacher_id, v_membership.student_id, v_slot.class_id,
        v_slot.sched_date, 'absent', 'system_auto', false
      )
      ON CONFLICT (class_id, student_id, attendance_date) DO NOTHING;

      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_weekly_absences() FROM PUBLIC;

-- pg_cron 등록: 일요일 14:59 UTC = 일요일 23:59 KST
SELECT cron.schedule(
  'weekly-absent-marking',
  '59 14 * * 0',
  $$SELECT public.process_weekly_absences();$$
);
