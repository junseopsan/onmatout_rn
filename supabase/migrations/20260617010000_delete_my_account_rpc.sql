-- 회원 탈퇴: 본인 데이터 + auth 계정 완전 삭제
-- 정책:
--   - 소유한 요가원이 있으면 차단(STUDIO_EXISTS) → 앱에서 먼저 요가원 삭제/이전
--   - 내가 수련생으로 등록된 student_profiles 는 삭제(출석/수업권 등 CASCADE)
--   - auth.users 까지 완전 삭제(같은 번호로 재가입 시 새 계정)
create or replace function delete_my_account()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  -- 소유 요가원이 있으면 차단
  if exists (select 1 from pivot_studios where owner_id = v_uid) then
    raise exception 'STUDIO_EXISTS';
  end if;

  -- 내가 작성한 콘텐츠/연결 (auth FK 없는 것들은 명시 삭제)
  delete from routine_comments where user_id = v_uid;
  delete from routine_likes    where user_id = v_uid;
  delete from routines         where teacher_id = v_uid;        -- routine_items CASCADE
  delete from chat_messages    where sender_id = v_uid;
  delete from chat_room_members where user_id = v_uid;
  delete from studio_teachers  where teacher_id = v_uid;

  -- 내가 수련생으로 등록된 프로필 (출석/수업권/예약 등 CASCADE)
  delete from student_profiles where user_id = v_uid;

  -- 역할/토큰/기록/프로필
  delete from user_roles           where user_id = v_uid;
  delete from user_push_tokens     where user_id = v_uid;
  delete from practice_records     where user_id = v_uid;
  delete from user_favorite_asanas where user_id = v_uid;
  delete from user_profiles        where user_id = v_uid;

  -- auth 계정 완전 삭제
  delete from auth.users where id = v_uid;

  return jsonb_build_object('deleted', true);
end $$;

revoke execute on function delete_my_account() from public;
grant execute on function delete_my_account() to authenticated;
