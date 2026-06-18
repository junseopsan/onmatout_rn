-- join_studio_by_code: created(신규 생성) 경로에서도 가입 회원의 전화번호를 저장한다.
-- 기존엔 phone 을 안 넣어 선생님 화면에 "전화번호 미수집"으로 보였다.
-- 클라이언트가 이미 보내는 p_phone_variants 에서 표준 표기(010-XXXX-XXXX)를 골라 저장하므로
-- 앱 재빌드 없이 동작한다. (시그니처 동일 → create or replace 로 교체)
create or replace function join_studio_by_code(p_code text, p_user_id uuid, p_phone_variants text[])
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_studio  pivot_studios;
  v_profile student_profiles;
  v_name    text;
  v_phone   text;
begin
  if p_code is null or btrim(p_code) = '' then raise exception 'CODE_REQUIRED'; end if;

  select * into v_studio from pivot_studios where upper(invite_code) = upper(btrim(p_code)) limit 1;
  if v_studio.id is null then raise exception 'STUDIO_NOT_FOUND'; end if;

  -- 이미 이 요가원 멤버면 멱등 반환
  select * into v_profile from student_profiles
   where studio_id = v_studio.id and user_id = p_user_id limit 1;
  if v_profile.id is not null then
    return jsonb_build_object('studio_id', v_studio.id, 'studio_name', v_studio.name,
      'student_profile_id', v_profile.id, 'matched', false, 'already', true, 'created', false);
  end if;

  -- 전화 매칭 (미가입 명단)
  if p_phone_variants is not null and array_length(p_phone_variants, 1) > 0 then
    select * into v_profile from student_profiles
     where studio_id = v_studio.id and user_id is null and phone = any(p_phone_variants)
     order by created_at asc limit 1;
  end if;

  if v_profile.id is not null then
    update student_profiles
       set user_id = p_user_id, invite_code_used_at = now(), updated_at = now()
     where id = v_profile.id;
    return jsonb_build_object('studio_id', v_studio.id, 'studio_name', v_studio.name,
      'student_profile_id', v_profile.id, 'matched', true, 'already', false, 'created', false);
  end if;

  -- 없으면 신규 수련생 생성 (가입 계정의 전화번호도 함께 저장)
  v_name := coalesce((select name from user_profiles where user_id = p_user_id), '신규 회원');

  -- p_phone_variants 중 표준 표기(010-XXXX-XXXX) 우선, 없으면 010XXXXXXXX
  if p_phone_variants is not null and array_length(p_phone_variants, 1) > 0 then
    select v into v_phone from unnest(p_phone_variants) as v where v ~ '^010-[0-9]{4}-[0-9]{4}$' limit 1;
    if v_phone is null then
      select v into v_phone from unnest(p_phone_variants) as v where v ~ '^010[0-9]{8}$' limit 1;
    end if;
  end if;

  insert into student_profiles
    (teacher_id, user_id, name, phone, phone_consent_at, status, studio_id, invite_code_used_at, created_at, updated_at)
  values
    (v_studio.owner_id, p_user_id, v_name, v_phone,
     case when v_phone is not null then now() else null end,
     'active', v_studio.id, now(), now(), now())
  returning * into v_profile;

  return jsonb_build_object('studio_id', v_studio.id, 'studio_name', v_studio.name,
    'student_profile_id', v_profile.id, 'matched', false, 'already', false, 'created', true);
end $$;

grant execute on function join_studio_by_code(text, uuid, text[]) to authenticated;
