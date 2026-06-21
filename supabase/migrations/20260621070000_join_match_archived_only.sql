-- 가입 시 전화번호 매칭을 "내보낸(archived) 회원 복원"으로만 한정.
--
-- 기존: user_id is null 인 미가입 프로필을 전화번호로 매칭해 연결 → 원장이 직접
--       만든 미가입 프로필까지 자동 연결됐음(이 기능 제거).
-- 변경: status='archived' 인 프로필만 매칭(=내보낸 회원 재가입 시 복원, 출석/수업
--       이력 유지). 그 외에는 매칭하지 않고 신규 프로필 생성.

CREATE OR REPLACE FUNCTION public.join_studio_by_code(p_code text, p_user_id uuid, p_phone_variants text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_studio  pivot_studios;
  v_profile student_profiles;
  v_name    text;
  v_phone   text;
begin
  if p_code is null or btrim(p_code) = '' then raise exception 'CODE_REQUIRED'; end if;

  select * into v_studio from pivot_studios where upper(invite_code) = upper(btrim(p_code)) limit 1;
  if v_studio.id is null then raise exception 'STUDIO_NOT_FOUND'; end if;

  select * into v_profile from student_profiles
   where studio_id = v_studio.id and user_id = p_user_id limit 1;
  if v_profile.id is not null then
    return jsonb_build_object('studio_id', v_studio.id, 'studio_name', v_studio.name,
      'student_profile_id', v_profile.id, 'matched', false, 'already', true, 'created', false);
  end if;

  -- 내보낸(archived) 회원 재가입 복원만 전화번호로 매칭 (직접 추가 미가입 프로필은 매칭 안 함)
  if p_phone_variants is not null and array_length(p_phone_variants, 1) > 0 then
    select * into v_profile from student_profiles
     where studio_id = v_studio.id and user_id is null and status = 'archived'
       and phone = any(p_phone_variants)
     order by created_at asc limit 1;
  end if;

  if v_profile.id is not null then
    -- 재연결: 내보내기(archived)된 회원을 active 로 복원 (출석/수업권/기록 유지)
    update student_profiles
       set user_id = p_user_id, status = 'active', invite_code_used_at = now(), updated_at = now()
     where id = v_profile.id;
    return jsonb_build_object('studio_id', v_studio.id, 'studio_name', v_studio.name,
      'student_profile_id', v_profile.id, 'matched', true, 'already', false, 'created', false);
  end if;

  v_name := coalesce((select name from user_profiles where user_id = p_user_id), '신규 회원');

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
end $function$;
