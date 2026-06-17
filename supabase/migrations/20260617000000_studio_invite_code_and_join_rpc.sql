-- 요가원 단위 초대코드(OMS-) + 전화 자동매칭 가입 RPC
-- 회원별 코드(ONM-) 대신 요가원 단위 링크/QR 로 가입 → 전화번호로 미가입 명단과 자동 매칭

-- 1) 컬럼
alter table pivot_studios add column if not exists invite_code text;

-- 2) 코드 생성기 (OMS- 접두어, 모호문자 제외)
create or replace function generate_studio_invite_code() returns text
language plpgsql as $$
declare chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; code text := ''; i int;
begin
  for i in 1..5 loop
    code := code || substr(chars, floor(random()*length(chars))::int + 1, 1);
  end loop;
  return 'OMS-' || code;
end $$;

-- 3) insert 트리거: 비어있으면 유니크 코드 부여
create or replace function set_studio_invite_code() returns trigger
language plpgsql as $$
declare attempt int := 0; candidate text;
begin
  if new.invite_code is null or new.invite_code = '' then
    loop
      attempt := attempt + 1;
      candidate := generate_studio_invite_code();
      exit when not exists (select 1 from pivot_studios where invite_code = candidate);
      if attempt >= 10 then raise exception 'could not generate unique studio invite code'; end if;
    end loop;
    new.invite_code := candidate;
  end if;
  return new;
end $$;

drop trigger if exists trg_set_studio_invite_code on pivot_studios;
create trigger trg_set_studio_invite_code before insert on pivot_studios
for each row execute function set_studio_invite_code();

-- 4) 기존 행 백필 (충돌 방지 루프)
do $$
declare r record; candidate text; attempt int;
begin
  for r in select id from pivot_studios where invite_code is null or invite_code = '' loop
    attempt := 0;
    loop
      attempt := attempt + 1;
      candidate := generate_studio_invite_code();
      exit when not exists (select 1 from pivot_studios where invite_code = candidate);
      if attempt >= 20 then raise exception 'backfill: unique code failed'; end if;
    end loop;
    update pivot_studios set invite_code = candidate where id = r.id;
  end loop;
end $$;

-- 5) 유니크 인덱스
create unique index if not exists pivot_studios_invite_code_key on pivot_studios(invite_code);

-- 6) 가입 RPC: 코드 + 전화변형 → 매칭 연결 또는 신규 생성 (멱등)
create or replace function join_studio_by_code(p_code text, p_user_id uuid, p_phone_variants text[])
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_studio pivot_studios; v_profile student_profiles; v_name text;
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

  -- 없으면 신규 수련생 생성
  v_name := coalesce((select name from user_profiles where user_id = p_user_id), '신규 회원');
  insert into student_profiles (teacher_id, user_id, name, status, studio_id, invite_code_used_at, created_at, updated_at)
  values (v_studio.owner_id, p_user_id, v_name, 'active', v_studio.id, now(), now(), now())
  returning * into v_profile;

  return jsonb_build_object('studio_id', v_studio.id, 'studio_name', v_studio.name,
    'student_profile_id', v_profile.id, 'matched', false, 'already', false, 'created', true);
end $$;

grant execute on function join_studio_by_code(text, uuid, text[]) to authenticated;
