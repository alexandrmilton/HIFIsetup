alter table public.profiles add column if not exists is_moderator boolean not null default false;

-- Moderators may change moderation state but never delete: the delete policy
-- added earlier stays admin-only, and this update policy is scoped to the
-- moderation columns by the API (RLS cannot restrict columns directly, so the
-- route handler is the column gate while this is the row gate).
create policy "moderators update any setup" on public.setups for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_moderator))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_moderator));

-- Admins may grant or revoke the moderator flag on other profiles.
create policy "admins manage profiles" on public.profiles for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin));

create or replace function public.list_members()
returns table (id uuid, display_name text, username text, is_admin boolean, is_moderator boolean, setup_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.display_name, p.username, p.is_admin, p.is_moderator,
         (select count(*) from public.setups s where s.owner_id = p.id)
  from public.profiles p
  where exists (select 1 from public.profiles me where me.id = auth.uid() and me.is_admin)
  order by p.is_admin desc, p.is_moderator desc, p.display_name nulls last;
$$;

revoke all on function public.list_members() from public;
grant execute on function public.list_members() to authenticated;
