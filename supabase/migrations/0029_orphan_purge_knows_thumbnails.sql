-- NOT YET APPLIED — run this in the Supabase SQL editor.
--
-- Photos uploaded from the thumbnail change onwards live under `photos/`, with
-- a small copy at the same name under `photos/thumbs/`. Nothing in the database
-- points at the small copy: it is derived from a path that is. So the orphan
-- scan classifies every thumbnail as unreferenced.
--
-- The purge route already refuses to delete anything under `photos/thumbs/`,
-- so no thumbnail can be swept even without this migration — but until it is
-- applied, the admin page's orphan and purgeable counts are inflated by the
-- number of thumbnails, and the button will report removing fewer files than
-- it offered. This teaches both functions that a thumbnail is referenced
-- exactly when the photo it belongs to is.

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
  ),
  -- A thumbnail counts as referenced whenever its full-size photo is.
  reachable as (
    select p from referenced
    union
    select 'photos/thumbs/' || substring(p from 8) from referenced where p like 'photos/%'
  )
  select o.name::text,
         coalesce((o.metadata->>'size')::bigint, 0),
         o.created_at
  from storage.objects o
  where o.bucket_id = 'setup-images'
    and o.created_at < now() - make_interval(hours => greatest(coalesce(p_min_age_hours, 24), 1))
    and not exists (select 1 from reachable r where r.p = o.name)
  order by o.created_at;
end;
$$;

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
  reachable as (
    select path from referenced
    union
    select 'photos/thumbs/' || substring(path from 8) from referenced where path like 'photos/%'
  ),
  files as (
    select o.name, coalesce((o.metadata->>'size')::bigint, 0) as bytes, o.created_at,
           exists (select 1 from reachable r where r.path = o.name) as in_use
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
      'purgeableFiles', (select count(*) from files where not in_use and created_at < now() - interval '24 hours'),
      'purgeableBytes', (select coalesce(sum(bytes), 0) from files where not in_use and created_at < now() - interval '24 hours'),
      'largestBytes', (select coalesce(max(bytes), 0) from files)
    ),
    'database', jsonb_build_object(
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
