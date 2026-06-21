-- 네비 배지(방 안읽음)를 현재 보이는 요가원 범위로 한정
--
-- 기존 chat_unread_count() 는 가입한 모든 방(다른 요가원 포함)을 세서,
-- 활성 요가원 목록엔 안 보이는 방까지 배지에 잡히는 불일치 발생.
-- p_studio_ids 로 받은 요가원의 방만 센다. (선생님=활성 요가원, 수련생=가입 요가원들)
-- null 이면 기존처럼 전체 (하위호환).

DROP FUNCTION IF EXISTS public.chat_unread_count();

CREATE OR REPLACE FUNCTION public.chat_unread_count(p_studio_ids uuid[] DEFAULT NULL)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  with my_rooms as (
    select m.room_id, m.last_read_at, r0.studio_id
    from chat_room_members m
    join chat_rooms r0 on r0.id = m.room_id
    where m.user_id = auth.uid()
    union
    select r.id, null::timestamptz, r.studio_id
    from chat_rooms r
    where r.scope = 'studio'
      and is_studio_member(r.studio_id)
      and not exists (
        select 1 from chat_room_members m
        where m.room_id = r.id and m.user_id = auth.uid()
      )
  )
  select count(*)::int
  from my_rooms mr
  where (p_studio_ids is null or mr.studio_id = any(p_studio_ids))
    and exists (
      select 1 from chat_messages c
      where c.room_id = mr.room_id
        and c.sender_id <> auth.uid()
        and c.created_at > coalesce(mr.last_read_at, 'epoch'::timestamptz)
    );
$function$;
