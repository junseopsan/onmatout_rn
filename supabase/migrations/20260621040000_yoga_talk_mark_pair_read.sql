-- 요가톡 읽음 처리도 페어(사제) 단위로 — 롤업 안읽음과 일치
--
-- 안읽음은 페어의 기본+토픽 스레드를 합산(롤업)하는데, 기존 yoga_talk_mark_read 는
-- 해당 스레드 1개만 읽음 처리해서, 대화를 읽어도 토픽 스레드의 안읽음이 남아
-- 빨간점/목록 안읽음이 안 사라지는 문제. 대화(기본 스레드)를 열면 그 페어의
-- 모든 스레드를 읽음 처리한다.

CREATE OR REPLACE FUNCTION public.yoga_talk_mark_read(p_thread_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_teacher uuid;
  v_student uuid;
BEGIN
  SELECT teacher_id, student_id INTO v_teacher, v_student
  FROM public.yoga_talk_threads
  WHERE id = p_thread_id;
  IF v_teacher IS NULL THEN
    RETURN;
  END IF;
  -- 당사자(선생님 본인 or 회원 본인)만
  IF NOT (v_teacher = auth.uid() OR public.is_my_student_profile(v_student)) THEN
    RETURN;
  END IF;
  -- 페어의 모든 스레드를 읽음 처리
  INSERT INTO public.yoga_talk_thread_reads (user_id, thread_id, last_read_at)
  SELECT auth.uid(), t.id, now()
  FROM public.yoga_talk_threads t
  WHERE t.teacher_id = v_teacher
    AND t.student_id = v_student
  ON CONFLICT (user_id, thread_id) DO UPDATE SET last_read_at = now();
END;
$function$;
