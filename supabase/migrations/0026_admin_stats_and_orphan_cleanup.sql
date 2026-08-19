-- Admin statistics page plus a safe orphan-file purge.
--
-- Storage has no foreign key back to the app tables, so deleting a setup left
-- its photos in the bucket forever. The delete route now removes them inline;
-- this covers everything already stranded, and anything a future hiccup leaves.
--
-- Applied remotely as: admin_stats_and_orphan_cleanup.

-- Everything the /admin/stats page needs, in one admin-gated call.
create or replace function public.get_admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  with referenced as (
    select cover_path as path from public.setups where cover_path is not null
    union select path from public.setup_images
    union select avatar_path from public.profiles where avatar_path is not null
  ),
  files as (
    select o.name, coalesce((o.metadata->>'size')::bigint, 0) as bytes, o.created_at,
           exists (select 1 from referenced r where r.path = o.name) as in_use
    from storage.objects o
    where o.bucket_id = 'setup-images'
  )
  select jsonb_build_object(
    'storage', jsonb_build_object(
      'files',        (select count(*) from files),
      'bytes',        (select coalesce(sum(bytes), 0) from files),
      'covers',       (select count(*) from public.setups where cover_path is not null),
      'gallery',      (select count(*) from public.setup_images),
      'avatars',      (select count(*) from public.profiles where avatar_path is not null),
      'orphanFiles',  (select count(*) from files where not in_use),
      'orphanBytes',  (select coalesce(sum(bytes), 0) from files where not in_use),
      -- Anything younger than a day may belong to a wizard someone still has open.
      'purgeableFiles', (select count(*) from files where not in_use and created_at < now() - interval '24 hours'),
      'purgeableBytes', (select coalesce(sum(bytes), 0) from files where not in_use and created_at < now() - interval '24 hours'),
      'largestBytes', (select coalesce(max(bytes), 0) from files)
    ),
    'database', jsonb_build_object(
      'bytes',      pg_database_size(current_database()),
      'setups',     (select count(*) from public.setups),
      'components', (select count(*) from public.components),
      'members',    (select count(*) from public.profiles),
      'comments',   (select count(*) from public.setup_comments),
      'likes',      (select count(*) from public.setup_likes)
    ),
    'content', jsonb_build_object(
      'pending',        (select count(*) from public.setups where moderation_status = 'pending'),
      'approved',       (select count(*) from public.setups where moderation_status = 'approved'),
      'rejected',       (select count(*) from public.setups where moderation_status = 'rejected'),
      'private',        (select count(*) from public.setups where not is_published),
      'admins',         (select count(*) from public.profiles where is_admin),
      'moderators',     (select count(*) from public.profiles where is_moderator),
      'memberAdded',    (select count(*) from public.components where submitted_by is not null),
      'seeded',         (select count(*) from public.components where submitted_by is null),
      'unusedComponents', (select count(*) from public.components c
                            where not exists (select 1 from public.setup_components sc where sc.component_id = c.id)),
      'setupsThisWeek', (select count(*) from public.setups where created_at > now() - interval '7 days'),
      'membersThisWeek',(select count(*) from public.profiles where created_at > now() - interval '7 days'),
      'withoutCover',   (select count(*) from public.setups where cover_path is null)
    )
  ) into result;

  return result;
end;
$$;

-- Orphans are files no setup cover, gallery row or avatar points at. The age
-- floor keeps a half-finished wizard's uploads out of the purge.
create or replace function public.list_orphan_images(p_min_age_hours int default 24)
returns table (path text, bytes bigint, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  return query
  with referenced as (
    select s.cover_path as p from public.setups s where s.cover_path is not null
    union select si.path from public.setup_images si
    union select pr.avatar_path from public.profiles pr where pr.avatar_path is not null
  )
  select o.name::text,
         coalesce((o.metadata->>'size')::bigint, 0),
         o.created_at
  from storage.objects o
  where o.bucket_id = 'setup-images'
    and o.created_at < now() - make_interval(hours => greatest(coalesce(p_min_age_hours, 24), 1))
    and not exists (select 1 from referenced r where r.p = o.name)
  order by o.created_at;
end;
$$;

revoke all on function public.get_admin_stats() from public, anon;
revoke all on function public.list_orphan_images(int) from public, anon;
grant execute on function public.get_admin_stats() to authenticated;
grant execute on function public.list_orphan_images(int) to authenticated;

-- Members may only delete their own uploads; purging orphans left behind by
-- other people's deleted setups needs an admin-scoped policy.
drop policy if exists "admins delete any setup image" on storage.objects;
create policy "admins delete any setup image" on storage.objects
  for delete to authenticated
  using (bucket_id = 'setup-images'
         and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin));
