-- Applied remotely as: thumbnail_backfill
--
-- Photos uploaded before thumbnails existed sit under `covers/` and have no
-- small copy, so cards still download the full image for them. Generating one
-- means decoding and re-encoding the photo, which only a browser can do here —
-- so the backfill runs from the admin page, in the admin's own session.
--
-- Two things stand in its way. Storage only lets a member insert objects they
-- own, and an admin repointing another member's photo has no rights on that
-- member's rows. Both are widened for admins only, mirroring the existing
-- "admins delete any setup image" policy.

create policy "admins upload any setup image"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'setup-images'
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
  );

-- Referenced photos that predate the `photos/` convention, oldest first.
create or replace function public.list_legacy_photos()
returns table (path text, bytes bigint)
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
  )
  select r.p, coalesce((o.metadata->>'size')::bigint, 0)
  from referenced r
  join storage.objects o on o.bucket_id = 'setup-images' and o.name = r.p
  where r.p not like 'photos/%'
  order by o.created_at;
end;
$$;

-- Point every row at the re-uploaded copy, and hand the new objects to the
-- member who owns the setup — otherwise deleting their own setup later would
-- leave the files behind, since storage deletes are owner-scoped.
create or replace function public.repoint_photo(p_old text, p_new text)
returns int
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  moved int := 0;
  n int;
  new_owner uuid;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  if p_old is null or p_new is null or p_new not like 'photos/%' or p_new like 'photos/thumbs/%' then
    raise exception 'bad path' using errcode = '22023';
  end if;

  select owner_id into new_owner from public.setups where cover_path = p_old limit 1;
  if new_owner is null then
    select s.owner_id into new_owner
      from public.setup_images si join public.setups s on s.id = si.setup_id
     where si.path = p_old limit 1;
  end if;
  -- Nothing references it: refuse rather than strand a fresh upload.
  if new_owner is null then return 0; end if;

  update public.setups set cover_path = p_new where cover_path = p_old;
  get diagnostics n = row_count; moved := moved + n;
  update public.setup_images set path = p_new where path = p_old;
  get diagnostics n = row_count; moved := moved + n;

  update storage.objects
     set owner = new_owner, owner_id = new_owner::text
   where bucket_id = 'setup-images'
     and name in (p_new, 'photos/thumbs/' || substring(p_new from 8));

  return moved;
end;
$$;

-- Surface the backlog next to the other storage figures, so the admin page can
-- show how much is left without a second round-trip.
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
  ),
  legacy as (
    select f.bytes from referenced r join files f on f.name = r.path
     where r.path not like 'photos/%' and r.path not like 'avatars/%'
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
      'legacyFiles',  (select count(*) from legacy),
      'legacyBytes',  (select coalesce(sum(bytes), 0) from legacy),
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

revoke all on function public.list_legacy_photos() from public, anon;
revoke all on function public.repoint_photo(text, text) from public, anon;
grant execute on function public.list_legacy_photos() to authenticated;
grant execute on function public.repoint_photo(text, text) to authenticated;
