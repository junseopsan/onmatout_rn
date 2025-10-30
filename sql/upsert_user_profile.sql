-- SECURITY DEFINER RPC로 세션 없이도 프로필 업서트 가능하도록 처리
-- 주의: 함수 소유자는 RLS를 우회할 권한이 있는 롤이어야 합니다 (기본 postgres)

create or replace function public.upsert_user_profile(
  p_user_id uuid,
  p_name text
)
returns public.user_profiles
language sql
security definer
set search_path = public
as $$
  insert into public.user_profiles (user_id, name)
  values (p_user_id, p_name)
  on conflict (user_id)
  do update set
    name = excluded.name,
    updated_at = now()
  returning *;
$$;

revoke all on function public.upsert_user_profile(uuid, text) from public;
grant execute on function public.upsert_user_profile(uuid, text) to anon, authenticated;


