-- 시퀀스(루틴) 댓글 답글 알림
-- routine_comments 에 답글(parent_id IS NOT NULL)이 달리면,
-- "답글 대상 댓글"의 작성자에게 in-app 알림(notifications)을 생성한다.
-- (클라이언트는 RLS 상 남의 notifications 를 만들 수 없으므로 SECURITY DEFINER 트리거 사용 —
--  yoga_talk 등 기존 알림과 동일한 패턴.)
--
-- 푸시: onmatout 의 "notifications insert → send-push" 파이프라인을 그대로 탄다.
--       (yoga_talk/booking 알림과 동일. 별도 파이프라인이 없다면 이 트리거 끝에 pg_net 으로
--        send-push 를 호출하도록 확장하면 된다.)
--
-- Supabase SQL Editor에서 1회 실행. 재실행 안전.

CREATE OR REPLACE FUNCTION public.notify_routine_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user uuid;
  v_replier_name text;
BEGIN
  -- 답글이 아닌 최상위 댓글은 알림 없음
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 답글 대상(부모) 댓글의 작성자
  SELECT user_id INTO v_target_user
  FROM public.routine_comments
  WHERE id = NEW.parent_id;

  -- 대상이 없거나 본인에게 다는 답글이면 알림 생략
  IF v_target_user IS NULL OR v_target_user = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- 답글 작성자 이름
  SELECT COALESCE(name, '회원') INTO v_replier_name
  FROM public.user_profiles
  WHERE user_id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    v_target_user,
    'general',
    COALESCE(v_replier_name, '회원') || '님이 답글을 남겼어요',
    LEFT(NEW.content, 60),
    jsonb_build_object(
      'kind', 'routine_reply',
      'routine_id', NEW.routine_id,
      'comment_id', NEW.id,
      'parent_id', NEW.parent_id
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_routine_reply_notify ON public.routine_comments;
CREATE TRIGGER trg_routine_reply_notify
  AFTER INSERT ON public.routine_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_routine_reply();
