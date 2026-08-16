-- Every account now gets a profile row the moment it is created, seeded with
-- the part of the email before the @. That removes the client-side upsert
-- (which failed after column-level grants, because ON CONFLICT DO UPDATE also
-- writes `id` and members no longer hold UPDATE on that column) and guarantees
-- a display name exists, so posts are never attributed to a placeholder.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(split_part(coalesce(new.email, ''), '@', 1), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill anyone who registered before the trigger existed.
update public.profiles p
   set display_name = nullif(split_part(coalesce(u.email, ''), '@', 1), '')
  from auth.users u
 where u.id = p.id and (p.display_name is null or btrim(p.display_name) = '');

-- Usernames were never used; a single display name is enough.
alter table public.profiles drop column if exists username;

-- Re-issue the column grant without the dropped column.
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_path, bio) on public.profiles to authenticated;

drop function if exists public.list_members();
create function public.list_members()
returns table (id uuid, display_name text, is_admin boolean, is_moderator boolean, setup_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.display_name, p.is_admin, p.is_moderator,
         (select count(*) from public.setups s where s.owner_id = p.id)
  from public.profiles p
  where exists (select 1 from public.profiles me where me.id = auth.uid() and me.is_admin)
  order by p.is_admin desc, p.is_moderator desc, p.display_name nulls last;
$$;

revoke all on function public.list_members() from public, anon;
grant execute on function public.list_members() to authenticated;
