-- 출석 + 수업권 차감 트랜잭션 RPC
-- PRD 정책:
--   횟수권(count)  : present/late/makeup → used_count +1, deducted=true
--                    absent/canceled → 차감 없음
--   기간권+주N회   : 슬롯 카운트는 매주 cron 이 마감. 개별 출석에서 차감 X.
--   기간권 무제한  : 차감 X
--
-- 멱등성: 같은 (class_id, student_id, attendance_date) 에 대해 호출되면 기존 row 갱신.
--         차감 상태(`deducted`) 가 바뀌면 그에 맞게 used_count 보정.

CREATE OR REPLACE FUNCTION public.mark_attendance(
  p_class_id        uuid,
  p_student_id      uuid,
  p_attendance_date date,
  p_status          text,
  p_source          text DEFAULT 'teacher_manual',
  p_memo            text DEFAULT NULL
)
RETURNS public.attendance
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_teacher_id     uuid;
  v_existing       public.attendance%ROWTYPE;
  v_membership     public.memberships%ROWTYPE;
  v_should_deduct  boolean;
  v_was_deducted   boolean := false;
  v_result         public.attendance;
BEGIN
  -- 권한: 호출자가 그 class 의 선생님이어야 함
  SELECT teacher_id INTO v_teacher_id FROM public.classes WHERE id = p_class_id;
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'class not found: %', p_class_id USING ERRCODE = 'P0002';
  END IF;
  IF v_teacher_id <> auth.uid() THEN
    RAISE EXCEPTION 'not your class' USING ERRCODE = '42501';
  END IF;

  -- 상태 검증
  IF p_status NOT IN ('present', 'late', 'makeup', 'absent', 'canceled') THEN
    RAISE EXCEPTION 'invalid status: %', p_status USING ERRCODE = '22023';
  END IF;

  -- 출석 차감 대상 여부
  v_should_deduct := p_status IN ('present', 'late', 'makeup');

  -- 현재 활성 횟수권 (가장 최근 끝나는 것)
  SELECT * INTO v_membership
  FROM public.memberships
  WHERE student_id = p_student_id
    AND status = 'active'
    AND type = 'count'
    AND start_date <= p_attendance_date
    AND end_date   >= p_attendance_date
  ORDER BY end_date DESC
  LIMIT 1;

  -- 기존 출석 row 가 있는지 확인 (멱등 처리)
  SELECT * INTO v_existing
  FROM public.attendance
  WHERE class_id = p_class_id
    AND student_id = p_student_id
    AND attendance_date = p_attendance_date;

  IF FOUND THEN
    v_was_deducted := v_existing.deducted;

    -- 이전엔 차감했는데 이번엔 차감 안 함 → 복구
    IF v_was_deducted AND NOT v_should_deduct THEN
      IF v_membership.id IS NOT NULL THEN
        UPDATE public.memberships
           SET used_count = GREATEST(0, used_count - 1)
         WHERE id = v_membership.id;
      END IF;
    -- 이전엔 차감 안 했는데 이번엔 차감 → 신규 차감
    ELSIF NOT v_was_deducted AND v_should_deduct THEN
      IF v_membership.id IS NOT NULL THEN
        UPDATE public.memberships
           SET used_count = used_count + 1
         WHERE id = v_membership.id;
      END IF;
    END IF;

    UPDATE public.attendance
       SET status   = p_status,
           source   = p_source,
           memo     = p_memo,
           deducted = (v_should_deduct AND v_membership.id IS NOT NULL),
           teacher_id = v_teacher_id
     WHERE id = v_existing.id
    RETURNING * INTO v_result;
  ELSE
    -- 신규 INSERT
    IF v_should_deduct AND v_membership.id IS NOT NULL THEN
      UPDATE public.memberships
         SET used_count = used_count + 1
       WHERE id = v_membership.id;
    END IF;

    INSERT INTO public.attendance (
      teacher_id, student_id, class_id, attendance_date, status, source, memo, deducted
    ) VALUES (
      v_teacher_id, p_student_id, p_class_id, p_attendance_date, p_status, p_source, p_memo,
      v_should_deduct AND v_membership.id IS NOT NULL
    )
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_attendance(uuid, uuid, date, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_attendance(uuid, uuid, date, text, text, text) TO authenticated;

-- 출석 취소 (status='canceled' 로 두고 차감 복구). mark_attendance(..., 'canceled') 와 동일.
CREATE OR REPLACE FUNCTION public.cancel_attendance(
  p_attendance_id uuid,
  p_memo          text DEFAULT NULL
)
RETURNS public.attendance
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row public.attendance%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.attendance WHERE id = p_attendance_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'attendance not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_row.teacher_id <> auth.uid() THEN
    RAISE EXCEPTION 'not your attendance' USING ERRCODE = '42501';
  END IF;

  RETURN public.mark_attendance(
    v_row.class_id,
    v_row.student_id,
    v_row.attendance_date,
    'canceled',
    v_row.source,
    COALESCE(p_memo, v_row.memo)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_attendance(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_attendance(uuid, text) TO authenticated;
