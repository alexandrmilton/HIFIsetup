-- The admin page reported pg_database_size('postgres') while Supabase's usage
-- page sums every database on the instance, so the two never agreed: 12 MB
-- against 27 MB for the same moment. Report the same total Supabase does, and
-- show the app's own schema size beside it — that is the only part that grows
-- with usage; the rest is pg_catalog plus the auth and storage schemas every
-- project carries from day one (1.9 MB of app data inside a 27 MB instance).
--
-- Storage counting also dropped its single-bucket filter, so a bucket added
-- later cannot quietly accumulate files the page never reports.
--
-- Applied remotely as: align_admin_stats_with_supabase.

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
      -- Matches the figure on Supabase's usage page.
      'bytes',      (select coalesce(sum(pg_database_size(datname)), 0) from pg_database),
      'appBytes',   (select coalesce(sum(pg_total_relation_size(c.oid)), 0)
                       from pg_class c join pg_namespace n on n.oid = c.relnamespace
                      where n.nspname = 'public' and c.relkind in ('r','m','i','t')),
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
