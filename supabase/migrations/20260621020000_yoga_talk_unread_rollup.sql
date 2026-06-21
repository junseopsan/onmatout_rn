-- 요가톡 안읽음 카운트 롤업
--
-- 기존: 모든 스레드(기본+토픽)를 개별로 세서, 토픽 대화 안읽음이 빨간점을 켜지만
--       목록(기본 대화만)엔 안 떠서 "빨간점은 있는데 안읽은 대화가 없는" 불일치 발생.
-- 변경: 페어(사제)당 1개로 카운트 — 그 페어의 기본 OR 토픽 스레드 중 하나라도 안읽음이면 1.
--       목록은 페어당 1행이므로 빨간점 개수 == 목록의 안읽음 행 수.

CREATE OR REPLACE FUNCTION public.yoga_talk_unread_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT count(*)::int
  FROM public.yoga_talk_threads d
  WHERE d.is_default = true
    AND (
      d.teacher_id = auth.uid()
      OR public.is_my_student_profile(d.student_id)
    )
    AND EXISTS (
      SELECT 1
      FROM public.yoga_talk_threads t
      JOIN public.yoga_talk_messages m ON m.thread_id = t.id
      WHERE t.teacher_id = d.teacher_id
        AND t.student_id = d.student_id
        AND m.sender_id IS DISTINCT FROM auth.uid()
        AND m.created_at > COALESCE(
          (SELECT last_read_at FROM public.yoga_talk_thread_reads r
           WHERE r.user_id = auth.uid() AND r.thread_id = t.id),
          '1970-01-01'::timestamptz
        )
    );
$function$;
