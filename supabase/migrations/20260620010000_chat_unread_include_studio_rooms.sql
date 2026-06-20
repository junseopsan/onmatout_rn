-- 요가톡 탭 안읽음 빨간점: 요가원 전체 Q&A(scope='studio') 방 누락 수정.
-- studio 방은 동적 멤버십이라 chat_room_members 행이 없어 안읽음/읽음 추적에서 빠졌다.
-- 입장 시 멤버 행을 upsert(읽음 추적용)하고, 카운트도 studio 방을 포함하게.

create or replace function mark_room_read(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not is_room_member(p_room_id) then return; end if;
  insert into chat_room_members (room_id, user_id, role, last_read_at)
  values (
    p_room_id, auth.uid(),
    coalesce((select 'teacher' from pivot_studios s
              join chat_rooms r on r.studio_id = s.id
              where r.id = p_room_id and s.owner_id = auth.uid()), 'student'),
    now()
  )
  on conflict (room_id, user_id)
  do update set last_read_at = now();
end;
$function$;

create or replace function chat_unread_count()
returns integer
language sql
security definer
set search_path to 'public'
as $function$
  with my_rooms as (
    select m.room_id, m.last_read_at
    from chat_room_members m
    where m.user_id = auth.uid()
    union
    select r.id, null::timestamptz
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
  where exists (
    select 1 from chat_messages c
    where c.room_id = mr.room_id
      and c.sender_id <> auth.uid()
      and c.created_at > coalesce(mr.last_read_at, 'epoch'::timestamptz)
  );
$function$;
