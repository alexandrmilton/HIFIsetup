-- RLS controls which ROWS a role may touch, never which COLUMNS. Both
-- "users update their profile" and "members update own setups" therefore let a
-- signed-in user PATCH any column of their own row through PostgREST — including
-- profiles.is_admin (instant self-promotion) and setups.moderation_status
-- (self-approving past the moderation queue). Column-level grants close that,
-- and the privileged writes move into SECURITY DEFINER functions that check the
-- caller's role internally.

alter table public.setups add column if not exists country text;

-- Profiles: members may only edit their own presentation fields.
revoke update on public.profiles from authenticated;
grant update (display_name, username, avatar_path, bio) on public.profiles to authenticated;
drop policy if exists "admins manage profiles" on public.profiles;

-- Setups: members may only edit content, never moderation state or ownership.
revoke update on public.setups from authenticated;
grant update (
  title, city, country, description, cover_path, is_published,
  room_size, has_acoustic_treatment, acoustic_notes, listening_notes, budget_range
) on public.setups to authenticated;
drop policy if exists "admins update any setup" on public.setups;
drop policy if exists "moderators update any setup" on public.setups;

-- Moderation now runs through a checked function instead of a raw column write.
create or replace function public.moderate_setup(p_slug text, p_status public.moderation_status, p_note text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  select coalesce(is_admin, false) or coalesce(is_moderator, false)
    into allowed
  from public.profiles where id = auth.uid();

  if not coalesce(allowed, false) then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  update public.setups
     set moderation_status = p_status,
         moderation_note = p_note,
         reviewed_at = now()
   where slug = p_slug;

  return found;
end;
$$;

-- Granting the moderator role likewise: admins only, and only that one column.
create or replace function public.set_member_moderator(p_user_id uuid, p_is_moderator boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  update public.profiles set is_moderator = p_is_moderator where id = p_user_id;
  return found;
end;
$$;

revoke all on function public.moderate_setup(text, public.moderation_status, text) from public, anon;
revoke all on function public.set_member_moderator(uuid, boolean) from public, anon;
grant execute on function public.moderate_setup(text, public.moderation_status, text) to authenticated;
grant execute on function public.set_member_moderator(uuid, boolean) to authenticated;

-- Staff-only listing should never be callable by signed-out visitors.
revoke all on function public.list_members() from anon;

-- Pin the trigger's search_path so it cannot be hijacked by a shadowed schema.
create or replace function public.touch_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
